import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getUiTranslations } from "@/lib/i18n/ui";

export async function AccountMenu({ currentPath }: { currentPath: string }) {
  const locale = await getCurrentLocale();
  const ui = getUiTranslations(locale);
  const accountLinks = [
    { href: "/dashboard/my-ads", label: ui.dashboard.myListings },
    { href: "/dashboard/favorites", label: ui.dashboard.favoriteListings },
    { href: "/dashboard/favorite-searches", label: ui.dashboard.favoriteSearches },
    { href: "/dashboard/messages", label: ui.dashboard.messages },
    { href: "/dashboard/questions", label: ui.dashboard.questionsAnswers },
    { href: "/dashboard/offers", label: ui.dashboard.offers },
    { href: "/dashboard/account-information", label: ui.dashboard.accountInformation },
    { href: "/dashboard/account-security", label: ui.dashboard.accountSecurity },
    { href: "/dashboard/settings", label: ui.dashboard.settings },
    { href: "/dashboard/help", label: ui.dashboard.helpCenter },
    { href: "/dashboard/privacy", label: ui.dashboard.privacyTerms },
  ] as const;

  let newMessages = 0;
  let newOffers = 0;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const [
        { count: msgCount },
        { count: incomingOfferCount },
        { count: buyerDecisionCount },
      ] = await Promise.all([
        supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("recipient_user_id", user.id)
          .eq("status", "sent"),
        supabase
          .from("offers")
          .select("id", { count: "exact", head: true })
          .eq("seller_user_id", user.id)
          .eq("status", "pending")
          .is("seller_seen_at", null),
        supabase
          .from("offers")
          .select("id", { count: "exact", head: true })
          .eq("buyer_user_id", user.id)
          .in("status", ["accepted", "rejected"])
          .is("buyer_seen_at", null),
      ]);

      newMessages = msgCount ?? 0;
      newOffers = (incomingOfferCount ?? 0) + (buyerDecisionCount ?? 0);
    }
  } catch {
    newMessages = 0;
    newOffers = 0;
  }

  return (
    <aside className="rounded-2xl border border-[var(--line)] bg-white p-3">
      <nav className="space-y-1">
        {accountLinks.map((item) => {
          const active = currentPath === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active
                  ? "flex items-center justify-between rounded-lg bg-[var(--ink-1)] px-3 py-2 text-sm font-semibold text-white"
                  : "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-[var(--ink-1)] hover:bg-[var(--surface-2)]"
              }
            >
              <span>{item.label}</span>
              {item.href === "/dashboard/messages" && currentPath !== "/dashboard/messages" && newMessages > 0 ? (
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" aria-label="New messages" />
              ) : null}
              {item.href === "/dashboard/offers" && currentPath !== "/dashboard/offers" && newOffers > 0 ? (
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" aria-label="New offers" />
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
