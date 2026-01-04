import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate, useSubmit, redirect, Link } from "react-router";
import { Page, Layout, Card, ResourceList, ResourceItem, Text, Badge, InlineStack, BlockStack, EmptyState, Button } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { ProductRuleService } from "../modules/ProductRules";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const rules = await ProductRuleService.getRules(session.shop);
  return { rules };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const id = formData.get("id") as string;
  const _action = formData.get("_action");

  if (_action === "delete") {
    await ProductRuleService.deleteRule(session.shop, id);
  }

  return redirect("/app/rules");
};

export default function RulesIndex() {
  const { rules } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigate = useNavigate();

  const emptyStateMarkup = (
    <EmptyState
      heading="Create your first product rule"
      action={{ content: 'Create Rule', onAction: () => navigate('/app/rules/new') }}
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Target specific products based on pet types and breeds.</p>
    </EmptyState>
  );

  return (
    <Page 
      title="Product Rules" 
      primaryAction={{ content: 'Create Rule', onAction: () => navigate('/app/rules/new') }}
    >
      <Layout>
        <Layout.Section>
          <Card padding="0">
            {rules.length === 0 ? emptyStateMarkup : (
              <ResourceList
                resourceName={{ singular: 'rule', plural: 'rules' }}
                items={rules}
                renderItem={(item) => {
                  const { id, name, priority, isActive, conditions } = item;
                  return (
                    <ResourceItem
                      id={id}
                      onClick={() => navigate(`/app/rules/${id}`)}
                    >
                      <InlineStack align="space-between" blockAlign="center">
                        <BlockStack gap="100">
                          <Text variant="bodyMd" fontWeight="bold" as="h3">
                            {name}
                          </Text>
                          <InlineStack gap="200">
                            {conditions.petTypes.length > 0 && (
                              <Badge tone="info">{conditions.petTypes.join(', ')}</Badge>
                            )}
                            {conditions.breeds.length > 0 && (
                              <Badge tone="attention">{conditions.breeds.join(', ')}</Badge>
                            )}
                          </InlineStack>
                        </BlockStack>
                        <InlineStack gap="400" align="center" blockAlign="center">
                          <Text as="span" variant="bodySm" tone="subdued">
                            Priority: {priority}
                          </Text>
                          <Badge tone={isActive ? "success" : "warning"}>
                            {isActive ? "Active" : "Inactive"}
                          </Badge>
                          <InlineStack gap="200">
                            <Button
                              onClick={() => navigate(`/app/rules/${id}`)}
                            >
                              Edit
                            </Button>
                            <Button
                              tone="critical"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this rule?")) {
                                  submit({ id, _action: "delete" }, { method: "post" });
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </InlineStack>
                        </InlineStack>
                      </InlineStack>
                    </ResourceItem>
                  );
                }}
              />
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
