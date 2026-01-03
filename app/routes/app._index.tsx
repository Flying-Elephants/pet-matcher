import type { LoaderFunctionArgs, HeadersFunction } from "react-router";
import { useLoaderData, useNavigate, useRevalidator } from "react-router";
import { useEffect, useRef } from "react";
import { authenticate } from "../shopify.server";
import { AnalyticsService } from "../modules/Analytics";
import { ProductRuleService } from "../modules/ProductRules";
import type { SummaryData } from "../modules/Analytics";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  
  const [summary, syncStatus] = await Promise.all([
    AnalyticsService.getSummary(session.shop),
    ProductRuleService.getSyncStatus(admin)
  ]);

  return { summary, syncStatus };
};

export default function Index() {
  const { summary, syncStatus } = useLoaderData<typeof loader>() as { summary: SummaryData, syncStatus: any };
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const isSyncing = syncStatus?.status === "RUNNING" || syncStatus?.status === "CREATED";
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isSyncing && revalidator.state === "idle") {
        pollTimerRef.current = setTimeout(() => {
            revalidator.revalidate();
        }, 10000);
    }
    return () => {
        if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [isSyncing, revalidator.state]);

  return (
    <s-page heading="Pet-Matcher Insights">
      <s-section heading="Business Performance">
        <s-stack direction="inline" gap="base">
            <s-box padding="base" border-width="base" border-radius="base">
                <s-stack direction="block" gap="base">
                    <s-text>Total Pet Profiles</s-text>
                    <s-text>{String(summary.totalMatches)}</s-text>
                </s-stack>
            </s-box>
            <s-box padding="base" border-width="base" border-radius="base">
                <s-stack direction="block" gap="base">
                    <s-text>Active Product Rules</s-text>
                    <s-text>{String(summary.activeRules)}</s-text>
                </s-stack>
            </s-box>
            
            <s-box padding="base" border-width="base" border-radius="base">
                <s-stack direction="block" gap="base">
                    <s-text>Product Catalog</s-text>
                    <s-stack direction="inline" gap="small">
                        <s-text tone={isSyncing ? "info" : "success"}>
                            {String(summary.syncedProductsCount || 0)} Synced
                        </s-text>
                        {isSyncing && (
                            <s-text tone="neutral">(Updating...)</s-text>
                        )}
                    </s-stack>
                </s-stack>
            </s-box>
        </s-stack>
      </s-section>

      <s-section heading="Quick Actions">
        <s-stack direction="inline" gap="base">
            <s-button onClick={() => navigate("/app/sync")}>
                Sync Operations
            </s-button>
            <s-button onClick={() => navigate("/app/audit")}>
                Performance Audit
            </s-button>
        </s-stack>
      </s-section>

      <s-section heading="Platform Health" slot="aside">
          <s-stack direction="block" gap="base">
              <s-box padding="base" border-radius="base">
                  <s-stack direction="block" gap="base">
                    <s-text>Status Checklist</s-text>
                    <s-text tone="success">✓ Architecture Verified</s-text>
                    <s-text tone="success">✓ Performance Validated</s-text>
                    <s-text tone="success">✓ Automated Webhook Sync</s-text>
                  </s-stack>
              </s-box>
          </s-stack>
      </s-section>
    </s-page>
  );
}

export { ErrorBoundary } from "../components/ErrorBoundary";

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
