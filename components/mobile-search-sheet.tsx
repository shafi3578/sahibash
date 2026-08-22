"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { AppLocale } from "@/lib/i18n/translations";
import { localizePath } from "@/lib/i18n/routing";

const COPY = {
  en: { open: "Search", title: "Search Sahibash", placeholder: "Search cars, homes, phones…", cancel: "Cancel" },
  fa: { open: "جستجو", title: "جستجو در صاحبش", placeholder: "موتر، خانه، موبایل…", cancel: "لغو" },
  ps: { open: "لټون", title: "په صاحبش کې لټون", placeholder: "موټر، کور، موبایل…", cancel: "بندول" },
} as const;

type SearchSuggestion = {
  type: "alias" | "category" | "location" | "listing" | "intent";
  label: string;
  subtitle?: string;
  href: string;
  value: string;
};

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10.8" cy="10.8" r="6.4" />
      <path d="m16.2 16.2 4.1 4.1" />
    </svg>
  );
}

export function MobileSearchSheet({ locale }: { locale: AppLocale }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const copy = COPY[locale];

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    const handle = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search/autocomplete?locale=${encodeURIComponent(locale)}&q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const payload = await response.json() as { suggestions?: SearchSuggestion[] };
        setSuggestions(Array.isArray(payload.suggestions) ? payload.suggestions : []);
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, query.trim().length >= 3 ? 260 : 120);

    return () => {
      controller.abort();
      window.clearTimeout(handle);
    };
  }, [locale, open, query]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setOpen(false);
    router.push(`${localizePath("/search", locale)}?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={copy.open} className="grid h-10 w-10 place-items-center rounded-full bg-white/80 text-[var(--ink-1)] lg:hidden">
        <SearchIcon />
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 bg-black/35 p-3 backdrop-blur-sm lg:hidden" role="dialog" aria-modal="true">
          <div className="mx-auto mt-3 max-w-xl rounded-3xl bg-white p-3 shadow-2xl">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-full px-3 py-2 text-sm font-semibold text-slate-600">
                {copy.cancel}
              </button>
              <form onSubmit={submit} className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
                <SearchIcon />
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={copy.placeholder}
                  className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
                />
              </form>
            </div>
            <div className="px-1 pb-2 pt-3">
              <p className="px-3 text-xs font-semibold text-slate-500">{loading ? "…" : copy.title}</p>
              <div className="mt-2 max-h-[60vh] overflow-y-auto">
                {suggestions.map((suggestion) => (
                  <button
                    key={`${suggestion.type}-${suggestion.href}-${suggestion.label}`}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      router.push(suggestion.href);
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-start transition active:bg-slate-100"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-black uppercase text-slate-600">
                      {suggestion.type.slice(0, 1)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-slate-950">{suggestion.label}</span>
                      {suggestion.subtitle ? <span className="block truncate text-xs text-slate-500">{suggestion.subtitle}</span> : null}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
