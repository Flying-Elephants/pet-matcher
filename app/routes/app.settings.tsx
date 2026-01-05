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
} from "@shopify/polaris";
import { InfoIcon } from "@shopify/polaris-icons";
import { useState } from "react";
import { authenticate } from "../shopify.server";
import { PageGuide } from "../components/PageGuide";
import { GUIDE_CONTENT } from "../modules/Core/guide-content";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return data({
    settings: {
      shopName: "My Pet Store",
      supportEmail: "support@mypetstore.com",
      autoSelectFirstPet: true,
    },
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await authenticate.admin(request);
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  console.log("Mock settings update:", data);

  return { success: true };
};

export default function Settings() {
  const { settings } = useLoaderData<typeof loader>();
  const [formState, setFormState] = useState(settings);
  const [guideActive, setGuideActive] = useState(false);
  const submit = useSubmit();

  const handleSave = () => {
    submit(formState as any, { method: "post" });
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
              <Text as="h2" variant="headingMd">General Settings</Text>
              <FormLayout>
                <TextField
                  label="Shop Name"
                  value={formState.shopName}
                  onChange={(value) => setFormState({ ...formState, shopName: value })}
                  autoComplete="off"
                />
                <TextField
                  label="Support Email"
                  type="email"
                  value={formState.supportEmail}
                  onChange={(value) => setFormState({ ...formState, supportEmail: value })}
                  autoComplete="email"
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
