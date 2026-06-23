import { requireUser } from "@/lib/auth";
import { DashboardSection } from "@/components/dashboard-section";

export default async function QuestionsPage() {
  await requireUser();

  return (
    <DashboardSection
      currentPath="/dashboard/questions"
      title="Questions & Answers"
      description="Track buyer questions and your answers across all listings."
    >
      <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-2)] p-5">
        <p className="font-semibold text-[var(--ink-1)]">No Q&A activity yet</p>
        <p className="mt-1 text-sm text-[var(--ink-2)]">
          Listing questions and responses will show up here.
        </p>
      </div>
    </DashboardSection>
  );
}
