import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate, useSubmit, redirect, useSearchParams, useNavigation } from "react-router";
import { 
  Page, 
  Layout, 
  Card, 
  Text, 
  Badge, 
  InlineStack, 
  BlockStack, 
  EmptyState, 
  Button, 
  IndexTable, 
  useIndexResourceState, 
  Pagination, 
  Modal,
  IndexFilters,
  useSetIndexFiltersMode
} from "@shopify/polaris";
import { InfoIcon } from "@shopify/polaris-icons";
import { useState, useCallback } from "react";
import { authenticate } from "../shopify.server";
import { ProductRuleService, type RuleSortKey } from "../modules/ProductRules";
import { PetProfileService } from "../modules/PetProfiles";
import { WeightUtils } from "../modules/Core/WeightUtils";
import { PageGuide } from "../components/PageGuide";
import { GUIDE_CONTENT } from "../modules/Core/guide-content";
import { z } from "zod";
import { SkeletonTablePage } from "../components/SkeletonTablePage";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const sortKey = (url.searchParams.get("sortKey") as RuleSortKey) || "priority";
  const sortDirection = (url.searchParams.get("sortDirection") as "asc" | "desc") || "desc";
  const query = url.searchParams.get("query") || "";
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = 20;

  const [rulesResult, settings] = await Promise.all([
    ProductRuleService.getRules(session.shop, {
      sort: {
        key: sortKey,
        direction: sortDirection,
      },
      query,
      page,
      limit,
    }),
    PetProfileService.getSettings(session.shop)
  ]);

  return { 
    rules: rulesResult.rules, 
    totalCount: rulesResult.totalCount, 
    settings,
    sortKey, 
    sortDirection, 
    query,
    page, 
    limit 
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const id = formData.get("id") as string;
  const _action = formData.get("_action");

  if (_action === "delete") {
    const validatedId = z.string().min(1).parse(id);
    await ProductRuleService.deleteRule(session.shop, validatedId);
    return redirect("/app/rules");
  }

  if (_action === "bulk_delete") {
    const idsJson = formData.get("ids");
    if (typeof idsJson !== "string") return redirect("/app/rules");
    
    const parsedIds = JSON.parse(idsJson);
    const validatedIds = z.array(z.string()).min(1).parse(parsedIds);
    await ProductRuleService.deleteManyRules(session.shop, validatedIds);
    return redirect("/app/rules");
  }

  if (_action === "copy") {
    const validatedId = z.string().min(1).parse(id);
    return redirect(`/app/rules/new?copyFrom=${validatedId}`);
  }

  return redirect("/app/rules");
};

export default function RulesIndex() {
  const data = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  if (navigation.state === "loading" && !data) {
    return <SkeletonTablePage title="Logic Engine: Product Rules" />;
  }

  if (!data) return null;
  const { rules, totalCount, settings, sortKey, sortDirection, query, page, limit } = data;
  const [searchParams, setSearchParams] = useSearchParams();
  const [guideActive, setGuideActive] = useState(false);
  const submit = useSubmit();
  const navigate = useNavigate();

  const weightUnit = settings.weightUnit || "kg";

  const [queryValue, setQueryValue] = useState(query);
  const { mode, setMode } = useSetIndexFiltersMode();

  const [deleteModalActive, setDeleteModalActive] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteActive, setBulkDeleteActive] = useState(false);

  const resourceName = {
    singular: 'rule',
    plural: 'rules',
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(rules as any);

  const toggleDeleteModal = useCallback(() => setDeleteModalActive((active) => !active), []);
  const toggleBulkDeleteModal = useCallback(() => setBulkDeleteActive((active) => !active), []);

  const handleConfirmDelete = () => {
    if (deleteId) {
      submit({ id: deleteId, _action: "delete" }, { method: "post" });
      setDeleteId(null);
      toggleDeleteModal();
    }
  };

  const handleConfirmBulkDelete = () => {
    submit(
      { ids: JSON.stringify(selectedResources), _action: "bulk_delete" },
      { method: "post" }
    );
    toggleBulkDeleteModal();
  };

  const onHandleSearchChange = useCallback((value: string) => {
    setQueryValue(value);
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("query", value);
    } else {
      params.delete("query");
    }
    params.set("page", "1");
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  const onHandleSearchClear = useCallback(() => {
    onHandleSearchChange("");
  }, [onHandleSearchChange]);

  const promotedBulkActions = [
    {
      content: 'Delete rules',
      onAction: toggleBulkDeleteModal,
    },
  ];

  const emptyStateMarkup = (
    <EmptyState
      heading="Create your first logic engine rule"
      action={{ content: 'Create Rule', onAction: () => navigate('/app/rules/new') }}
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>The logic engine matches pets to products based on breed, weight, and age. Reduce returns and boost AOV.</p>
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
          {conditions.weightRange && (conditions.weightRange.min !== null || conditions.weightRange.max !== null) ? (
            <Badge tone="success">
              {conditions.weightRange.min !== null && conditions.weightRange.max !== null
                ? `${WeightUtils.fromGrams(conditions.weightRange.min, weightUnit as any)}-${WeightUtils.fromGrams(conditions.weightRange.max, weightUnit as any)} ${weightUnit}`
                : conditions.weightRange.min !== null
                ? `>${WeightUtils.fromGrams(conditions.weightRange.min, weightUnit as any)} ${weightUnit}`
                : `<${WeightUtils.fromGrams(conditions.weightRange.max, weightUnit as any)} ${weightUnit}`}
            </Badge>
          ) : (
            <Text as="span" tone="subdued">All Weights</Text>
          )}
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={isActive ? "success" : "warning"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>{priority}</IndexTable.Cell>
        <IndexTable.Cell>
          <InlineStack gap="200" align="end">
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
                setDeleteId(id);
                toggleDeleteModal();
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
      title="Logic Engine: Product Rules"
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
            {rules.length === 0 && !query ? emptyStateMarkup : (
              <BlockStack>
                <IndexFilters
                  queryValue={queryValue}
                  queryPlaceholder="Search rules"
                  onQueryChange={onHandleSearchChange}
                  onQueryClear={onHandleSearchClear}
                  cancelAction={{
                    onAction: onHandleSearchClear,
                    disabled: false,
                    loading: false,
                  }}
                  tabs={[]}
                  selected={0}
                  onSelect={() => {}}
                  canCreateNewView={false}
                  filters={[]}
                  onClearAll={() => {}}
                  mode={mode}
                  setMode={setMode}
                />
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
                    { title: 'Weight' },
                    { title: 'Status' },
                    { title: 'Priority' },
                    { title: 'Actions', alignment: 'end' },
                  ]}
                  sortable={[true, true, true, true, false, true, true, false]}
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

      <Modal
        open={deleteModalActive}
        onClose={toggleDeleteModal}
        title="Delete Logic Engine Rule?"
        primaryAction={{
          content: 'Delete',
          onAction: handleConfirmDelete,
          destructive: true,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: toggleDeleteModal,
          },
        ]}
      >
        <Modal.Section>
          <Text as="p">
            Are you sure you want to delete this product rule? This action cannot be undone.
          </Text>
        </Modal.Section>
      </Modal>

      <Modal
        open={bulkDeleteActive}
        onClose={toggleBulkDeleteModal}
        title={`Delete ${selectedResources.length} Rules?`}
        primaryAction={{
          content: 'Delete',
          onAction: handleConfirmBulkDelete,
          destructive: true,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: toggleBulkDeleteModal,
          },
        ]}
      >
        <Modal.Section>
          <Text as="p">
            Are you sure you want to delete the selected product rules? This action cannot be undone.
          </Text>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
