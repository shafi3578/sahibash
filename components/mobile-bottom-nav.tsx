"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AppLocale } from "@/lib/i18n/translations";
import { localizePath } from "@/lib/i18n/routing";

const LABELS = {
  en: { nav: "Mobile navigation", home: "Home", search: "Search", sell: "Sell", messages: "Messages", account: "Account" },
  fa: { nav: "راهنمای موبایل", home: "خانه", search: "جستجو", sell: "فروش", messages: "پیام‌ها", account: "حساب" },
  ps: { nav: "د موبایل لاره", home: "کور", search: "لټون", sell: "پلور", messages: "پیغامونه", account: "حساب" },
} as const;

function NavIcon({ name, active = false }: { name: string; active?: boolean }) {
  const cls = "h-[23px] w-[23px]";
  const stroke = "currentColor";
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cls} fill={active && name === "home" ? "currentColor" : "none"} stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {name === "home" ? <path d="M3.5 10.8 12 4l8.5 6.8V21h-5.4v-6.2H8.9V21H3.5V10.8Z" /> : null}
      {name === "search" ? <><circle cx="10.8" cy="10.8" r="6.4" /><path d="m16.2 16.2 4.1 4.1" /></> : null}
      {name === "sell" ? <><circle cx="12" cy="12" r="8.4" /><path d="M12 8.2v7.6" /><path d="M8.2 12h7.6" /></> : null}
      {name === "messages" ? <><path d="M4.5 6.5h15v10h-9.2L6.2 20v-3.5H4.5v-10Z" /><path d="M8 10h8" /><path d="M8 13h5" /></> : null}
      {name === "account" ? <><circle cx="12" cy="8.4" r="3.6" /><path d="M4.8 20.5c1.5-4 4.1-6 7.2-6s5.7 2 7.2 6" /></> : null}
    </svg>
  );
}

export function MobileBottomNav({ locale, authenticated }: { locale: AppLocale; authenticated: boolean }) {
  const pathname = usePathname();
  const text = LABELS[locale];
  const path = (value: string) => localizePath(value, locale);
  const sellPath = path("/post-ad/create?posting=sell");
  const loginFor = (target: string) => `${path("/login")}?redirect=${encodeURIComponent(target)}&reason=post`;
  const items = [
    { label: text.home, href: path("/"), icon: "home" },
    { label: text.search, href: path("/search"), icon: "search" },
    { label: text.sell, href: authenticated ? sellPath : loginFor("/post-ad/create?posting=sell"), icon: "sell", primary: true },
    { label: text.messages, href: authenticated ? path("/dashboard/messages") : loginFor("/dashboard/messages"), icon: "messages" },
    { label: text.account, href: authenticated ? path("/dashboard") : path("/login"), icon: "account" },
  ];
  return <nav aria-label={text.nav} className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
    <div className="mx-auto grid h-16 max-w-xl grid-cols-5 px-1">
      {items.map((item) => {
        const hrefWithoutQuery = item.href.split("?")[0];
        const active = pathname === hrefWithoutQuery || (!item.primary && hrefWithoutQuery !== path("/") && pathname.startsWith(hrefWithoutQuery));
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`group flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-none px-1 text-[10px] leading-none transition active:bg-slate-100 ${active ? "font-bold text-slate-950" : "font-medium text-slate-700"}`}
          >
            <span className={item.primary ? "mb-0.5 grid h-9 w-9 place-items-center rounded-full border-2 border-slate-950 bg-white text-slate-950 transition group-active:scale-95" : "grid h-7 place-items-center"}>
              <NavIcon name={item.icon} active={active} />
            </span>
            <span className="max-w-full truncate">{item.label}</span>
          </Link>
        );
      })}
    </div>
  </nav>;
}
