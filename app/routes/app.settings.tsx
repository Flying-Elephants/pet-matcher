import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data, useLoaderData, useSubmit } from "react-router";
import {
  Page,
  Layout,
  Card,
  TextField,
  BlockStack,
  PageActions,
  FormLayout,
  Text,
  Select,
} from "@shopify/polaris";
import { InfoIcon } from "@shopify/polaris-icons";
import { useState, useEffect } from "react";
import { authenticate } from "../shopify.server";
import { PageGuide } from "../components/PageGuide";
import { GUIDE_CONTENT } from "../modules/Core/guide-content";
import { PetProfileService, PetSettingsSchema } from "../modules/PetProfiles";
import { useActionData } from "react-router";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const settings = await PetProfileService.getSettings(session.shop);

  return data({ settings });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  
  try {
    const rawSettings = JSON.parse(formData.get("settings") as string);
    const validatedSettings = PetSettingsSchema.parse(rawSettings);

    await PetProfileService.updateSettings(session.shop, validatedSettings);
    return data({ success: true });
  } catch (error) {
    console.error("Settings update error:", error);
    return data({ success: false, error: "Invalid settings data" }, { status: 400 });
  }
};

export default function Settings() {
  const { settings } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [formState, setFormState] = useState(settings);
  const [guideActive, setGuideActive] = useState(false);
  const submit = useSubmit();

  useEffect(() => {
    if (actionData?.success) {
      shopify.toast.show("Settings saved");
    }
  }, [actionData]);

  const handleSave = () => {
    submit({ settings: JSON.stringify(formState) }, { method: "post" });
  };

  return (
    <Page 
      title="Settings"
      secondaryActions={[
        {
          content: "Page Guide",
          icon: InfoIcon,
          onAction: () => setGuideActive(true),
        }
      ]}
    >
      <PageGuide 
        content={GUIDE_CONTENT.settings} 
        active={guideActive} 
        onClose={() => setGuideActive(false)} 
      />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Pet Profile Settings</Text>
              <FormLayout>
                <Select
                  label="Weight Unit"
                  options={[
                    { label: "Kilograms (kg)", value: "kg" },
                    { label: "Pounds (lbs)", value: "lbs" },
                  ]}
                  value={formState.weightUnit}
                  onChange={(value) => setFormState({ ...formState, weightUnit: value as any })}
                />
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>
        <Layout.Section>
          <PageActions
            primaryAction={{
              content: "Save",
              onAction: handleSave,
            }}
          />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
