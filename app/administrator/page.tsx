import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getUiTranslations } from "@/lib/i18n/ui";
import { localizePath } from "@/lib/i18n/routing";

export default async function AdministratorPage() {
  await requirePermission("roles.manage");
  const locale = await getCurrentLocale();
  const ui = getUiTranslations(locale);
  const href = (path: string) => localizePath(path, locale);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold">Administrator</h1>
      <p className="mt-1 text-[var(--ink-2)]">Full configuration and editing tools for site administration.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Link href={href("/admin/listings")} className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold">Moderation & listings</p>
          <p className="mt-1 text-sm text-[var(--ink-2)]">Review pending ads, approve or reject listings, and monitor workflow state.</p>
        </Link>
        <Link href={href("/administrator/settings")} className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold">Site settings</p>
          <p className="mt-1 text-sm text-[var(--ink-2)]">Manage branding, navigation, homepage content, and the admin step-up security window.</p>
        </Link>
        <Link href={href("/admin/categories")} className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold">Categories & schemas</p>
          <p className="mt-1 text-sm text-[var(--ink-2)]">Create categories, manage aliases, and define schema profiles for posting flows.</p>
        </Link>
        <Link href={href("/admin/pages")} className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold">Static pages</p>
          <p className="mt-1 text-sm text-[var(--ink-2)]">Create and publish CMS content for policy, help, and informational routes.</p>
        </Link>
        <Link href={href("/admin/users")} className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold">Users</p>
          <p className="mt-1 text-sm text-[var(--ink-2)]">Inspect accounts and coordinate user administration.</p>
        </Link>
        <Link href={href("/admin/roles")} className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold">Roles & permissions</p>
          <p className="mt-1 text-sm text-[var(--ink-2)]">Adjust RBAC access and keep admin capabilities aligned with policy.</p>
        </Link>
        <Link href={href("/admin/audit")} className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold">Audit log</p>
          <p className="mt-1 text-sm text-[var(--ink-2)]">Review privileged changes and track the latest admin activity.</p>
        </Link>
        <Link href={href("/admin/search")} className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold">Search administration</p>
          <p className="mt-1 text-sm text-[var(--ink-2)]">Tune search behavior, aliases, and zero-result handling.</p>
        </Link>
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--line)] bg-white p-4">
        <h2 className="font-display text-xl font-bold">Administrator access</h2>
        <p className="mt-2 text-sm text-[var(--ink-2)]">
          This area is now organized as a control center for configuration, moderation, RBAC, audit review, and broader data editing.
        </p>
        <p className="mt-2 text-sm text-[var(--ink-2)]">
          {ui.admin.listingApprovalQueue} remains in the moderator/admin area.
        </p>
        <p className="mt-4 text-sm text-[var(--ink-2)]">
          Site settings are editable from the dedicated settings form, which updates the core marketplace branding, content, navigation, and security policy.
        </p>
      </div>
    </main>
  );
}
