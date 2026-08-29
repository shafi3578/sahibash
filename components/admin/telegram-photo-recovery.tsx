"use client";

import { useActionState } from "react";
import { recoverTelegramCandidatePhoto } from "@/lib/actions/inventory-media";
import type { TelegramPhotoRecoveryState } from "@/lib/actions/inventory-media";

type RecoveryCopy = {
  button: string;
  pending: string;
  success: string;
  unavailable: string;
  configuration: string;
  storage: string;
  failed: string;
};

const initialState: TelegramPhotoRecoveryState = { status: "idle", code: "idle" };

export function TelegramPhotoRecovery({
  candidateId,
  copy,
}: {
  candidateId: string;
  copy: RecoveryCopy;
}) {
  const action = recoverTelegramCandidatePhoto.bind(null, candidateId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const message = state.code === "recovered"
    ? copy.success
    : state.code === "unavailable"
      ? copy.unavailable
      : state.code === "configuration"
        ? copy.configuration
        : state.code === "storage"
          ? copy.storage
          : state.code === "failed"
            ? copy.failed
            : null;

  return (
    <form action={formAction} className="mt-3">
      <button type="submit" disabled={isPending} className="rounded-lg bg-amber-900 px-3 py-2 text-xs font-bold text-white disabled:cursor-wait disabled:opacity-60">
        {isPending ? copy.pending : copy.button}
      </button>
      {message ? <p className="mt-2 text-xs" role={state.status === "error" ? "alert" : "status"}>{message}</p> : null}
    </form>
  );
}
