"use client";

import { useState, useTransition } from "react";
import { blockUserAction } from "@/lib/actions/social";
import type { AppLocale } from "@/lib/i18n/translations";

const COPY = {
  en: { block: "Block", confirm: "Block this seller? They will no longer be able to message you.", done: "Blocked", error: "Could not block this seller." },
  fa: { block: "مسدود کردن", confirm: "این فروشنده مسدود شود؟ دیگر نمی‌تواند برای شما پیام بفرستد.", done: "مسدود شد", error: "مسدود کردن فروشنده ممکن نشد." },
  ps: { block: "بندول", confirm: "دا پلورونکی بند کړئ؟ نور به تاسو ته پیغام نشي لېږلی.", done: "بند شو", error: "پلورونکی بند نه شو." },
} as const;

export function BlockUserButton({ userId, locale, initiallyBlocked = false }: { userId: string; locale: AppLocale; initiallyBlocked?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<"idle" | "done" | "error">(initiallyBlocked ? "done" : "idle");
  const copy = COPY[locale];

  return (
    <button
      type="button"
      disabled={pending || state === "done"}
      onClick={() => {
        if (!window.confirm(copy.confirm)) return;
        startTransition(async () => {
          const result = await blockUserAction(userId);
          setState(result.ok ? "done" : "error");
        });
      }}
      className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {state === "done" ? copy.done : copy.block}
      {state === "error" ? <span className="sr-only"> {copy.error}</span> : null}
    </button>
  );
}
