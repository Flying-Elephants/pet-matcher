import type { ActionFunctionArgs } from "react-router";
import { AnalyticsService } from "../modules/Analytics";
import { PetProfileService } from "../modules/PetProfiles";
import { ProductRuleService } from "../modules/ProductRules";

/**
 * Maintenance endpoint for data retention and cleanup.
 * Ideally called via a secure cron job (e.g., GitHub Actions or Fly.io Cron).
 * Requires API_SECRET header for basic protection.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const authHeader = request.headers.get("Authorization");
  const expectedSecret = process.env.MAINTENANCE_API_SECRET;

  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { 
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  console.log("Starting data retention maintenance...");

  const [purgedEvents, purgedProfiles, purgedJobs] = await Promise.all([
    AnalyticsService.purgeOldEvents(90), // Keep 90 days of analytics
    PetProfileService.purgeInactiveProfiles(730), // Keep 2 years of inactive profiles
    ProductRuleService.purgeOldJobs(7), // Keep 7 days of background job history
  ]);

  console.log(`Maintenance Complete:
    - Purged Events: ${purgedEvents}
    - Purged Inactive Profiles: ${purgedProfiles}
    - Purged Old Jobs: ${purgedJobs}`);

  return new Response(JSON.stringify({
    success: true,
    stats: {
      purgedEvents,
      purgedProfiles,
      purgedJobs,
    },
  }), {
    headers: { "Content-Type": "application/json" }
  });
};
