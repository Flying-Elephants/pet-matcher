import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate, useSubmit, redirect, useSearchParams } from "react-router";
import { Page, Layout, Card, Text, Badge, InlineStack, BlockStack, EmptyState, Button, IndexTable, useIndexResourceState, Pagination } from "@shopify/polaris";
import { InfoIcon } from "@shopify/polaris-icons";
import { useState } from "react";
import { authenticate } from "../shopify.server";
import { ProductRuleService, type RuleSortKey } from "../modules/ProductRules";
import { PageGuide } from "../components/PageGuide";
import { GUIDE_CONTENT } from "../modules/Core/guide-content";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const sortKey = (url.searchParams.get("sortKey") as RuleSortKey) || "priority";
  const sortDirection = (url.searchParams.get("sortDirection") as "asc" | "desc") || "desc";
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = 20;

  const { rules, totalCount } = await ProductRuleService.getRules(session.shop, {
    sort: {
      key: sortKey,
      direction: sortDirection,
    },
    page,
    limit,
  });

  return { rules, totalCount, sortKey, sortDirection, page, limit };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const id = formData.get("id") as string;
  const _action = formData.get("_action");

  if (_action === "delete") {
    await ProductRuleService.deleteRule(session.shop, id);
    return redirect("/app/rules");
  }

  if (_action === "bulk_delete") {
    const ids = JSON.parse(formData.get("ids") as string);
    await ProductRuleService.deleteManyRules(session.shop, ids);
    return redirect("/app/rules");
  }

  if (_action === "copy") {
    return redirect(`/app/rules/new?copyFrom=${id}`);
  }

  return redirect("/app/rules");
};

export default function RulesIndex() {
  const { rules, totalCount, sortKey, sortDirection, page, limit } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [guideActive, setGuideActive] = useState(false);
  const submit = useSubmit();
  const navigate = useNavigate();

  const resourceName = {
    singular: 'rule',
    plural: 'rules',
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(rules as any);

  const promotedBulkActions = [
    {
      content: 'Delete rules',
      onAction: () => {
        if (confirm(`Are you sure you want to delete ${selectedResources.length} rules?`)) {
          submit(
            { ids: JSON.stringify(selectedResources), _action: "bulk_delete" },
            { method: "post" }
          );
        }
      },
    },
  ];

  const emptyStateMarkup = (
    <EmptyState
      heading="Create your first product rule"
      action={{ content: 'Create Rule', onAction: () => navigate('/app/rules/new') }}
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Target specific products based on pet types and breeds.</p>
    </EmptyState>
  );

  const rowMarkup = rules.map(
    ({ id, name, priority, isActive, conditions, productIds }, index) => (
      <IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        position={index}
      >
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {name}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone="info">{`${productIds.length} Products`}</Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <InlineStack gap="100">
            {conditions.petTypes.length > 0 ? (
              conditions.petTypes.map((type: string) => (
                <Badge key={type} tone="info">{type}</Badge>
              ))
            ) : (
              <Text as="span" tone="subdued">All Types</Text>
            )}
          </InlineStack>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <InlineStack gap="100">
            {conditions.breeds.length > 0 ? (
              conditions.breeds.map((breed: string) => (
                <Badge key={breed} tone="attention">{breed}</Badge>
              ))
            ) : (
              <Text as="span" tone="subdued">All Breeds</Text>
            )}
          </InlineStack>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={isActive ? "success" : "warning"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>{priority}</IndexTable.Cell>
        <IndexTable.Cell>
          <InlineStack gap="200">
            <Button
              size="slim"
              onClick={() => navigate(`/app/rules/${id}`)}
            >
              Edit
            </Button>
            <Button
              size="slim"
              onClick={() => submit({ id, _action: "copy" }, { method: "post" })}
            >
              Copy
            </Button>
            <Button
              size="slim"
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
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  const handleSort = (index: number, direction: 'ascending' | 'descending') => {
    const sortKeys: RuleSortKey[] = ['name', 'productCount', 'petTypeCount', 'breedCount', 'isActive', 'priority'];
    const key = sortKeys[index];
    const newDirection = direction === 'ascending' ? 'asc' : 'desc';
    
    const params = new URLSearchParams(searchParams);
    params.set("sortKey", key);
    params.set("sortDirection", newDirection);
    params.set("page", "1"); // Reset to page 1 on sort
    setSearchParams(params);
  };

  const hasNext = page * limit < totalCount;
  const hasPrevious = page > 1;

  const handlePagination = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    setSearchParams(params);
  };

  return (
    <Page 
      title="Product Rules" 
      primaryAction={{ content: 'Create Rule', onAction: () => navigate('/app/rules/new') }}
      secondaryActions={[
        {
          content: "Page Guide",
          icon: InfoIcon,
          onAction: () => setGuideActive(true),
        }
      ]}
    >
      <PageGuide 
        content={GUIDE_CONTENT.rules} 
        active={guideActive} 
        onClose={() => setGuideActive(false)} 
      />
      <Layout>
        <Layout.Section>
          <Card padding="0">
            {rules.length === 0 ? emptyStateMarkup : (
              <BlockStack>
                <IndexTable
                  resourceName={resourceName}
                  itemCount={rules.length}
                  selectedItemsCount={
                    allResourcesSelected ? 'All' : selectedResources.length
                  }
                  onSelectionChange={handleSelectionChange}
                  promotedBulkActions={promotedBulkActions}
                  sortColumnIndex={['name', 'productCount', 'petTypeCount', 'breedCount', 'isActive', 'priority'].indexOf(sortKey)}
                  sortDirection={sortDirection === 'asc' ? 'ascending' : 'descending'}
                  onSort={handleSort}
                  headings={[
                    { title: 'Name' },
                    { title: 'Products' },
                    { title: 'Pet Types' },
                    { title: 'Breeds' },
                    { title: 'Status' },
                    { title: 'Priority' },
                    { title: 'Actions', alignment: 'end' },
                  ]}
                  sortable={[true, true, true, true, true, true, false]}
                >
                  {rowMarkup}
                </IndexTable>
                <div style={{ padding: '16px', display: 'flex', justifyContent: 'center', borderTop: '1px solid var(--p-border-subdued)' }}>
                  <Pagination
                    hasPrevious={hasPrevious}
                    onPrevious={() => handlePagination(page - 1)}
                    hasNext={hasNext}
                    onNext={() => handlePagination(page + 1)}
                  />
                </div>
              </BlockStack>
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
