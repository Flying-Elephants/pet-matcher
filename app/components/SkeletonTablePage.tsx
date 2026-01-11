import {
  SkeletonPage,
  Card,
  SkeletonBodyText,
  BlockStack,
  DataTable,
  SkeletonDisplayText,
} from "@shopify/polaris";
import React from "react";

interface SkeletonTablePageProps {
  title?: string;
  rowCount?: number;
}

export const SkeletonTablePage: React.FC<SkeletonTablePageProps> = ({
  title,
  rowCount = 5,
}) => {
  const rows = Array(rowCount).fill([
    <SkeletonBodyText key="1" lines={1} />,
    <SkeletonBodyText key="2" lines={1} />,
    <SkeletonBodyText key="3" lines={1} />,
  ]);

  return (
    <SkeletonPage title={title} primaryAction>
      <Card>
        <BlockStack gap="400">
          <DataTable
            columnContentTypes={["text", "text", "text"]}
            headings={[
              <SkeletonDisplayText key="h1" size="small" />,
              <SkeletonDisplayText key="h2" size="small" />,
              <SkeletonDisplayText key="h3" size="small" />,
            ]}
            rows={rows}
          />
        </BlockStack>
      </Card>
    </SkeletonPage>
  );
};
