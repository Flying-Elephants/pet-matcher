import { Modal, Text, BlockStack } from "@shopify/polaris";
import { useCallback } from "react";

export interface GuideSection {
  heading?: string;
  content: string;
}

export interface GuideContent {
  title: string;
  sections: GuideSection[];
}

interface PageGuideProps {
  content: GuideContent;
  active: boolean;
  onClose: () => void;
}

export function PageGuide({ content, active, onClose }: PageGuideProps) {
  const toggleModal = useCallback(() => onClose(), [onClose]);

  return (
    <Modal
      open={active}
      onClose={toggleModal}
      title={content.title}
      primaryAction={{
        content: "Close",
        onAction: toggleModal,
      }}
    >
      <Modal.Section>
        <BlockStack gap="400">
          {content.sections.map((section, index) => (
            <BlockStack gap="200" key={index}>
              {section.heading && (
                <Text as="h3" variant="headingSm">
                  {section.heading}
                </Text>
              )}
              <Text as="p" variant="bodyMd">
                {section.content}
              </Text>
            </BlockStack>
          ))}
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}
