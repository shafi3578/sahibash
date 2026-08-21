import Link from "next/link";
import type { AppLocale } from "@/lib/i18n/translations";
import { localizePath } from "@/lib/i18n/routing";

const LABELS = {
  en: { nav: "Mobile navigation", home: "Home", search: "Search", sell: "Sell", messages: "Messages", account: "Account" },
  fa: { nav: "راهنمای موبایل", home: "خانه", search: "جستجو", sell: "فروش", messages: "پیام‌ها", account: "حساب" },
  ps: { nav: "د موبایل لاره", home: "کور", search: "لټون", sell: "پلور", messages: "پیغامونه", account: "حساب" },
} as const;

function NavIcon({ name, primary = false }: { name: string; primary?: boolean }) {
  const cls = primary ? "h-7 w-7" : "h-5 w-5";
  const stroke = "currentColor";
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cls} fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      {name === "home" ? <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.5Z" /> : null}
      {name === "search" ? <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></> : null}
      {name === "sell" ? <><path d="M12 5v14" /><path d="M5 12h14" /></> : null}
      {name === "messages" ? <><path d="M4 6h16v10H8l-4 4V6Z" /><path d="M8 10h8" /></> : null}
      {name === "account" ? <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.8-4 5-6 8-6s6.2 2 8 6" /></> : null}
    </svg>
  );
}

export function MobileBottomNav({ locale, authenticated }: { locale: AppLocale; authenticated: boolean }) {
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
  return <nav aria-label={text.nav} className="fixed inset-x-0 bottom-0 z-50 border-t border-black/10 bg-white/95 px-2 pb-[max(.45rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-10px_32px_rgba(15,23,42,.14)] backdrop-blur-xl lg:hidden">
    <div className="mx-auto grid max-w-lg grid-cols-5">
      {items.map((item) => <Link key={item.label} href={item.href} className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-2xl text-[10px] font-semibold transition active:scale-95 ${item.primary ? "-mt-6 text-[var(--accent)]" : "text-slate-600"}`}>
        <span className={item.primary ? "flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-xl ring-4 ring-white" : "flex h-7 items-center justify-center"}><NavIcon name={item.icon} primary={item.primary} /></span>
        <span>{item.label}</span>
      </Link>)}
    </div>
  </nav>;
}
