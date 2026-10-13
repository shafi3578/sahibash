import { requirePermission } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateSupportRequestStatusAction } from "@/lib/actions/support-admin";

type SupportRequest = {
  id: string;
  requester_name: string;
  requester_email: string;
  subject: string;
  message: string;
  locale: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  created_at: string;
};

const STATUS_LABELS: Record<SupportRequest["status"], string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

export default async function AdminSupportPage() {
  await requirePermission("audit_logs.view");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("support_requests")
    .select("id,requester_name,requester_email,subject,message,locale,status,created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  const requests = (data ?? []) as SupportRequest[];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Support requests</h1>
          <p className="mt-1 text-[var(--ink-2)]">Review, respond to, and triage contact requests from Sahibash users.</p>
        </div>
        <span className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-sm font-bold">{requests.length} recent</span>
      </div>

      {error ? (
        <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
          Support requests could not be loaded. Verify the support_requests migration is applied.
        </p>
      ) : requests.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-[var(--line)] p-6 text-sm text-[var(--ink-2)]">No support requests yet.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {requests.map((request) => (
            <article key={request.id} className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-bold">{request.subject}</h2>
                  <p className="text-sm font-semibold">{request.requester_name} · <a className="text-[var(--accent)] underline" href={`mailto:${request.requester_email}`}>{request.requester_email}</a></p>
                  <p className="mt-1 text-xs text-[var(--ink-2)]">{new Date(request.created_at).toLocaleString()} · {request.locale}</p>
                </div>
                <form action={updateSupportRequestStatusAction} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={request.id} />
                  <label className="sr-only" htmlFor={`status-${request.id}`}>Status</label>
                  <select id={`status-${request.id}`} name="status" defaultValue={request.status} className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm">
                    {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  <button className="rounded-xl bg-[var(--ink-1)] px-3 py-2 text-sm font-semibold text-white">Save</button>
                </form>
              </div>
              <p className="mt-4 whitespace-pre-wrap rounded-xl bg-[var(--surface-2)] p-3 text-sm leading-6">{request.message}</p>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
