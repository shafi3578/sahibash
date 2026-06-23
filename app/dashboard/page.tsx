import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { DashboardSection } from "@/components/dashboard-section";

const quickCards = [
  {
    title: "My Listings",
    href: "/dashboard/my-ads",
    desc: "Manage active and inactive listings, status, and photos.",
  },
  {
    title: "Favorite Listings",
    href: "/dashboard/favorites",
    desc: "See items you saved and quickly re-open them.",
  },
  {
    title: "Favorite Searches",
    href: "/dashboard/favorite-searches",
    desc: "Track saved search filters and alerts.",
  },
  {
    title: "Messages",
    href: "/dashboard/messages",
    desc: "View conversations with buyers and sellers.",
  },
  {
    title: "Questions & Answers",
    href: "/dashboard/questions",
    desc: "Review questions on your listings.",
  },
  {
    title: "Offers",
    href: "/dashboard/offers",
    desc: "Manage incoming and outgoing offers.",
  },
  {
    title: "Account Information",
    href: "/dashboard/account-information",
    desc: "Update profile details and contact info.",
  },
  {
    title: "Account Security",
    href: "/dashboard/account-security",
    desc: "Password, sessions, and security settings.",
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    desc: "Language, notifications, and preferences.",
  },
  {
    title: "Help Center",
    href: "/dashboard/help",
    desc: "Support articles and account help.",
  },
  {
    title: "Privacy & Terms",
    href: "/dashboard/privacy",
    desc: "Read marketplace rules and legal pages.",
  },
];

export default async function DashboardPage() {
  await requireUser();

  return (
    <DashboardSection
      currentPath="/dashboard"
      title="My Account"
      description="Manage your listings, favorites, messages, offers, and account settings."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {quickCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4 transition hover:-translate-y-0.5 hover:bg-white"
          >
            <p className="font-semibold text-[var(--ink-1)]">{card.title}</p>
            <p className="mt-1 text-sm text-[var(--ink-2)]">{card.desc}</p>
          </Link>
        ))}
      </div>
    </DashboardSection>
  );
}
