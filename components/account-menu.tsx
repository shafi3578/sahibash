import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getUiTranslations } from "@/lib/i18n/ui";
import {
  ACCOUNT_NAV_ITEMS,
  isActiveAccountPath,
  localizeAccountPath,
  type AccountNavKey,
} from "@/lib/account/navigation";

export async function AccountMenu({ currentPath }: { currentPath: string }) {
  const locale = await getCurrentLocale();
  const ui = getUiTranslations(locale);
  const accountLabels: Record<AccountNavKey, string> = {
    myListings: ui.dashboard.myListings,
    favoriteListings: ui.dashboard.favoriteListings,
    favoriteSearches: ui.dashboard.favoriteSearches,
    messages: ui.dashboard.messages,
    questionsAnswers: ui.dashboard.questionsAnswers,
    offers: ui.dashboard.offers,
    accountInformation: ui.dashboard.accountInformation,
    accountSecurity: ui.dashboard.accountSecurity,
    settings: ui.dashboard.settings,
    helpCenter: ui.dashboard.helpCenter,
    privacyTerms: ui.dashboard.privacyTerms,
  };

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
        {ACCOUNT_NAV_ITEMS.map((item) => {
          const active = isActiveAccountPath(currentPath, item.href);
          const badge = "badge" in item ? item.badge : undefined;
          return (
            <Link
              key={item.href}
              href={localizeAccountPath(item.href, locale)}
              className={
                active
                  ? "flex items-center justify-between rounded-lg bg-[var(--ink-1)] px-3 py-2 text-sm font-semibold text-white"
                  : "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-[var(--ink-1)] hover:bg-[var(--surface-2)]"
              }
            >
              <span>{accountLabels[item.key]}</span>
              {badge === "messages" && !active && newMessages > 0 ? (
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" aria-label={ui.dashboard.newMessagesBadge} />
              ) : null}
              {badge === "offers" && !active && newOffers > 0 ? (
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" aria-label={ui.dashboard.newOffersBadge} />
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
