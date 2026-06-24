import { getDictionary } from "@/lib/i18n/server";

export async function SiteFooter() {
  const { t } = await getDictionary();
  return (
    <footer className="mt-auto border-t border-[var(--line)] bg-white/70">
      <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-[var(--ink-2)] sm:px-6 lg:px-8">
        <p className="font-semibold text-[var(--ink-1)]">{t.footer.platform}</p>
        <p className="mt-1">{t.footer.tagline}</p>
      </div>
    </footer>
  );
}
