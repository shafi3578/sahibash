"use client";

import Link from "next/link";
import { useState } from "react";
import type { AppLocale } from "@/lib/i18n/translations";
import { localizePath } from "@/lib/i18n/routing";

const COPY = {
  en: { open: "Menu and filters", title: "Explore", filters: "Search filters", categories: "All categories", listings: "All listings", faq: "FAQ", contact: "Contact us", settings: "Language and settings", close: "Close" },
  fa: { open: "منو و فیلترها", title: "دسترسی سریع", filters: "فیلترهای جستجو", categories: "همه دسته‌بندی‌ها", listings: "همه اعلان‌ها", faq: "پرسش‌های متداول", contact: "تماس با ما", settings: "زبان و تنظیمات", close: "بستن" },
  ps: { open: "مینو او فلټرونه", title: "چټک لاسرسی", filters: "د لټون فلټرونه", categories: "ټولې کټګورۍ", listings: "ټول اعلانونه", faq: "ډېرې پوښتل شوې پوښتنې", contact: "اړیکه", settings: "ژبه او امستنې", close: "بندول" },
} as const;

function MenuIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
}

export function MobileMenuSheet({ locale }: { locale: AppLocale }) {
  const [open, setOpen] = useState(false);
  const copy = COPY[locale];
  const items = [
    [copy.filters, "/search?filters=open", "⌕"],
    [copy.categories, "/categories", "▦"],
    [copy.listings, "/listings", "≡"],
    [copy.faq, "/faq", "?"],
    [copy.contact, "/contact", "✉"],
    [copy.settings, "/dashboard/settings", "⚙"],
  ] as const;

  return <>
    <button type="button" onClick={() => setOpen(true)} aria-label={copy.open} className="grid h-10 w-10 place-items-center rounded-full bg-white/85 text-[var(--ink-1)] lg:hidden"><MenuIcon /></button>
    {open ? <div className="fixed inset-0 z-50 bg-black/40 p-3 backdrop-blur-sm lg:hidden" role="dialog" aria-modal="true" aria-label={copy.title} onClick={() => setOpen(false)}>
      <div className="ms-auto mt-2 w-full max-w-sm rounded-3xl bg-white p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between"><h2 className="text-lg font-black">{copy.title}</h2><button type="button" onClick={() => setOpen(false)} className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold">{copy.close}</button></div>
        <nav className="mt-4 grid grid-cols-2 gap-2">
          {items.map(([label, path, icon]) => <Link key={path} href={localizePath(path, locale)} onClick={() => setOpen(false)} className="flex min-h-20 flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold transition active:bg-slate-100"><span className="text-xl text-[var(--accent)]">{icon}</span><span>{label}</span></Link>)}
        </nav>
      </div>
    </div> : null}
  </>;
}
