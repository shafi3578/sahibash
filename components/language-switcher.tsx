"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { setLocaleAction } from "@/lib/actions/i18n";
import type { AppLocale } from "@/lib/i18n/translations";
import { localizePath } from "@/lib/i18n/routing";

type Props = {
  locale: AppLocale;
  label: string;
};

function localeLabel(code: AppLocale) {
  if (code === "fa") return "دری";
  if (code === "ps") return "پښتو";
  return "EN";
}

export function LanguageSwitcher({ locale, label }: Props) {
  const pathname = usePathname();
  const search = useSearchParams();

  const currentPath = useMemo(() => {
    const query = search.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, search]);

  return (
    <div className="flex items-center gap-1 rounded-full border border-black/20 bg-white px-2 py-1 text-xs font-semibold">
      <span className="px-1 text-[var(--ink-2)]">{label}:</span>
      {(["en", "fa", "ps"] as AppLocale[]).map((nextLocale) => (
        <form key={nextLocale} action={setLocaleAction}>
          <input type="hidden" name="locale" value={nextLocale} />
          <input type="hidden" name="returnTo" value={localizePath(currentPath, nextLocale)} />
          <button
            type="submit"
            className={`rounded-full px-2 py-1 ${locale === nextLocale ? "bg-[var(--ink-1)] text-white" : ""}`}
          >
            {localeLabel(nextLocale)}
          </button>
        </form>
      ))}
    </div>
  );
}
