import { data } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSubmit, useNavigation } from "react-router";
import { Page, Layout, Card, Text, BlockStack, TextField, Button, Tag, InlineStack, Box } from "@shopify/polaris";
import { useState } from "react";
import { authenticate } from "../shopify.server";
import { PetProfileService } from "../modules/PetProfiles";
import type { PetTypeConfig } from "../modules/PetProfiles/core/types";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const settings = await PetProfileService.getSettings(session.shop);
  return data({ settings });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const settingsJson = formData.get("settings") as string;
  
  try {
    const settings = JSON.parse(settingsJson);
    await PetProfileService.updateSettings(session.shop, settings);
    return data({ status: "success", message: "Settings saved successfully" });
  } catch (error) {
    return data({ status: "error", message: "Failed to save settings" }, { status: 400 });
  }
};

export default function Settings() {
  const { settings } = useLoaderData<typeof loader>();
  const [types, setTypes] = useState<PetTypeConfig[]>(settings.types || []);
  const [newType, setNewType] = useState("");
  const [newBreed, setNewBreed] = useState<Record<string, string>>({});
  
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSaving = navigation.state === "submitting";

  const handleSave = () => {
    submit({ settings: JSON.stringify({ types }) }, { method: "post" });
  };

  const handleAddType = () => {
    if (!newType.trim()) return;
    setTypes([...types, { 
      id: newType.toLowerCase().replace(/\s+/g, '-'), 
      label: newType, 
      breeds: [] 
    }]);
    setNewType("");
  };

  const handleRemoveType = (index: number) => {
    const newTypes = [...types];
    newTypes.splice(index, 1);
    setTypes(newTypes);
  };

  const handleAddBreed = (typeIndex: number) => {
    const breedName = newBreed[typeIndex];
    if (!breedName?.trim()) return;

    const newTypes = [...types];
    if (!newTypes[typeIndex].breeds.includes(breedName)) {
      newTypes[typeIndex].breeds.push(breedName);
    }
    
    setTypes(newTypes);
    setNewBreed({ ...newBreed, [typeIndex]: "" });
  };

  const handleRemoveBreed = (typeIndex: number, breedToRemove: string) => {
    const newTypes = [...types];
    newTypes[typeIndex].breeds = newTypes[typeIndex].breeds.filter(b => b !== breedToRemove);
    setTypes(newTypes);
  };

  return (
    <Page 
      title="Pet Profile Configuration" 
      primaryAction={{ content: "Save Changes", onAction: handleSave, loading: isSaving }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="500">
              <Text as="h2" variant="headingMd">Pet Types & Breeds</Text>
              <Text as="p" tone="subdued">Define the available pet types and their corresponding breeds for the storefront form.</Text>
              
              {/* Add New Type */}
              <InlineStack gap="300" align="start">
                <div style={{ flex: 1 }}>
                    <TextField
                    label="Add New Pet Type"
                    value={newType}
                    onChange={setNewType}
                    autoComplete="off"
                    placeholder="e.g. Rabbit"
                    />
                </div>
                <div style={{ marginTop: '28px' }}>
                    <Button onClick={handleAddType} disabled={!newType.trim()}>Add Type</Button>
                </div>
              </InlineStack>

              {/* List Types */}
              <BlockStack gap="400">
                {types.map((type, index) => (
                  <Box 
                    key={type.id} 
                    padding="400" 
                    background="bg-surface-secondary" 
                    borderRadius="200"
                    borderColor="border"
                    borderWidth="025"
                  >
                    <BlockStack gap="400">
                      <InlineStack align="space-between">
                        <Text as="h3" variant="headingSm">{type.label}</Text>
                        <Button tone="critical" variant="plain" onClick={() => handleRemoveType(index)}>Remove Type</Button>
                      </InlineStack>

                      {/* Breeds Management */}
                      <BlockStack gap="200">
                         <Text as="h4" variant="bodySm" fontWeight="medium">Breeds ({type.breeds.length})</Text>
                         
                         <InlineStack gap="200">
                           {type.breeds.map((breed) => (
                             <Tag key={breed} onRemove={() => handleRemoveBreed(index, breed)}>{breed}</Tag>
                           ))}
                           {type.breeds.length === 0 && <Text as="span" tone="subdued">No breeds added yet.</Text>}
                         </InlineStack>

                         <InlineStack gap="200">
                           <div style={{ flexGrow: 1 }}>
                             <TextField 
                               label={`Add Breed for ${type.label}`} 
                               labelHidden 
                               placeholder="Add breed..." 
                               value={newBreed[index] || ""} 
                               onChange={(val) => setNewBreed({...newBreed, [index]: val})}
                               autoComplete="off"
                             />
                           </div>
                           <Button onClick={() => handleAddBreed(index)}>Add</Button>
                         </InlineStack>
                      </BlockStack>
                    </BlockStack>
                  </Box>
                ))}
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
