"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function InventoryLiveRefresh({ label }: { label: string }) {
  const router = useRouter();
  const [lastChecked, setLastChecked] = useState<number | null>(null);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      router.refresh();
      setLastChecked(Date.now());
    };
    const intervalId = window.setInterval(refresh, 30_000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [router]);

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800" title={lastChecked ? new Date(lastChecked).toLocaleTimeString() : undefined}>
      <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
      {label}
    </div>
  );
}
