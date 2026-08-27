import Link from "next/link";
import { DashboardSection } from "@/components/dashboard-section";
import { requireUser } from "@/lib/auth";
import { getCurrentLocale } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { unblockUserFormAction } from "@/lib/actions/social";

export default async function BlockedUsersPage() {
  const user = await requireUser();
  const locale = await getCurrentLocale();
  const supabase = await createSupabaseServerClient();
  const { data: blocks } = await supabase
    .from("user_blocks")
    .select("blocked_user_id,created_at")
    .eq("blocker_user_id", user.id)
    .order("created_at", { ascending: false });
  const ids = (blocks ?? []).map((row) => row.blocked_user_id);
  const { data: profiles } = ids.length
    ? await supabase.from("profiles").select("id,full_name").in("id", ids)
    : { data: [] };
  const names = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));
  const copy = locale === "fa"
    ? { title: "کاربران مسدودشده", description: "کاربران مسدودشده نمی‌توانند برای شما پیام بفرستند.", empty: "کاربر مسدودشده‌ای ندارید.", seller: "فروشنده", unblock: "رفع مسدودی", view: "دیدن صفحه" }
    : locale === "ps"
      ? { title: "بند شوي کاروونکي", description: "بند شوي کاروونکي تاسو ته پیغام نشي لېږلی.", empty: "هیڅ بند شوی کاروونکی نشته.", seller: "پلورونکی", unblock: "بندیز لرې کړئ", view: "پاڼه وګورئ" }
      : { title: "Blocked users", description: "Blocked users cannot message you.", empty: "You have no blocked users.", seller: "Seller", unblock: "Unblock", view: "View profile" };

  return (
    <DashboardSection currentPath="/dashboard/settings" title={copy.title} description={copy.description}>
      {(blocks ?? []).length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--line)] p-5 text-[var(--ink-2)]">{copy.empty}</p>
      ) : (
        <div className="space-y-2">
          {(blocks ?? []).map((block) => (
            <article key={block.blocked_user_id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-white p-4">
              <div><p className="font-bold">{names.get(block.blocked_user_id) || copy.seller}</p><Link className="text-sm font-semibold text-[var(--accent)] hover:underline" href={localizePath(`/sellers/${block.blocked_user_id}`, locale)}>{copy.view}</Link></div>
              <form action={unblockUserFormAction}><input type="hidden" name="userId" value={block.blocked_user_id} /><button className="rounded-xl border border-[var(--line)] px-4 py-2 text-sm font-bold">{copy.unblock}</button></form>
            </article>
          ))}
        </div>
      )}
    </DashboardSection>
  );
}
