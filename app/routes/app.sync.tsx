import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useFetcher, useRevalidator, useNavigate } from "react-router";
import { useEffect, useRef } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { ProductRuleService } from "../modules/ProductRules";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const status = await ProductRuleService.getSyncStatus(admin);
  return { status };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  
  const status = await ProductRuleService.getSyncStatus(admin);
  if (status?.status === "RUNNING" || status?.status === "CREATED") {
      return { success: false, error: "Sync already in progress" };
  }

  try {
    const result = await ProductRuleService.syncProducts(admin);
    return { result, success: true, timestamp: Date.now() };
  } catch (error: any) {
    return { error: error.message, success: false };
  }
};

export default function SyncPage() {
  const { status } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  const shopify = useAppBridge();
  const navigate = useNavigate();
  
  const isSubmitting = fetcher.state !== "idle";
  const isRunning = status?.status === "RUNNING" || status?.status === "CREATED";
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSubmissionRef = useRef<number | null>(null);

  // Handle toast notifications only once per submission
  useEffect(() => {
    const data = fetcher.data as any;
    if (data?.success && data.timestamp !== lastSubmissionRef.current) {
      lastSubmissionRef.current = data.timestamp;
      shopify.toast.show("Bulk operation initiated successfully");
      revalidator.revalidate();
    } else if (data?.error) {
      shopify.toast.show(`Error: ${data.error}`, { isError: true });
    }
  }, [fetcher.data, shopify, revalidator]);

  // Stable polling mechanism
  useEffect(() => {
    if (isRunning && revalidator.state === "idle") {
        pollTimerRef.current = setTimeout(() => {
            revalidator.revalidate();
        }, 10000);
    }

    return () => {
        if (pollTimerRef.current) {
            clearTimeout(pollTimerRef.current);
        }
    };
  }, [isRunning, revalidator.state]);

  const startSync = () => {
    if (isRunning || isSubmitting) return;
    fetcher.submit({}, { method: "POST" });
  };

  return (
    <s-page heading="Product Sync">
      <s-button slot="primary-action" onClick={() => navigate("/app")}>
          Return to Dashboard
      </s-button>

      <s-section heading="Status">
        <s-stack direction="block" gap="base">
          <s-stack direction="inline" gap="base">
            <s-text>Current Status: {status?.status || "No active operation"}</s-text>
            {isRunning && <s-text tone="info">(Status Polling Active)</s-text>}
          </s-stack>
          
          {status?.objectCount && (
            <s-text>Objects Processed: {String(status.objectCount)}</s-text>
          )}

          <s-button 
            disabled={isSubmitting || isRunning} 
            onClick={startSync}
            loading={isSubmitting}
          >
              {isSubmitting ? "Starting Sync..." : isRunning ? "Sync in Progress" : "Start Bulk Sync"}
          </s-button>
        </s-stack>
      </s-section>
      
      {fetcher.data && (fetcher.data as any).result && (
        <s-section heading="Operation Details">
           <s-box padding="base" border-width="base" border-radius="base">
              <pre>{JSON.stringify((fetcher.data as any).result, null, 2)}</pre>
           </s-box>
        </s-section>
      )}
    </s-page>
  );
}

export { ErrorBoundary } from "../components/ErrorBoundary";
