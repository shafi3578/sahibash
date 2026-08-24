import { requireUser } from "@/lib/auth";
import { DashboardSection } from "@/components/dashboard-section";
import { getCurrentLocale } from "@/lib/i18n/server";
import { ACCOUNT_EXPERIENCE_COPY } from "@/lib/account/copy";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateAccountProfileAction } from "@/lib/actions/profile";

async function handleUpdateAccountProfile(formData: FormData) {
  "use server";
  await updateAccountProfileAction(formData);
}

export default async function AccountManagementSettingsPage() {
  const user = await requireUser();
  const locale = await getCurrentLocale();
  const copy = ACCOUNT_EXPERIENCE_COPY[locale];
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, preferred_language, phone_verification_status")
    .eq("id", user.id)
    .maybeSingle();
  const profileCopy = locale === "fa"
    ? {
        title: "پروفایل فروشنده",
        description: "نام و شماره موبایل شما از اینجا برای تمام اعلان‌های صاحبش استفاده می‌شود.",
        fullName: "نام کامل",
        phone: "شماره موبایل",
        language: "زبان ترجیحی",
        verification: "وضعیت تایید شماره",
        unverified: "آماده برای تایید آینده",
        save: "ذخیره پروفایل",
        phoneHint: "فرمت پیشنهادی: +93 7xx xxx xxx",
      }
    : locale === "ps"
      ? {
          title: "د پلورونکي پروفایل",
          description: "ستاسو نوم او موبایل شمېره له همدې ځایه د صاحبش ټولو اعلانونو لپاره کارېږي.",
          fullName: "بشپړ نوم",
          phone: "د موبایل شمېره",
          language: "غوره ژبه",
          verification: "د شمېرې تایید حالت",
          unverified: "د راتلونکي تایید لپاره چمتو",
          save: "پروفایل خوندي کړئ",
          phoneHint: "سپارښتل شوې بڼه: +93 7xx xxx xxx",
        }
      : {
          title: "Seller profile",
          description: "Your name and mobile phone here are used as the contact source for every Sahibash ad.",
          fullName: "Full name",
          phone: "Mobile phone",
          language: "Preferred language",
          verification: "Phone verification status",
          unverified: "Ready for future verification",
          save: "Save profile",
          phoneHint: "Recommended format: +93 7xx xxx xxx",
        };

  return (
    <DashboardSection
      currentPath="/dashboard/settings"
      title={copy.accountManagement}
      description={copy.accountManagementDescription}
    >
      <div className="space-y-4">
        <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
          <h2 className="font-semibold text-[var(--ink-1)]">{profileCopy.title}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-2)]">{profileCopy.description}</p>
          <form action={handleUpdateAccountProfile} className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-[var(--ink-1)]">
              {profileCopy.fullName}
              <input
                name="full_name"
                required
                minLength={2}
                maxLength={80}
                defaultValue={String(profile?.full_name ?? "")}
                className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
              />
            </label>
            <label className="text-sm font-semibold text-[var(--ink-1)]">
              {profileCopy.phone}
              <input
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                minLength={9}
                maxLength={20}
                defaultValue={String(profile?.phone ?? "")}
                placeholder="+93 7xx xxx xxx"
                className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
              />
              <span className="mt-1 block text-xs font-normal text-[var(--ink-2)]">{profileCopy.phoneHint}</span>
            </label>
            <label className="text-sm font-semibold text-[var(--ink-1)]">
              {profileCopy.language}
              <select
                name="preferred_language"
                defaultValue={String(profile?.preferred_language ?? locale)}
                className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
              >
                <option value="fa">دری</option>
                <option value="ps">پښتو</option>
                <option value="en">English</option>
              </select>
            </label>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm">
              <p className="font-semibold text-[var(--ink-1)]">{profileCopy.verification}</p>
              <p className="mt-1 text-[var(--ink-2)]">{String(profile?.phone_verification_status ?? profileCopy.unverified)}</p>
            </div>
            <div className="sm:col-span-2">
              <button className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white">
                {profileCopy.save}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
          <h2 className="font-semibold text-[var(--ink-1)]">{copy.accountManagement}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-2)]">{copy.logoutNotice}</p>
        </section>

        <section className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <h2 className="font-semibold text-red-800">{copy.deletionTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-red-800">{copy.deletionDescription}</p>
          <p className="mt-2 text-sm leading-6 text-red-700">{copy.deletionUnavailable}</p>
        </section>
      </div>
    </DashboardSection>
  );
}
