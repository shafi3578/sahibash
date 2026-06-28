"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AppLocale } from "@/lib/i18n/translations";

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
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const currentPath = useMemo(() => {
    const query = search.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, search]);

  const localeHref = (nextLocale: AppLocale) => `/locale?locale=${nextLocale}&returnTo=${encodeURIComponent(currentPath)}`;

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <div className="hidden items-center gap-1 rounded-full border border-black/20 bg-white px-2 py-1 text-xs font-semibold lg:flex">
        <span className="px-1 text-[var(--ink-2)]">{label}:</span>
        {(["en", "fa", "ps"] as AppLocale[]).map((nextLocale) => (
          <a
            key={nextLocale}
            href={localeHref(nextLocale)}
            aria-current={locale === nextLocale ? "true" : undefined}
            className={`rounded-full px-2 py-1 ${locale === nextLocale ? "bg-[var(--ink-1)] text-white" : ""}`}
          >
            {localeLabel(nextLocale)}
          </a>
        ))}
      </div>

      <button
        type="button"
        className="inline-flex min-h-10 items-center gap-1 rounded-full border border-black/20 bg-white px-3 py-2 text-xs font-semibold lg:hidden"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((prev) => !prev)}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3c3 3.5 3 14.5 0 18" />
          <path d="M12 3c-3 3.5-3 14.5 0 18" />
        </svg>
        <span className="whitespace-nowrap">{localeLabel(locale)}</span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-40 max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border border-black/10 bg-white shadow-lg lg:hidden"
        >
          {(["en", "fa", "ps"] as AppLocale[]).map((nextLocale) => (
            <a
              key={nextLocale}
              href={localeHref(nextLocale)}
              role="menuitemradio"
              aria-checked={locale === nextLocale}
              aria-current={locale === nextLocale ? "true" : undefined}
              className={`block w-full px-3 py-2 text-start text-sm ${locale === nextLocale ? "bg-[var(--surface-2)] font-semibold text-[var(--ink-1)]" : "text-[var(--ink-2)]"}`}
            >
              {localeLabel(nextLocale)}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
