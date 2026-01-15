import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data, useLoaderData, useSubmit, useNavigation } from "react-router";
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
  Checkbox,
} from "@shopify/polaris";
import { InfoIcon } from "@shopify/polaris-icons";
import { useState, useEffect } from "react";
import { authenticate } from "../shopify.server";
import { PageGuide } from "../components/PageGuide";
import { GUIDE_CONTENT } from "../modules/Core/guide-content";
import { PetProfileService, PetSettingsSchema } from "../modules/PetProfiles";
import { ComplianceService } from "../modules/Core";
import { useActionData } from "react-router";
import { SkeletonLoadingPage } from "../components/SkeletonLoadingPage";
import { motion } from "framer-motion";
import { useAppBridge } from "@shopify/app-bridge-react";
import { FADE_IN_VARIANTS, STAGGER_CONTAINER_VARIANTS, STAGGER_ITEM_VARIANTS } from "../modules/Core/animations";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const [settings, securitySettings] = await Promise.all([
    PetProfileService.getSettings(session.shop),
    ComplianceService.getSettings(session.shop)
  ]);

  return data({ settings, securitySettings });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  
  try {
    const rawSettings = JSON.parse(formData.get("settings") as string);
    const validatedSettings = PetSettingsSchema.parse(rawSettings);
    const limitCollaboratorAccess = formData.get("limitCollaboratorAccess") === "true";

    await Promise.all([
      PetProfileService.updateSettings(session.shop, validatedSettings),
      ComplianceService.updateSettings(session.shop, limitCollaboratorAccess)
    ]);
    return data({ success: true });
  } catch (error) {
    console.error("Settings update error:", error);
    return data({ success: false, error: "Invalid settings data" }, { status: 400 });
  }
};

export default function Settings() {
  const data = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  if (navigation.state === "loading" && !data) {
    return <SkeletonLoadingPage />;
  }

  if (!data) return null;
  const { settings, securitySettings } = data;
  const actionData = useActionData<typeof action>();
  const shopify = useAppBridge();
  const [formState, setFormState] = useState(settings);
  const [limitCollaboratorAccess, setLimitCollaboratorAccess] = useState(securitySettings.limitCollaboratorAccess);
  const [guideActive, setGuideActive] = useState(false);
  const submit = useSubmit();

  useEffect(() => {
    if (actionData?.success) {
      shopify.toast.show("Settings saved");
    }
  }, [actionData]);

  const handleSave = () => {
    submit(
      {
        settings: JSON.stringify(formState),
        limitCollaboratorAccess: String(limitCollaboratorAccess)
      },
      { method: "post" }
    );
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
      <motion.div initial="hidden" animate="visible" variants={STAGGER_CONTAINER_VARIANTS}>
        <Layout>
          <Layout.Section>
            <motion.div variants={STAGGER_ITEM_VARIANTS}>
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">Retention Engine: Profile Settings</Text>
                  <FormLayout>
                    <Select
                      label="Weight Unit (for Perfect Fit Logic)"
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
            </motion.div>
          </Layout.Section>
          <Layout.Section>
            <motion.div variants={STAGGER_ITEM_VARIANTS}>
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">Security & Compliance</Text>
                  <FormLayout>
                    <Checkbox
                      label="Limit Staff access to Customer Personal Data"
                      helpText="If enabled, Shopify Collaborator accounts will be restricted from viewing pet profiles in the Retention Center."
                      checked={limitCollaboratorAccess}
                      onChange={(checked) => setLimitCollaboratorAccess(checked)}
                    />
                    <Text variant="bodySm" tone="subdued" as="p">
                      Audit logging for PII access is enabled by default to comply with Shopify Security standards.
                    </Text>
                  </FormLayout>
                </BlockStack>
              </Card>
            </motion.div>
          </Layout.Section>
          <Layout.Section>
            <motion.div variants={STAGGER_ITEM_VARIANTS}>
              <PageActions
                primaryAction={{
                  content: "Save",
                  onAction: handleSave,
                }}
              />
            </motion.div>
          </Layout.Section>
        </Layout>
      </motion.div>
    </Page>
  );
}
