import Link from "next/link";
import type { AppLocale } from "@/lib/i18n/translations";
import { localizePath } from "@/lib/i18n/routing";

const LABELS = {
  en: { home: "Home", search: "Search", sell: "Sell", messages: "Messages", account: "Account" },
  fa: { home: "خانه", search: "جستجو", sell: "فروش", messages: "پیام‌ها", account: "حساب" },
  ps: { home: "کور", search: "لټون", sell: "پلور", messages: "پیغامونه", account: "حساب" },
} as const;

const Icon = ({ children }: { children: React.ReactNode }) => <span aria-hidden="true" className="text-lg leading-none">{children}</span>;

export function MobileBottomNav({ locale, authenticated }: { locale: AppLocale; authenticated: boolean }) {
  const text = LABELS[locale];
  const path = (value: string) => localizePath(value, locale);
  const sellPath = path("/post-ad/create?posting=sell");
  const loginFor = (target: string) => `${path("/login")}?redirect=${encodeURIComponent(target)}&reason=post`;
  const items = [
    { label: text.home, href: path("/"), icon: "⌂" },
    { label: text.search, href: path("/search"), icon: "⌕" },
    { label: text.sell, href: authenticated ? sellPath : loginFor("/post-ad/create?posting=sell"), icon: "+", primary: true },
    { label: text.messages, href: authenticated ? path("/dashboard/messages") : loginFor("/dashboard/messages"), icon: "✉" },
    { label: text.account, href: authenticated ? path("/dashboard") : path("/login"), icon: "◯" },
  ];
  return <nav aria-label="Mobile" className="fixed inset-x-0 bottom-0 z-50 border-t border-black/10 bg-white/95 px-2 pb-[max(.4rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-8px_30px_rgba(0,0,0,.08)] backdrop-blur lg:hidden">
    <div className="mx-auto grid max-w-lg grid-cols-5">
      {items.map((item) => <Link key={item.label} href={item.href} className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-semibold ${item.primary ? "-mt-5 text-[var(--accent)]" : "text-slate-600"}`}>
        <span className={item.primary ? "flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)] text-2xl text-white shadow-lg ring-4 ring-white" : "flex h-7 items-center justify-center"}><Icon>{item.icon}</Icon></span>
        <span>{item.label}</span>
      </Link>)}
    </div>
  </nav>;
}
