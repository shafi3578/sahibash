"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { AppLocale } from "@/lib/i18n/translations";
import { localizePath } from "@/lib/i18n/routing";

const COPY = {
  en: { open: "Search", title: "Search Sahibash", placeholder: "Search cars, homes, phones…", cancel: "Cancel" },
  fa: { open: "جستجو", title: "جستجو در صاحبش", placeholder: "موتر، خانه، موبایل…", cancel: "لغو" },
  ps: { open: "لټون", title: "په صاحبش کې لټون", placeholder: "موټر، کور، موبایل…", cancel: "بندول" },
} as const;

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
  const router = useRouter();
  const copy = COPY[locale];

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
            <p className="px-4 pb-2 pt-3 text-xs text-slate-500">{copy.title}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
