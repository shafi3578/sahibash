"use client";

import { useState, useTransition } from "react";
import { toggleFavoriteAction } from "@/lib/actions/favorites";

type FavoriteToggleButtonProps = {
  listingId: string;
  initialFavorited: boolean;
  addLabel: string;
  removeLabel: string;
};

export function FavoriteToggleButton({
  listingId,
  initialFavorited,
  addLabel,
  removeLabel,
}: FavoriteToggleButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-pressed={favorited}
      aria-busy={isPending}
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await toggleFavoriteAction(listingId);
          if (result.ok) setFavorited(result.favorited);
        });
      }}
      aria-label={favorited ? removeLabel : addLabel}
      title={favorited ? removeLabel : addLabel}
      className={`grid h-11 w-11 place-items-center rounded-full border text-xl font-semibold transition disabled:cursor-wait disabled:opacity-60 ${
        favorited
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-[var(--line)] bg-white text-[var(--ink-1)] hover:bg-[var(--surface-2)]"
      }`}
    >
      <span aria-hidden="true">{favorited ? "♥" : "♡"}</span>
      <span className="sr-only">{favorited ? removeLabel : addLabel}</span>
    </button>
  );
}
