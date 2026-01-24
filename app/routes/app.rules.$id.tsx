import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSubmit, useNavigate, useNavigation, redirect, useActionData } from "react-router";
import { Page, Layout, Card, BlockStack, TextField, Button, InlineStack, Text, Badge, Checkbox, ResourceList, Thumbnail, ResourceItem, Box, Scrollable, Banner } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { ProductRuleService, ProductRuleUpsertSchema } from "../modules/ProductRules";
import { PetProfileService } from "../modules/PetProfiles";
import { WeightUtils } from "../modules/Core/WeightUtils";
import { useState, useMemo } from "react";
import { SkeletonLoadingPage } from "../components/SkeletonLoadingPage";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const { id } = params;
  const url = new URL(request.url);
  const copyFrom = url.searchParams.get("copyFrom");
  
  const settings = await PetProfileService.getSettings(session.shop);
  let rule = id !== "new" ? await ProductRuleService.getRule(session.shop, id!) : null;

  if (id === "new" && copyFrom) {
    const sourceRule = await ProductRuleService.getRule(session.shop, copyFrom);
    if (sourceRule) {
      rule = {
        ...sourceRule,
        id: "", // Ensure it's treated as new
        name: `${sourceRule.name} (Copy)`,
      };
    }
  }

  if (id !== "new" && !rule) {
    throw new Response("Not Found", { status: 404 });
  }

  let productData = [];
  if (rule?.productIds.length) {
    const response = await admin.graphql(`
      query getProducts($ids: [ID!]!) {
        nodes(ids: $ids) {
          ... on Product {
            id
            title
            featuredImage {
              url
            }
          }
        }
      }
    `, { variables: { ids: rule.productIds } });
    
    const json = await response.json();
    productData = json.data.nodes.filter(Boolean);
  }

  return { rule, settings, initialProductData: productData };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  
  if (formData.get("_action") === "delete") {
    await ProductRuleService.deleteRule(session.shop, params.id!);
    return redirect("/app/rules?revalidate=true");
  }

  const rawData = formData.get("rule");
  if (typeof rawData !== "string") {
    return { error: "Invalid data submitted" };
  }

  try {
    const parsedJson = JSON.parse(rawData);
    const validated = ProductRuleUpsertSchema.parse(parsedJson);

    await ProductRuleService.upsertRule(session.shop, {
      ...validated,
      id: params.id === "new" ? undefined : params.id
    });
    return redirect("/app/rules");
  } catch (error: any) {
    if (error.name === "ZodError") {
      return { error: error.errors.map((e: any) => e.message).join(", ") };
    }
    return { error: error.message };
  }
};

export default function RuleDetail() {
  const data = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  if (navigation.state === "loading" && !data) {
    return <SkeletonLoadingPage primaryAction />;
  }

  if (!data) return null;
  const { rule, settings, initialProductData } = data;
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const navigate = useNavigate();

  const [name, setName] = useState(rule?.name || "");
  const [priority, setPriority] = useState(String(rule?.priority || 0));
  const [isActive, setIsActive] = useState(rule?.isActive ?? true);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(rule?.conditions.petTypes || []);
  const [selectedBreeds, setSelectedBreeds] = useState<string[]>(rule?.conditions.breeds || []);
  const [weightMin, setWeightMin] = useState(String(WeightUtils.fromGrams(rule?.conditions.weightRange?.min, settings.weightUnit as any) ?? ""));
  const [weightMax, setWeightMax] = useState(String(WeightUtils.fromGrams(rule?.conditions.weightRange?.max, settings.weightUnit as any) ?? ""));
  const [productIds, setProductIds] = useState<string[]>(rule?.productIds || []);
  const [displayProducts, setDisplayProducts] = useState(initialProductData || []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [breedQuery, setBreedQuery] = useState("");
  const [typeQuery, setTypeQuery] = useState("");

  const filteredTypes = useMemo(() => {
    const query = typeQuery.toLowerCase();
    return settings.types.filter((t: any) =>
      t.label.toLowerCase().includes(query)
    );
  }, [settings.types, typeQuery]);

  const availableBreeds = useMemo(() => {
    if (selectedTypes.length === 0) return [];
    
    const query = breedQuery.toLowerCase();
    return settings.types
      .filter((t: any) => selectedTypes.includes(t.label))
      .flatMap((t: any) => t.breeds.map((b: any) => ({ type: t.label, breed: b })))
      .filter((item: any) =>
        item.breed.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query)
      );
  }, [settings, selectedTypes, breedQuery]);

  const handleSave = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = "Rule name is required.";
    }

    if (productIds.length === 0) {
      newErrors.products = "At least one product must be selected.";
    }

    const min = weightMin ? parseFloat(weightMin) : null;
    const max = weightMax ? parseFloat(weightMax) : null;

    if (min !== null && min < 0) {
      newErrors.weightMin = "Weight cannot be negative.";
    }
    if (max !== null && max < 0) {
      newErrors.weightMax = "Weight cannot be negative.";
    }

    if ((min !== null && max === null) || (min === null && max !== null)) {
      newErrors.weight = "Both min and max weights are required if either is provided.";
    } else if (min !== null && max !== null && max < min) {
      newErrors.weight = "Max weight must be greater than or equal to min weight.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    const payload = {
      name,
      priority: parseInt(priority),
      isActive,
      conditions: {
        petTypes: selectedTypes,
        breeds: selectedBreeds,
        weightRange: {
          min: min !== null ? WeightUtils.toGrams(min, settings.weightUnit as any) : null,
          max: max !== null ? WeightUtils.toGrams(max, settings.weightUnit as any) : null,
        }
      },
      productIds
    };
    submit({ rule: JSON.stringify(payload) }, { method: "post" });
  };

  const handleSelectProducts = async () => {
    const selected = await window.shopify.resourcePicker({
      type: 'product',
      multiple: true,
      selectionIds: productIds.map(id => ({ id }))
    });
    
    if (selected) {
      setProductIds(selected.map((p: any) => p.id));
      setDisplayProducts(selected.map((p: any) => ({
        id: p.id,
        title: p.title,
        featuredImage: p.images[0] ? { url: p.images[0].originalSrc } : null
      })));
    }
  };

  const toggleType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleBreed = (breed: string) => {
    setSelectedBreeds(prev => 
      prev.includes(breed) ? prev.filter(b => b !== breed) : [...prev, breed]
    );
  };

  const isSaving = navigation.state === "submitting" && navigation.formData?.get("_action") !== "delete";
  const isDeleting = navigation.state === "submitting" && navigation.formData?.get("_action") === "delete";

  return (
    <Page
      backAction={{ content: 'Rules', onAction: () => navigate('/app/rules') }}
      title={rule ? `Edit ${rule.name}` : "New Matching Rule"}
      primaryAction={{
        content: 'Save Rule',
        onAction: handleSave,
        loading: isSaving
      }}
      secondaryActions={rule ? [{
        content: 'Delete',
        destructive: true,
        onAction: () => submit({ _action: "delete" }, { method: "post" }),
        loading: isDeleting
      }] : []}
    >
      <Layout>
        {actionData?.error && (
          <Layout.Section>
            <Banner title="Error saving rule" tone="critical">
              <p>{actionData.error}</p>
            </Banner>
          </Layout.Section>
        )}
        <Layout.Section>
          <BlockStack gap="500">
            <Card padding="400">
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Rule Configuration</Text>
                <TextField 
                  label="Rule Name" 
                  value={name} 
                  onChange={setName} 
                  autoComplete="off" 
                  error={errors.name || (actionData?.error && (actionData.error.includes("name") || actionData.error.includes("required")) ? actionData.error : undefined)}
                />
                <TextField label="Priority" type="number" value={priority} onChange={setPriority} autoComplete="off" helpText="Higher priority rules take precedence." />
                <Checkbox label="Active" checked={isActive} onChange={setIsActive} />
              </BlockStack>
            </Card>

            <Card padding="400">
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Matching Conditions</Text>
                {errors.weight && (
                  <Banner tone="critical">
                    <p>{errors.weight}</p>
                  </Banner>
                )}
                <InlineStack gap="500" align="start">
                  <Box width="200px">
                    <BlockStack gap="200">
                      <Text variant="headingSm" as="h3">Pet Types</Text>
                      <TextField
                        label="Filter Types"
                        labelHidden
                        value={typeQuery}
                        onChange={(val) => setTypeQuery(val)}
                        placeholder="Search types..."
                        autoComplete="off"
                      />
                      <Box padding="200" borderStyle="solid" borderWidth="025" borderColor="border" borderRadius="200">
                        <Scrollable style={{ height: '300px' }}>
                          <BlockStack gap="100">
                            {filteredTypes.length === 0 ? (
                              <Box padding="200">
                                <Text as="p" tone="subdued" alignment="center">No types found.</Text>
                              </Box>
                            ) : (
                              filteredTypes.map((t: any) => (
                                <Checkbox
                                  key={t.label}
                                  label={t.label}
                                  checked={selectedTypes.includes(t.label)}
                                  onChange={() => toggleType(t.label)}
                                />
                              ))
                            )}
                          </BlockStack>
                        </Scrollable>
                      </Box>
                    </BlockStack>
                  </Box>
                  <Box width="300px">
                    <BlockStack gap="200">
                      <Text variant="headingSm" as="h3">Smart Breed Matching</Text>
                      <TextField
                        label="Filter Breeds"
                        labelHidden
                        value={breedQuery}
                        onChange={(val) => setBreedQuery(val)}
                        placeholder="Search breeds..."
                        autoComplete="off"
                      />
                      <Box padding="200" borderStyle="solid" borderWidth="025" borderColor="border" borderRadius="200">
                        <Scrollable style={{ height: '300px' }}>
                          <BlockStack gap="100">
                            {selectedTypes.length === 0 ? (
                              <Box padding="200">
                                <Text as="p" tone="subdued" alignment="center">Select a pet type to view breeds.</Text>
                              </Box>
                            ) : availableBreeds.length === 0 ? (
                              <Box padding="200">
                                <Text as="p" tone="subdued" alignment="center">No breeds found matching your filter.</Text>
                              </Box>
                            ) : (
                              availableBreeds.map((item: any) => (
                                <Checkbox
                                  key={`${item.type}-${item.breed}`}
                                  label={`${item.type}: ${item.breed}`}
                                  checked={selectedBreeds.includes(item.breed)}
                                  onChange={() => toggleBreed(item.breed)}
                                />
                              ))
                            )}
                          </BlockStack>
                        </Scrollable>
                      </Box>
                    </BlockStack>
                  </Box>
                </InlineStack>

                <BlockStack gap="200">
                  <Text variant="headingSm" as="h3">Weight Normalization ({settings.weightUnit || 'kg'})</Text>
                  <InlineStack gap="400">
                    <Box width="150px">
                      <TextField
                        label="Min Weight"
                        type="number"
                        value={weightMin}
                        onChange={setWeightMin}
                        autoComplete="off"
                        suffix={settings.weightUnit || 'kg'}
                        error={errors.weightMin}
                      />
                    </Box>
                    <Box width="150px">
                      <TextField
                        label="Max Weight"
                        type="number"
                        value={weightMax}
                        onChange={setWeightMax}
                        autoComplete="off"
                        suffix={settings.weightUnit || 'kg'}
                        error={errors.weightMax}
                      />
                    </Box>
                  </InlineStack>
                  <Text variant="bodySm" tone="subdued" as="p">
                    Leave empty for no limit. Rules use grams internally; values here are in {settings.weightUnit || 'kg'}.
                  </Text>
                </BlockStack>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card padding="400">
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Applied Products</Text>
              <Button onClick={handleSelectProducts}>Select Products</Button>
              {(errors.products || (actionData?.error && actionData.error.includes("product"))) && (
                <Text as="p" tone="critical">{errors.products || actionData?.error}</Text>
              )}
              <ResourceList
                resourceName={{ singular: 'product', plural: 'products' }}
                items={displayProducts}
                renderItem={(item: any) => {
                  const media = (
                    <Thumbnail
                      source={item.featuredImage?.url || ""}
                      alt={item.title}
                      size="small"
                    />
                  );
                  return (
                    <ResourceItem
                      id={item.id}
                      media={media}
                      accessibilityLabel={`View details for ${item.title}`}
                      onClick={() => {}}
                    >
                      <Text variant="bodyMd" fontWeight="bold" as="h3">
                        {item.title}
                      </Text>
                    </ResourceItem>
                  );
                }}
              />
              {displayProducts.length === 0 && <Text as="p" tone="subdued">No products selected.</Text>}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
