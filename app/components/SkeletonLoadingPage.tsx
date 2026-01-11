import {
  SkeletonPage,
  Layout,
  Card,
  SkeletonBodyText,
  BlockStack,
  Box,
} from "@shopify/polaris";
import React from "react";

interface SkeletonLoadingPageProps {
  primaryAction?: boolean;
  fullWidth?: boolean;
}

export const SkeletonLoadingPage: React.FC<SkeletonLoadingPageProps> = ({
  primaryAction = false,
  fullWidth = false,
}) => {
  return (
    <SkeletonPage primaryAction={primaryAction} fullWidth={fullWidth}>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <SkeletonBodyText lines={3} />
            </BlockStack>
          </Card>
        </Layout.Section>
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <SkeletonBodyText lines={2} />
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </SkeletonPage>
  );
};
