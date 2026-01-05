import type { LoaderFunctionArgs } from "react-router";
import { data, useLoaderData } from "react-router";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  IndexTable,
} from "@shopify/polaris";
import { InfoIcon } from "@shopify/polaris-icons";
import { useState } from "react";
import { authenticate } from "../shopify.server";
import { PageGuide } from "../components/PageGuide";
import { GUIDE_CONTENT } from "../modules/Core/guide-content";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  const mockAnalytics = {
    totalMatches: 1250,
    activeSessions: 45,
    topPetType: "Dog",
    recentEvents: [
      { id: "1", petName: "Buddy", type: "Dog", breed: "Golden Retriever", date: "2026-01-05" },
      { id: "2", petName: "Mittens", type: "Cat", breed: "Persian", date: "2026-01-05" },
      { id: "3", petName: "Charlie", type: "Dog", breed: "Beagle", date: "2026-01-04" },
    ],
  };

  return data({ analytics: mockAnalytics });
};

export default function Dashboard() {
  const { analytics } = useLoaderData<typeof loader>();
  const [guideActive, setGuideActive] = useState(false);

  return (
    <Page 
      title="Dashboard"
      secondaryActions={[
        {
          content: "Page Guide",
          icon: InfoIcon,
          onAction: () => setGuideActive(true),
        }
      ]}
    >
      <PageGuide 
        content={GUIDE_CONTENT.dashboard} 
        active={guideActive} 
        onClose={() => setGuideActive(false)} 
      />
      <Layout>
        <Layout.Section>
          <InlineStack gap="400" align="start">
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">Total Matches</Text>
                <Text as="p" variant="headingLg" fontWeight="bold">{analytics.totalMatches}</Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">Active Sessions</Text>
                <Text as="p" variant="headingLg" fontWeight="bold">{analytics.activeSessions}</Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">Top Pet Type</Text>
                <Text as="p" variant="headingLg" fontWeight="bold">{analytics.topPetType}</Text>
              </BlockStack>
            </Card>
          </InlineStack>
        </Layout.Section>

        <Layout.Section>
          <Card padding="0">
            <IndexTable
              resourceName={{ singular: "event", plural: "events" }}
              itemCount={analytics.recentEvents.length}
              headings={[
                { title: "Pet Name" },
                { title: "Type" },
                { title: "Breed" },
                { title: "Date" },
              ]}
              selectable={false}
            >
              {analytics.recentEvents.map((event, index) => (
                <IndexTable.Row id={event.id} key={event.id} position={index}>
                  <IndexTable.Cell>
                    <Text variant="bodyMd" fontWeight="bold" as="span">{event.petName}</Text>
                  </IndexTable.Cell>
                  <IndexTable.Cell>{event.type}</IndexTable.Cell>
                  <IndexTable.Cell>{event.breed}</IndexTable.Cell>
                  <IndexTable.Cell>{event.date}</IndexTable.Cell>
                </IndexTable.Row>
              ))}
            </IndexTable>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
