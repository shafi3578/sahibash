import type { AppLocale } from "@/lib/i18n/translations";
import { signOutAction } from "@/lib/actions/auth";

export function LogoutForm({
  locale,
  label,
  className = "inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--line)] bg-white px-4 text-sm font-bold text-[var(--ink-1)] transition hover:border-[var(--ink-1)]",
}: {
  locale: AppLocale;
  label: string;
  className?: string;
}) {
  return (
    <form action={signOutAction}>
      <input type="hidden" name="locale" value={locale} />
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}
