import { requireUser } from "@/lib/auth";
import { DashboardSection } from "@/components/dashboard-section";

export default async function HelpCenterPage() {
  await requireUser();

  return (
    <DashboardSection
      currentPath="/dashboard/help"
      title="Help Center"
      description="Get support for listings, payments, and account issues."
    >
      <ul className="space-y-2 text-sm text-[var(--ink-2)]">
        <li>How to post a listing</li>
        <li>How listing moderation works</li>
        <li>How to report suspicious activity</li>
        <li>How to contact support</li>
      </ul>
    </DashboardSection>
  );
}
