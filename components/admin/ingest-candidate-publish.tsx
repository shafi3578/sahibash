"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  publishReviewedIngestCandidate,
  type CandidatePublicationState,
} from "@/lib/actions/inventory-publish";

type PublishCopy = {
  button: string;
  pending: string;
  published: string;
  openListing: string;
  notReady: string;
  media: string;
  storage: string;
  publication: string;
  failed: string;
};

const initialState: CandidatePublicationState = { status: "idle", code: "idle" };

export function IngestCandidatePublish({
  candidateId,
  locale,
  copy,
}: {
  candidateId: string;
  locale: "en" | "fa" | "ps";
  copy: PublishCopy;
}) {
  const action = publishReviewedIngestCandidate.bind(null, candidateId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const message = state.code === "published"
    ? copy.published
    : state.code === "not_ready"
      ? copy.notReady
      : state.code === "media"
        ? copy.media
        : state.code === "storage"
          ? copy.storage
          : state.code === "publication"
            ? copy.publication
            : state.code === "failed"
              ? copy.failed
              : null;

  return (
    <form action={formAction} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
      <button
        type="submit"
        disabled={isPending || state.status === "success"}
        className="w-full rounded-xl bg-emerald-800 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900 disabled:cursor-wait disabled:opacity-65"
      >
        {isPending ? copy.pending : copy.button}
      </button>
      {message ? (
        <p className="mt-3 text-sm font-semibold leading-6 text-emerald-950" role={state.status === "error" ? "alert" : "status"}>
          {message}
        </p>
      ) : null}
      {state.status === "success" && state.listingId ? (
        <Link
          href={`/${locale}/listings/${state.listingId}`}
          className="mt-3 inline-flex rounded-lg border border-emerald-800 px-3 py-2 text-xs font-bold text-emerald-950"
        >
          {copy.openListing}
        </Link>
      ) : null}
    </form>
  );
}
