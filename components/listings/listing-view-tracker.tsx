"use client";

import { useEffect } from "react";

export function ListingViewTracker({ listingId }: { listingId: string }) {
  useEffect(() => {
    const key = `sahibash:view:${listingId}`;
    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      // The server still rate-limits clients without session storage.
    }
    void fetch(`/api/listings/${encodeURIComponent(listingId)}/view`, { method: "POST", keepalive: true });
  }, [listingId]);
  return null;
}
