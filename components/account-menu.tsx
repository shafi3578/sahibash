import Link from "next/link";
import { signOutAction } from "@/lib/actions/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const accountLinks = [
  { href: "/dashboard/my-ads", label: "My Listings" },
  { href: "/dashboard/favorites", label: "Favorite Listings" },
  { href: "/dashboard/favorite-searches", label: "Favorite Searches" },
  { href: "/dashboard/messages", label: "Messages" },
  { href: "/dashboard/questions", label: "Questions & Answers" },
  { href: "/dashboard/offers", label: "Offers" },
  { href: "/dashboard/account-information", label: "Account Information" },
  { href: "/dashboard/account-security", label: "Account Security" },
  { href: "/dashboard/settings", label: "Settings" },
  { href: "/dashboard/help", label: "Help Center" },
  { href: "/dashboard/privacy", label: "Privacy & Terms" },
] as const;

export async function AccountMenu({ currentPath }: { currentPath: string }) {
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
      <p className="px-3 pb-2 pt-1 text-sm font-semibold uppercase tracking-wide text-[var(--ink-2)]">
        My Account
      </p>
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
      <form action={signOutAction} className="mt-3 border-t border-[var(--line)] pt-3">
        <button
          type="submit"
          className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold text-[var(--ink-1)]"
        >
          Logout
        </button>
      </form>
    </aside>
  );
}
