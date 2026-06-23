import { requireUser } from "@/lib/auth";
import { DashboardSection } from "@/components/dashboard-section";

export default async function PrivacyTermsPage() {
  await requireUser();

  return (
    <DashboardSection
      currentPath="/dashboard/privacy"
      title="Privacy & Terms"
      description="Review platform policies, privacy terms, and user responsibilities."
    >
      <div className="space-y-3 text-sm text-[var(--ink-2)]">
        <p>Privacy policy and marketplace terms will be managed from this section.</p>
        <p>
          For launch, this page is prepared as the legal placeholder for your final
          policies.
        </p>
      </div>
    </DashboardSection>
  );
}
