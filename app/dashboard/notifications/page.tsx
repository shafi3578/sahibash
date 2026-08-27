import { requireUser } from "@/lib/auth";
import { DashboardSection } from "@/components/dashboard-section";
import { getCurrentLocale } from "@/lib/i18n/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { markAllNotificationsReadAction, markNotificationReadAction, openNotificationAction } from "@/lib/actions/notifications";

const TYPE_ICON: Record<string, string> = {
  listing_message: "💬",
  listing_offer: "🤝",
  system: "🔔",
};

export default async function NotificationsPage() {
  const user = await requireUser();
  const locale = await getCurrentLocale();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("notifications").select("id,type,title,body,payload,is_read,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
  const copy = locale === "fa"
    ? { title: "مرکز اعلان‌ها", description: "پیام‌ها و به‌روزرسانی‌های مهم حساب شما", allRead: "همه را خوانده علامت بزن", empty: "اعلان تازه‌ای ندارید", open: "باز کردن", unread: "خوانده‌نشده" }
    : locale === "ps"
      ? { title: "د خبرتیاوو مرکز", description: "ستاسو د حساب مهم پیغامونه او تازه معلومات", allRead: "ټول لوستل شوي وټاکئ", empty: "نوې خبرتیا نشته", open: "پرانیزئ", unread: "نه لوستل شوې" }
      : { title: "Notification Center", description: "Important messages and updates for your account", allRead: "Mark all as read", empty: "You have no notifications", open: "Open", unread: "Unread" };
  return <DashboardSection currentPath="/dashboard/notifications" title={copy.title} description={copy.description}>
    <div className="mb-4 flex justify-end"><form action={markAllNotificationsReadAction}><button className="rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-bold">{copy.allRead}</button></form></div>
    {(data ?? []).length === 0 ? <p className="rounded-2xl border border-dashed border-[var(--line)] p-5 text-[var(--ink-2)]">{copy.empty}</p> : <div className="space-y-2">{(data ?? []).map((item) => <article key={item.id} className={`rounded-2xl border p-4 ${item.is_read ? "border-[var(--line)] bg-white" : "border-red-200 bg-red-50"}`}><div className="flex items-start justify-between gap-3"><div className="flex gap-3"><span className="text-xl" aria-hidden="true">{TYPE_ICON[item.type] ?? "🔔"}</span><div><p className="font-bold text-[var(--ink-1)]">{item.title}</p><p className="mt-1 text-sm text-[var(--ink-2)]">{item.body}</p><p className="mt-2 text-xs text-[var(--ink-2)]">{new Date(item.created_at).toLocaleString(locale === "en" ? "en-US" : `${locale}-AF`)}</p></div></div>{!item.is_read ? <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-red-600" aria-label={copy.unread} /> : null}</div><div className="mt-3 flex gap-2"><form action={openNotificationAction}><input type="hidden" name="id" value={item.id}/><button className="rounded-lg bg-[var(--ink-1)] px-3 py-2 text-xs font-bold text-white">{copy.open}</button></form>{!item.is_read ? <form action={markNotificationReadAction}><input type="hidden" name="id" value={item.id}/><button aria-label={copy.allRead} className="rounded-lg border border-[var(--line)] px-3 py-2 text-xs font-bold">✓</button></form> : null}</div></article>)}</div>}
  </DashboardSection>;
}
