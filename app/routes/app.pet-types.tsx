import { useLoaderData, useFetcher } from "react-router";
import { useState, useEffect, useCallback } from "react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  TextField,
  Button,
  InlineStack,
  Text,
  ResourceList,
  ResourceItem,
  Avatar,
  Modal,
  Tag,
  FormLayout,
  EmptyState,
} from "@shopify/polaris";
import { PlusIcon, SaveIcon, InfoIcon } from "@shopify/polaris-icons";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { PetProfileService } from "../modules/PetProfiles";
import { PetSettingsSchema, type PetSettings, type PetTypeConfig } from "../modules/PetProfiles/core/types";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { PageGuide } from "../components/PageGuide";
import { GUIDE_CONTENT } from "../modules/Core/guide-content";
import { SkeletonTablePage } from "../components/SkeletonTablePage";
import { useNavigation } from "react-router";
import { motion } from "framer-motion";
import { STAGGER_CONTAINER_VARIANTS, STAGGER_ITEM_VARIANTS } from "../modules/Core/animations";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const settings = await PetProfileService.getSettings(session.shop);
  return { settings };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  
  const settingsJson = formData.get("settings");
  
  if (typeof settingsJson !== "string") {
    return { status: "error", message: "Invalid settings format" };
  }

  try {
    const parsed = JSON.parse(settingsJson);
    const validated = PetSettingsSchema.parse(parsed);
    await PetProfileService.updateSettings(session.shop, validated);
    return { status: "success", message: "Settings saved successfully" };
  } catch (error: any) {
    if (error.name === "ZodError") {
      return { status: "error", message: error.errors.map((e: any) => e.message).join(", ") };
    }
    return { status: "error", message: "Failed to save settings" };
  }
};

export default function PetTypesPage() {
  const data = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  if (navigation.state === "loading" && !data) {
    return <SkeletonTablePage title="Breed Logic Configurator" />;
  }

  if (!data) return null;
  const { settings } = data;
  const fetcher = useFetcher<{ status: string; message: string }>();
  const shopify = useAppBridge();
  
  const isLoading = fetcher.state !== "idle";

  const [types, setTypes] = useState<PetTypeConfig[]>(settings.types || []);
  const [dirty, setDirty] = useState(false);
  
  // Modal State
  const [activeModal, setActiveModal] = useState(false);
  const [editingType, setEditingType] = useState<PetTypeConfig | null>(null);
  const [newBreedInput, setNewBreedInput] = useState("");
  const [guideActive, setGuideActive] = useState(false);

  useEffect(() => {
    if (fetcher.data?.status === "success") {
      shopify.toast.show("Settings saved successfully");
      setDirty(false);
    } else if (fetcher.data?.status === "error") {
      shopify.toast.show(fetcher.data.message, { isError: true });
    }
  }, [fetcher.data, shopify]);

  const handleSave = () => {
    const newSettings: PetSettings = {
      types,
      weightUnit: settings.weightUnit || "kg"
    };
    fetcher.submit({ settings: JSON.stringify(newSettings) }, { method: "post" });
  };

  const openModal = (type: PetTypeConfig | null) => {
    if (type) {
      setEditingType({ ...type, breeds: [...type.breeds] }); // Deep copy breeds
    } else {
      setEditingType({
        id: crypto.randomUUID(),
        label: "",
        breeds: [],
      });
    }
    setNewBreedInput("");
    setActiveModal(true);
  };

  const closeModal = () => {
    setActiveModal(false);
    setEditingType(null);
  };

  const handleModalSave = () => {
    if (!editingType) return;
    
    // Basic validation
    if (!editingType.label.trim()) {
      shopify.toast.show("Type name is required", { isError: true });
      return;
    }

    const newTypes = [...types];
    const existingIndex = newTypes.findIndex((t) => t.id === editingType.id);

    if (existingIndex >= 0) {
      newTypes[existingIndex] = editingType;
    } else {
      newTypes.push(editingType);
    }

    setTypes(newTypes);
    setDirty(true);
    closeModal();
  };

  const handleDeleteType = (id: string) => {
    const newTypes = types.filter((t) => t.id !== id);
    setTypes(newTypes);
    setDirty(true);
  };

  // Breed Management inside Modal
  const addBreed = () => {
    if (!newBreedInput.trim() || !editingType) return;
    if (editingType.breeds.includes(newBreedInput.trim())) return;

    setEditingType({
      ...editingType,
      breeds: [...editingType.breeds, newBreedInput.trim()],
    });
    setNewBreedInput("");
  };

  const removeBreed = (breedToRemove: string) => {
    if (!editingType) return;
    setEditingType({
      ...editingType,
      breeds: editingType.breeds.filter((b) => b !== breedToRemove),
    });
  };

  return (
    <Page
      title="Breed Logic Configurator"
      primaryAction={{
        content: "Save Configuration",
        onAction: handleSave,
        loading: isLoading,
        disabled: !dirty,
        icon: SaveIcon,
      }}
      secondaryActions={[
          {
          content: "Page Guide",
          icon: InfoIcon,
          onAction: () => setGuideActive(true),
        },
        {
          content: "New Breed Logic",
          icon: PlusIcon,
          onAction: () => openModal(null),
        }      
      ]}
    >
      <PageGuide 
        content={GUIDE_CONTENT.petTypes} 
        active={guideActive} 
        onClose={() => setGuideActive(false)} 
      />
      <motion.div initial="hidden" animate="visible" variants={STAGGER_CONTAINER_VARIANTS}>
        <Layout>
          <Layout.Section>
            <motion.div variants={STAGGER_ITEM_VARIANTS}>
              <Card padding="0">
                {types.length === 0 ? (
                  <EmptyState
                    heading="No Breed Logic Configured"
                    action={{ content: "New Breed Logic", onAction: () => openModal(null) }}
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <p>Configure smart breed logic (e.g. Dog, Cat) to power the Perfect Fit engine.</p>
                  </EmptyState>
                ) : (
                  <ResourceList
                    resourceName={{ singular: "pet type", plural: "pet types" }}
                    items={types}
                    renderItem={(item) => {
                      const { id, label, breeds } = item;
                      const media = <Avatar customer size="md" name={label} />;

                      return (
                        <ResourceItem
                          id={id}
                          url="#"
                          onClick={() => openModal(item)}
                          media={media}
                          accessibilityLabel={`View details for ${label}`}
                          shortcutActions={[
                            {
                              content: "Delete",
                              accessibilityLabel: `Delete ${label}`,
                              onAction: () => handleDeleteType(id),
                            }
                          ]}
                        >
                          <Text variant="bodyMd" fontWeight="bold" as="h3">
                            {label}
                          </Text>
                          <Text variant="bodySm" as="p" tone="subdued">
                            {breeds.length} breeds configured
                          </Text>
                        </ResourceItem>
                      );
                    }}
                  />
                )}
              </Card>
            </motion.div>
          </Layout.Section>
        </Layout>
      </motion.div>

      <Modal
        open={activeModal}
        onClose={closeModal}
        title={editingType?.label ? `Edit ${editingType.label} Logic` : "New Breed Logic"}
        primaryAction={{
          content: "Done",
          onAction: handleModalSave,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: closeModal,
          },
        ]}
      >
        <Modal.Section>
          <FormLayout>
            <TextField
              label="Type Name"
              value={editingType?.label || ""}
              onChange={(val) => setEditingType(prev => prev ? { ...prev, label: val } : null)}
              autoComplete="off"
              placeholder="e.g. Dog, Cat, Bird"
            />
            
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm">Breeds</Text>
              <TextField
                label="Add Breed"
                labelHidden
                value={newBreedInput}
                onChange={setNewBreedInput}
                autoComplete="off"
                placeholder="Type a breed and press Enter"
                connectedRight={
                  <Button onClick={addBreed} disabled={!newBreedInput.trim()}>Add</Button>
                }
              />
              
              <InlineStack gap="200" wrap>
                {editingType?.breeds.map((breed) => (
                  <Tag key={breed} onRemove={() => removeBreed(breed)}>
                    {breed}
                  </Tag>
                ))}
                {editingType?.breeds.length === 0 && (
                   <Text tone="subdued" as="p">No breeds added yet.</Text>
                )}
              </InlineStack>
            </BlockStack>
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
