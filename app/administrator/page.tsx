import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getUiTranslations } from "@/lib/i18n/ui";
import { ADMIN_CONTROL_COPY } from "@/lib/i18n/admin-control-copy";
import { adminPath } from "@/lib/admin/routing";

export default async function AdministratorPage() {
  await requirePermission("roles.manage");
  const locale = await getCurrentLocale();
  const ui = getUiTranslations(locale);
  const copy = ADMIN_CONTROL_COPY[locale];
  const href = (path: string) => adminPath(path);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold">{copy.administrator}</h1>
      <p className="mt-1 text-[var(--ink-2)]">{copy.adminDescription}</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Link href={href("/admin/listings")} className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold">{copy.moderation}</p>
          <p className="mt-1 text-sm text-[var(--ink-2)]">{copy.moderationDescription}</p>
        </Link>
        <Link href={href("/administrator/settings")} className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold">{copy.siteSettings}</p>
          <p className="mt-1 text-sm text-[var(--ink-2)]">{copy.settingsDescription}</p>
        </Link>
        <Link href={href("/admin/categories")} className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold">{copy.categoriesSchemas}</p>
          <p className="mt-1 text-sm text-[var(--ink-2)]">{copy.categoriesDescription}</p>
        </Link>
        <Link href={href("/admin/listing-schema")} className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold">{copy.schemaBuilder}</p>
          <p className="mt-1 text-sm text-[var(--ink-2)]">{copy.schemaDescription}</p>
        </Link>
        <Link href={href("/admin/pages")} className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold">{copy.staticPages}</p>
          <p className="mt-1 text-sm text-[var(--ink-2)]">{copy.pagesDescription}</p>
        </Link>
        <Link href={href("/admin/users")} className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold">{copy.users}</p>
          <p className="mt-1 text-sm text-[var(--ink-2)]">{copy.usersDescription}</p>
        </Link>
        <Link href={href("/admin/roles")} className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold">{copy.rolesPermissions}</p>
          <p className="mt-1 text-sm text-[var(--ink-2)]">{copy.rolesDescription}</p>
        </Link>
        <Link href={href("/admin/audit")} className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold">{copy.auditLog}</p>
          <p className="mt-1 text-sm text-[var(--ink-2)]">{copy.auditDescription}</p>
        </Link>
        <Link href={href("/admin/search")} className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold">{copy.searchAdministration}</p>
          <p className="mt-1 text-sm text-[var(--ink-2)]">{copy.searchDescription}</p>
        </Link>
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--line)] bg-white p-4">
        <h2 className="font-display text-xl font-bold">{copy.administratorAccess}</h2>
        <p className="mt-2 text-sm text-[var(--ink-2)]">
          {copy.adminDescription}
        </p>
        <p className="mt-2 text-sm text-[var(--ink-2)]">
          {ui.admin.listingApprovalQueue} remains in the moderator/admin area.
        </p>
        <p className="mt-4 text-sm text-[var(--ink-2)]">
          {copy.settingsDescription}
        </p>
      </div>
    </main>
  );
}
