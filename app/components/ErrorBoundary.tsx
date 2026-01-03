import { useRouteError, isRouteErrorResponse } from "react-router";

export function ErrorBoundary() {
  const error = useRouteError();
  let errorMessage = "An unexpected error occurred.";

  if (isRouteErrorResponse(error)) {
    errorMessage = `${error.status} ${error.statusText}`;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <s-page heading="Error">
      <s-section heading="Something went wrong">
        <s-stack direction="block" gap="base">
          <s-text tone="critical">{errorMessage}</s-text>
          <s-link href="/app">Return to Dashboard</s-link>
        </s-stack>
      </s-section>
    </s-page>
  );
}
