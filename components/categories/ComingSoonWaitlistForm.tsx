"use client";

import { useState, useTransition } from "react";
import { joinCategoryWaitlistAction } from "@/lib/actions/categories";

type Props = {
  categorySlug: string;
  defaultEmail?: string;
};

export function ComingSoonWaitlistForm({ categorySlug, defaultEmail = "" }: Props) {
  const [email, setEmail] = useState(defaultEmail);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(null);
        setError(null);

        startTransition(async () => {
          const result = await joinCategoryWaitlistAction({
            categorySlug,
            email,
          });

          if (!result.ok) {
            setError(result.message);
            return;
          }

          setMessage(result.message);
        });
      }}
      className="space-y-3"
    >
      <label className="block text-sm font-semibold text-[var(--ink-1)]">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2"
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? "Joining..." : "Notify Me When Available"}
      </button>

      {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
    </form>
  );
}
