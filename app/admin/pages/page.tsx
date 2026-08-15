import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import {
  getStaticPageAdminSnapshot,
  resolvePublishedStaticPage,
} from "@/lib/data/static-pages";
import {
  publishStaticPageAction,
  restoreStaticPageVersionAction,
  saveStaticPageAction,
} from "@/lib/actions/static-pages";
import { getCurrentLocale } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routing";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminStaticPagesPage({ searchParams }: PageProps) {
  await requirePermission("pages.view");
  const locale = await getCurrentLocale();
  const href = (path: string) => localizePath(path, locale);
  const params = searchParams ? await searchParams : {};
  const selectedKey = typeof params.page === "string" ? params.page : undefined;
  const snapshot = await getStaticPageAdminSnapshot(selectedKey);
  const selected = snapshot.selected;
  const selectedView = selected ? resolvePublishedStaticPage(selected as never, locale) : null;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Static pages</h1>
          <p className="mt-1 text-[var(--ink-2)]">Manage published pages and their draft content.</p>
        </div>
        <Link href={href("/admin")} className="rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold">
          Back to dashboard
        </Link>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[18rem_1fr]">
        <aside className="rounded-2xl border border-[var(--line)] bg-white p-4">
          <h2 className="font-display text-xl font-semibold">Pages</h2>
          <div className="mt-3 space-y-2">
            {snapshot.pages.map((page) => (
              <Link
                key={page.id}
                href={`${href("/admin/pages")}?page=${encodeURIComponent(page.page_key)}`}
                className={`block rounded-xl border px-3 py-2 text-sm ${page.page_key === selected?.page_key ? "border-[var(--ink-1)] bg-[var(--surface-2)]" : "border-[var(--line)] bg-white"}`}
              >
                <div className="font-semibold">{page.page_key}</div>
                <div className="text-xs text-[var(--ink-2)]">{page.slug_en}</div>
              </Link>
            ))}
          </div>
        </aside>

        <section className="space-y-6">
          <form action={saveStaticPageAction} className="rounded-2xl border border-[var(--line)] bg-white p-5">
            <input type="hidden" name="id" value={selected?.id ? String(selected.id) : ""} />
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-semibold md:col-span-2">
                Page key
                <input name="page_key" defaultValue={selected?.page_key ?? ""} required className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
              <label className="block text-sm font-semibold">
                English slug
                <input name="slug_en" defaultValue={selected?.slug_en ?? ""} required className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
              <label className="block text-sm font-semibold">
                Dari slug
                <input name="slug_fa" defaultValue={selected?.slug_fa ?? ""} required className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
              <label className="block text-sm font-semibold">
                Pashto slug
                <input name="slug_ps" defaultValue={selected?.slug_ps ?? ""} required className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <label className="block text-sm font-semibold">
                English title
                <input name="title_en" defaultValue={selected?.title_en ?? ""} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
              <label className="block text-sm font-semibold">
                Dari title
                <input name="title_fa" defaultValue={selected?.title_fa ?? ""} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
              <label className="block text-sm font-semibold">
                Pashto title
                <input name="title_ps" defaultValue={selected?.title_ps ?? ""} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <label className="block text-sm font-semibold">
                English body
                <textarea name="body_en" defaultValue={selected?.body_en ?? ""} className="mt-1 min-h-40 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
              <label className="block text-sm font-semibold">
                Dari body
                <textarea name="body_fa" defaultValue={selected?.body_fa ?? ""} className="mt-1 min-h-40 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
              <label className="block text-sm font-semibold">
                Pashto body
                <textarea name="body_ps" defaultValue={selected?.body_ps ?? ""} className="mt-1 min-h-40 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <label className="block text-sm font-semibold">
                English SEO title
                <input name="seo_title_en" defaultValue={selected?.seo_title_en ?? ""} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
              <label className="block text-sm font-semibold">
                Dari SEO title
                <input name="seo_title_fa" defaultValue={selected?.seo_title_fa ?? ""} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
              <label className="block text-sm font-semibold">
                Pashto SEO title
                <input name="seo_title_ps" defaultValue={selected?.seo_title_ps ?? ""} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <label className="block text-sm font-semibold">
                English SEO description
                <textarea name="seo_description_en" defaultValue={selected?.seo_description_en ?? ""} className="mt-1 min-h-24 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
              <label className="block text-sm font-semibold">
                Dari SEO description
                <textarea name="seo_description_fa" defaultValue={selected?.seo_description_fa ?? ""} className="mt-1 min-h-24 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
              <label className="block text-sm font-semibold">
                Pashto SEO description
                <textarea name="seo_description_ps" defaultValue={selected?.seo_description_ps ?? ""} className="mt-1 min-h-24 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button type="submit" className="rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">
                Save draft
              </button>
            </div>
          </form>

          {selected ? (
            <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-semibold">{selected.page_key}</h2>
                  <p className="text-sm text-[var(--ink-2)]">Published: {selected.is_published ? "Yes" : "No"}</p>
                </div>
                <form action={publishStaticPageAction} className="flex items-center gap-3">
                  <input type="hidden" name="page_id" value={String(selected.id)} />
                  <input name="change_summary" placeholder="Publish summary" className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm" />
                  <button type="submit" className="rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold">Publish</button>
                </form>
              </div>

              <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                <h3 className="text-sm font-semibold text-[var(--ink-2)]">Preview</h3>
                <p className="mt-2 text-xl font-semibold">{selectedView?.title ?? selected.title_en}</p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--ink-2)]">{selectedView?.body ?? selected.body_en}</p>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-[var(--line)] text-[var(--ink-2)]">
                    <tr>
                      <th className="py-2 pr-4">Version</th>
                      <th className="py-2 pr-4">Summary</th>
                      <th className="py-2 pr-4">Created</th>
                      <th className="py-2 pr-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.versions.length === 0 ? (
                      <tr>
                        <td className="py-4 text-[var(--ink-2)]" colSpan={4}>No versions have been published yet.</td>
                      </tr>
                    ) : snapshot.versions.map((version) => (
                      <tr key={version.id} className="border-b border-[var(--line)] last:border-0">
                        <td className="py-3 pr-4 font-semibold">#{version.version_number}</td>
                        <td className="py-3 pr-4">{version.change_summary || "Published page"}</td>
                        <td className="py-3 pr-4">{new Date(version.created_at).toLocaleString()}</td>
                        <td className="py-3 pr-4 text-right">
                          <form action={restoreStaticPageVersionAction}>
                            <input type="hidden" name="version_id" value={String(version.id)} />
                            <input type="hidden" name="change_summary" value={`Restored ${selected.page_key} version ${version.version_number}`} />
                            <button type="submit" className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold">
                              Restore
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}