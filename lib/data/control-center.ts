import "server-only";

import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  FEATURED_CAMPAIGN_KEY,
  getActiveFeaturedCampaignConfig,
  getAdminAttentionSummary,
} from "@/lib/data/featured-payments";

type SupabaseLike = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type CountQuery = {
  eq: (column: string, value: unknown) => CountQuery;
  neq: (column: string, value: unknown) => CountQuery;
  in: (column: string, values: unknown[]) => CountQuery;
  gte: (column: string, value: unknown) => CountQuery;
  contains: (column: string, value: unknown) => CountQuery;
  or: (filters: string) => CountQuery;
};

type CountResult = {
  count: number | null;
  error?: { code?: string; message?: string } | null;
};

export type ReadinessStatus = "ready" | "attention" | "manual";

export type ControlCenterMetric = {
  label: string;
  value: number | string;
  href?: string;
  status?: ReadinessStatus;
  description?: string;
};

export type ControlCenterReadiness = {
  label: string;
  configured: boolean;
  status: ReadinessStatus;
  description: string;
};

export type SuperAdminControlCenterSnapshot = {
  generatedAt: string;
  deployment: {
    environment: string;
    commitSha: string | null;
    deploymentUrl: string | null;
    productionUrl: string | null;
    supabaseProjectRef: string | null;
  };
  readiness: ControlCenterReadiness[];
  operations: ControlCenterMetric[];
  security: ControlCenterMetric[];
  paymentsAi: ControlCenterMetric[];
  inventoryBusiness: ControlCenterMetric[];
};

function hasValue(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function safeSupabaseRefFromUrl(url: string | undefined) {
  if (!hasValue(url)) return null;
  try {
    const host = new URL(url).host;
    const [ref] = host.split(".");
    return ref || null;
  } catch {
    return null;
  }
}

function deploymentUrl() {
  if (!hasValue(process.env.VERCEL_URL)) return null;
  return `https://${process.env.VERCEL_URL}`;
}

async function getControlCenterClient(): Promise<SupabaseLike> {
  if (hasValue(process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    return createSupabaseAdmin() as unknown as SupabaseLike;
  }
  return createSupabaseServerClient();
}

async function safeCount(
  client: SupabaseLike,
  table: string,
  filter?: (query: CountQuery) => CountQuery
) {
  try {
    let query = client
      .from(table)
      .select("id", { count: "exact", head: true }) as unknown as CountQuery;
    if (filter) {
      query = filter(query);
    }
    const { count, error } = await (query as unknown as PromiseLike<CountResult>);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

function readinessRow(label: string, configured: boolean, description: string): ControlCenterReadiness {
  return {
    label,
    configured,
    status: configured ? "ready" : "attention",
    description,
  };
}

export async function getSuperAdminControlCenterSnapshot(): Promise<SuperAdminControlCenterSnapshot> {
  const client = await getControlCenterClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [attention, campaign] = await Promise.all([
    getAdminAttentionSummary(),
    getActiveFeaturedCampaignConfig(),
  ]);

  const [
    featureFlags,
    rateLimitBuckets,
    auditEventsSevenDays,
    aiParseEventsSevenDays,
    aiDetectionLogsSevenDays,
    aiModerationReviews,
    riskSignals,
    qualitySignals,
    moderationWorkflowEntries,
    notificationsUnread,
    sellerEntities,
    organizations,
    organizationMembers,
    schemaVersions,
    searchAliases,
    importSources,
    importJobs,
    optOuts,
  ] = await Promise.all([
    safeCount(client, "feature_flags"),
    safeCount(client, "app_rate_limit_buckets"),
    safeCount(client, "audit_logs", (query) => query.gte("created_at", sevenDaysAgo)),
    safeCount(client, "ai_search_parse_events", (query) => query.gte("created_at", sevenDaysAgo)),
    safeCount(client, "ai_detection_logs", (query) => query.gte("created_at", sevenDaysAgo)),
    safeCount(client, "ai_moderation_reviews"),
    safeCount(client, "listing_risk_signals"),
    safeCount(client, "listing_quality_signals"),
    safeCount(client, "moderation_workflow_entries"),
    safeCount(client, "notifications", (query) => query.eq("is_read", false)),
    safeCount(client, "seller_entities"),
    safeCount(client, "organizations"),
    safeCount(client, "organization_members"),
    safeCount(client, "listing_schema_versions"),
    safeCount(client, "search_aliases"),
    safeCount(client, "listing_sources"),
    safeCount(client, "listing_ingest_jobs"),
    safeCount(client, "external_import_opt_outs"),
  ]);

  const hasServiceRole = hasValue(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const hasSupabaseUrl = hasValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasAnonKey = hasValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const hasAiKey = hasValue(process.env.HUGGINGFACE_API_KEY);

  return {
    generatedAt: new Date().toISOString(),
    deployment: {
      environment: process.env.VERCEL_ENV ?? "local",
      commitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      deploymentUrl: deploymentUrl(),
      productionUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : null,
      supabaseProjectRef: safeSupabaseRefFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
    },
    readiness: [
      readinessRow("Supabase URL", hasSupabaseUrl, "Public project URL is configured; only the project ref is displayed."),
      readinessRow("Supabase anon key", hasAnonKey, "Browser-safe Supabase key exists; value is never rendered."),
      readinessRow("Supabase service role", hasServiceRole, "Server-only operational reads and signed receipt URLs can use the admin client."),
      readinessRow("Hugging Face AI key", hasAiKey, "AI features can use the configured provider when enabled."),
      {
        label: "Security Advisor",
        configured: true,
        status: "manual",
        description: "Release process verifies Supabase Security Advisor externally; this page does not store advisor API output.",
      },
      {
        label: "Performance Advisor",
        configured: true,
        status: "manual",
        description: "Performance Advisor warnings are reviewed in release notes; low-traffic unused-index warnings are not auto-fixed.",
      },
    ],
    operations: [
      { label: "Pending listings", value: attention.pendingListings, href: "/admin/listings" },
      { label: "Reported listings", value: attention.reportedListings, href: "/admin/listings" },
      { label: "Users requiring review", value: attention.usersRequiringReview, href: "/admin/users" },
      { label: "Recent moderation", value: attention.recentModerationActions, href: "/admin/audit" },
      { label: "Operational alerts", value: attention.unreadOperationalAlerts, href: "/admin" },
      { label: "Today / 7-day listings", value: `${attention.listingsToday} / ${attention.listingsSevenDays}` },
      { label: "Today / 7-day contacts", value: `${attention.contactActionsToday} / ${attention.contactActionsSevenDays}` },
    ],
    security: [
      { label: "Role management", value: "RBAC matrix", href: "/admin/roles", status: "ready" },
      { label: "MFA/AAL2 status", value: "Verified factors", href: "/admin/roles", status: "ready" },
      { label: "Feature flags", value: featureFlags, href: "/administrator/settings" },
      { label: "Rate-limit buckets", value: rateLimitBuckets, href: "/administrator/settings" },
      { label: "Audit events / 7 days", value: auditEventsSevenDays, href: "/admin/audit" },
    ],
    paymentsAi: [
      {
        label: "Featured campaign",
        value: campaign?.is_active ? `${campaign.amount} ${campaign.currency} / ${campaign.duration_days}d` : "Not active",
        href: "/administrator/promotions",
        status: campaign?.is_active ? "ready" : "attention",
        description: `Campaign key: ${FEATURED_CAMPAIGN_KEY}`,
      },
      { label: "Payment review queue", value: attention.pendingReview, href: "/admin/featured-payments" },
      { label: "AI parse events / 7 days", value: aiParseEventsSevenDays, href: "/admin/search" },
      { label: "AI detection logs / 7 days", value: aiDetectionLogsSevenDays, href: "/admin/listings" },
      { label: "AI moderation reviews", value: aiModerationReviews, href: "/admin/listings" },
      { label: "Risk / quality signals", value: `${riskSignals} / ${qualitySignals}`, href: "/admin/listings" },
      { label: "Moderation workflow entries", value: moderationWorkflowEntries, href: "/admin/listings" },
    ],
    inventoryBusiness: [
      { label: "Import sources", value: importSources, href: "/admin/inventory" },
      { label: "Import jobs", value: importJobs, href: "/admin/inventory" },
      { label: "Import candidates", value: attention.importCandidates, href: "/admin/inventory" },
      { label: "Import failures", value: attention.importFailures, href: "/admin/inventory" },
      { label: "Claims pending", value: attention.claimsPending, href: "/admin/inventory" },
      { label: "Duplicate review", value: attention.duplicateReview, href: "/admin/inventory" },
      { label: "External opt-outs", value: optOuts, href: "/admin/inventory" },
      { label: "Seller entities", value: sellerEntities, href: "/dashboard/professional-seller" },
      { label: "Organizations / members", value: `${organizations} / ${organizationMembers}`, href: "/dashboard/professional-seller" },
      { label: "Schema versions", value: schemaVersions, href: "/admin/listing-schema" },
      { label: "Search aliases", value: searchAliases, href: "/admin/search" },
      { label: "Unread notifications", value: notificationsUnread, href: "/dashboard/settings/notifications" },
    ],
  };
}
