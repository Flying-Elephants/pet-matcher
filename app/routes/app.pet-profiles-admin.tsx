import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data, useLoaderData, useSearchParams, useSubmit, useNavigate, useNavigation } from "react-router";
import {
  Page,
  Layout,
  Card,
  IndexTable,
  Text,
  Badge,
  useIndexResourceState,
  IndexFilters,
  useSetIndexFiltersMode,
  Pagination,
  Modal,
  Button,
  InlineStack,
  BlockStack,
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { authenticate } from "../shopify.server";
import { PetProfileService } from "../modules/PetProfiles";
import { ComplianceService } from "../modules/Core";
import { z } from "zod";
import { PageGuide } from "../components/PageGuide";
import { GUIDE_CONTENT } from "../modules/Core/guide-content";
import { InfoIcon } from "@shopify/polaris-icons";
import { SkeletonTablePage } from "../components/SkeletonTablePage";
import { FADE_IN_VARIANTS } from "../modules/Core/animations";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);

  // Security & Compliance Gating
  const settings = await ComplianceService.getSettings(session.shop);
  const s = session as any;
  if (s.collaborator && settings.limitCollaboratorAccess) {
    throw new Response("Forbidden: Collaborator access restricted", { status: 403 });
  }

  // Audit Logging
  await ComplianceService.logAccess({
    shop: session.shop,
    userId: s.userId || undefined,
    userName: `${s.firstName || ""} ${s.lastName || ""}`.trim() || "Unknown",
    action: "VIEW_PET_PROFILES_LIST",
  });

  const url = new URL(request.url);
  const sortKey = url.searchParams.get("sortKey") || "createdAt";
  const sortDirection = url.searchParams.get("sortDirection") || "desc";
  const query = url.searchParams.get("query") || "";
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = 20;

  const { profiles, totalCount } = await PetProfileService.getAllProfiles(session.shop, {
    sortKey,
    sortDirection: sortDirection as "asc" | "desc",
    query,
    page,
    limit,
  });

  // Fetch customer names from Shopify for these profiles
  const customerIds = [...new Set(profiles.map((p) => `gid://shopify/Customer/${p.shopifyId}`))];
  let customerNames: Record<string, string> = {};

  if (customerIds.length > 0) {
    try {
      const response = await admin.graphql(
        `query getCustomers($ids: [ID!]!) {
          nodes(ids: $ids) {
            ... on Customer {
              id
              firstName
              lastName
            }
          }
        }`,
        { variables: { ids: customerIds } }
      );
      const json: any = await response.json();
      
      if (json.errors) {
        console.error("GraphQL errors fetching customers:", json.errors);
      }

      const nodes = json.data?.nodes || [];
      nodes.forEach((node: any) => {
        if (node) {
          customerNames[node.id.split("/").pop()!] = `${node.firstName || ""} ${node.lastName || ""}`.trim() || "Unknown";
        }
      });
    } catch (error) {
      console.error("Failed to fetch customer names from Shopify.", error);
    }
  }

  return data({ 
    profiles, 
    totalCount, 
    customerNames, 
    sortKey, 
    sortDirection, 
    query, 
    page, 
    limit 
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  // Security & Compliance Gating
  const settings = await ComplianceService.getSettings(session.shop);
  const s = session as any;
  if (s.collaborator && settings.limitCollaboratorAccess) {
    throw new Response("Forbidden: Collaborator access restricted", { status: 403 });
  }

  const formData = await request.formData();
  const id = formData.get("id") as string;
  const _action = formData.get("_action");

  if (_action === "delete") {
    const validatedId = z.string().min(1).parse(id);
    await PetProfileService.deleteProfile(session.shop, validatedId);
    return data({ success: true });
  }

  if (_action === "bulk_delete") {
    const idsJson = formData.get("ids");
    if (typeof idsJson !== "string") return data({ success: false });
    
    const parsedIds = JSON.parse(idsJson);
    const validatedIds = z.array(z.string()).min(1).parse(parsedIds);
    
    // Serial deletion since we don't have a bulk delete in service yet, 
    // but we can add one or loop. ProductRule has deleteMany, PetProfile should too ideally.
    // For now, let's keep it simple.
    await Promise.all(validatedIds.map(id => PetProfileService.deleteProfile(session.shop, id)));
    return data({ success: true });
  }

  return data({ success: false });
};

export default function PetProfilesAdmin() {
  const data = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  if (navigation.state === "loading" && !data) {
    return <SkeletonTablePage title="Retention Center: Pet Profiles" />;
  }

  if (!data) return null;
  const { profiles, totalCount, customerNames, sortKey, sortDirection, query, page, limit } = data;
  const [searchParams, setSearchParams] = useSearchParams();
  const [guideActive, setGuideActive] = useState(false);
  const submit = useSubmit();
  const navigate = useNavigate();

  const [queryValue, setQueryValue] = useState(query);
  const { mode, setMode } = useSetIndexFiltersMode();

  const [deleteModalActive, setDeleteModalActive] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteActive, setBulkDeleteActive] = useState(false);

  const resourceName = {
    singular: "pet profile",
    plural: "pet profiles",
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(profiles as any);

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

  const handleSort = (index: number, direction: 'ascending' | 'descending') => {
    const sortKeys = ['name', 'type', 'breed', 'shopifyId', 'createdAt'];
    const key = sortKeys[index];
    const newDirection = direction === 'ascending' ? 'asc' : 'desc';
    
    const params = new URLSearchParams(searchParams);
    params.set("sortKey", key);
    params.set("sortDirection", newDirection);
    setSearchParams(params);
  };

  const promotedBulkActions = [
    {
      content: 'Delete profiles',
      onAction: toggleBulkDeleteModal,
    },
  ];

  const rowMarkup = profiles.map(
    ({ id, name, type, breed, shopifyId, createdAt }, index) => (
      <IndexTable.Row 
        id={id} 
        key={id} 
        position={index}
        selected={selectedResources.includes(id)}
      >
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {name}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone="info">{type}</Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>{breed}</IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" as="span">
            {customerNames[shopifyId] || "Guest"}
          </Text>
          <Text variant="bodySm" as="p" tone="subdued">
            ID: {shopifyId}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          {createdAt ? new Date(createdAt).toLocaleDateString() : "N/A"}
        </IndexTable.Cell>
        <IndexTable.Cell>
          <InlineStack gap="200" align="end">
            <Button
              size="slim"
              onClick={() => navigate(`/app/pet-profiles/${id}`)}
            >
              Edit
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
    )
  );

  const hasNext = page * limit < totalCount;
  const hasPrevious = page > 1;

  const handlePagination = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    setSearchParams(params);
  };

  return (
    <Page
      title="Retention Center: Pet Profiles"
      secondaryActions={[
        {
          content: "Page Guide",
          icon: InfoIcon,
          onAction: () => setGuideActive(true),
        }
      ]}
    >
      <PageGuide
        content={GUIDE_CONTENT.petProfiles}
        active={guideActive}
        onClose={() => setGuideActive(false)}
      />
      <Layout>
        <Layout.Section>
          <motion.div initial="hidden" animate="visible" variants={FADE_IN_VARIANTS}>
            <Card padding="0">
              <BlockStack>
                <IndexFilters
                  queryValue={queryValue}
                  queryPlaceholder="Search profiles"
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
                  itemCount={profiles.length}
                  selectedItemsCount={
                    allResourcesSelected ? 'All' : selectedResources.length
                  }
                  onSelectionChange={handleSelectionChange}
                  promotedBulkActions={promotedBulkActions}
                  headings={[
                    { title: "Name" },
                    { title: "Type" },
                    { title: "Breed" },
                    { title: "Customer" },
                    { title: "Created" },
                    { title: "Actions", alignment: "end" },
                  ]}
                  sortColumnIndex={['name', 'type', 'breed', 'shopifyId', 'createdAt'].indexOf(sortKey)}
                  sortDirection={sortDirection === 'asc' ? 'ascending' : 'descending'}
                  onSort={handleSort}
                  sortable={[true, true, true, true, true, false]}
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
            </Card>
          </motion.div>
        </Layout.Section>
      </Layout>

      <Modal
        open={deleteModalActive}
        onClose={toggleDeleteModal}
        title="Delete Profile from Retention Center?"
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
            Are you sure you want to delete this pet profile? This action cannot be undone.
          </Text>
        </Modal.Section>
      </Modal>

      <Modal
        open={bulkDeleteActive}
        onClose={toggleBulkDeleteModal}
        title={`Delete ${selectedResources.length} Profiles?`}
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
            Are you sure you want to delete the selected pet profiles? This action cannot be undone.
          </Text>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
