import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSubmit, useNavigate, useNavigation, redirect, useActionData } from "react-router";
import { Page, Layout, Card, BlockStack, TextField, Button, InlineStack, Text, Badge, Checkbox, ResourceList, Thumbnail, ResourceItem, Box, Scrollable, Banner } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { ProductRuleService } from "../modules/ProductRules";
import { PetProfileService } from "../modules/PetProfiles";
import { useState, useMemo } from "react";

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
    return redirect("/app/rules");
  }

  const data = JSON.parse(formData.get("rule") as string);
  try {
    await ProductRuleService.upsertRule(session.shop, {
      ...data,
      id: params.id === "new" ? undefined : params.id
    });
    return redirect("/app/rules");
  } catch (error: any) {
    return { error: error.message };
  }
};

export default function RuleDetail() {
  const { rule, settings, initialProductData } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const navigate = useNavigate();

  const [name, setName] = useState(rule?.name || "");
  const [priority, setPriority] = useState(String(rule?.priority || 0));
  const [isActive, setIsActive] = useState(rule?.isActive ?? true);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(rule?.conditions.petTypes || []);
  const [selectedBreeds, setSelectedBreeds] = useState<string[]>(rule?.conditions.breeds || []);
  const [productIds, setProductIds] = useState<string[]>(rule?.productIds || []);
  const [displayProducts, setDisplayProducts] = useState(initialProductData || []);

  const availableBreeds = useMemo(() => {
    return settings.types
      .filter((t: any) => selectedTypes.length === 0 || selectedTypes.includes(t.label))
      .flatMap((t: any) => t.breeds.map((b: any) => ({ type: t.label, breed: b })));
  }, [settings, selectedTypes]);

  const handleSave = () => {
    const payload = {
      name,
      priority: parseInt(priority),
      isActive,
      conditions: {
        petTypes: selectedTypes,
        breeds: selectedBreeds
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
      title={rule ? `Edit ${rule.name}` : "New Product Rule"}
      primaryAction={{
        content: 'Save',
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
      <ui-title-bar title={rule ? `Edit ${rule.name}` : "New Product Rule"}>
        <button variant="primary" onClick={handleSave}>Save</button>
        {rule && <button onClick={() => submit({ _action: "delete" }, { method: "post" })}>Delete</button>}
      </ui-title-bar>
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
                <Text variant="headingMd" as="h2">Basic Information</Text>
                <TextField 
                  label="Rule Name" 
                  value={name} 
                  onChange={setName} 
                  autoComplete="off" 
                  error={actionData?.error && (actionData.error.includes("name") || actionData.error.includes("required")) ? actionData.error : undefined}
                />
                <TextField label="Priority" type="number" value={priority} onChange={setPriority} autoComplete="off" helpText="Higher priority rules match first." />
                <Checkbox label="Active" checked={isActive} onChange={setIsActive} />
              </BlockStack>
            </Card>

            <Card padding="400">
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Conditions</Text>
                <InlineStack gap="500" align="start">
                  <Box width="200px">
                    <BlockStack gap="200">
                      <Text variant="headingSm" as="h3">Pet Types</Text>
                      <Box padding="200" borderStyle="solid" borderWidth="025" borderColor="border" borderRadius="200">
                        <Scrollable style={{ height: '300px' }}>
                          <BlockStack gap="100">
                            {settings.types.map((t: any) => (
                              <Checkbox
                                key={t.label}
                                label={t.label}
                                checked={selectedTypes.includes(t.label)}
                                onChange={() => toggleType(t.label)}
                              />
                            ))}
                          </BlockStack>
                        </Scrollable>
                      </Box>
                    </BlockStack>
                  </Box>
                  <Box width="300px">
                    <BlockStack gap="200">
                      <Text variant="headingSm" as="h3">Specific Breeds</Text>
                      <Box padding="200" borderStyle="solid" borderWidth="025" borderColor="border" borderRadius="200">
                        <Scrollable style={{ height: '300px' }}>
                          <BlockStack gap="100">
                            {availableBreeds.map((item: any) => (
                              <Checkbox
                                key={`${item.type}-${item.breed}`}
                                label={`${item.type}: ${item.breed}`}
                                checked={selectedBreeds.includes(item.breed)}
                                onChange={() => toggleBreed(item.breed)}
                              />
                            ))}
                          </BlockStack>
                        </Scrollable>
                      </Box>
                    </BlockStack>
                  </Box>
                </InlineStack>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card padding="400">
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Applied Products</Text>
              <Button onClick={handleSelectProducts}>Select Products</Button>
              {actionData?.error && actionData.error.includes("product") && (
                <Text as="p" tone="critical">{actionData.error}</Text>
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
