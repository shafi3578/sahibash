"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { ListingImage } from "@/types/database";

type Props = {
  images: ListingImage[];
  title: string;
};

export function ListingGallery({ images, title }: Props) {
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const ordered = useMemo(() => {
    const list = [...images];
    list.sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      return a.sort_order - b.sort_order;
    });
    return list;
  }, [images]);

  const active = ordered[index];
  const src = active?.image_url ?? active?.public_url ?? null;

  if (!src) {
    return <div className="aspect-[4/3] w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-2)]" />;
  }

  const count = ordered.length;

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-[var(--line)] bg-black">
        <button type="button" className="relative block aspect-[4/3] w-full" onClick={() => setFullscreen(true)}>
          <Image
            src={src}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 900px"
            priority
          />
        </button>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">
          {index + 1} / {count}
        </div>
      </div>

      {count > 1 ? (
        <div className="mt-2 grid grid-cols-5 gap-2 sm:grid-cols-8">
          {ordered.map((img, i) => {
            const thumbSrc = img.image_url ?? img.public_url ?? null;
            if (!thumbSrc) return null;
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => setIndex(i)}
                className={`relative aspect-square overflow-hidden rounded-lg border ${i === index ? "border-[var(--accent)]" : "border-[var(--line)]"}`}
              >
                <Image src={thumbSrc} alt={`${title} ${i + 1}`} fill className="object-cover" sizes="96px" loading="lazy" />
              </button>
            );
          })}
        </div>
      ) : null}

      {fullscreen ? (
        <div className="fixed inset-0 z-50 bg-black/95 p-4">
          <div className="mx-auto flex h-full w-full max-w-5xl flex-col">
            <div className="mb-3 flex items-center justify-between text-white">
              <p className="text-sm font-semibold">{index + 1} / {count}</p>
              <button type="button" onClick={() => setFullscreen(false)} className="rounded-lg border border-white/30 px-3 py-1 text-sm">
                Close
              </button>
            </div>
            <div className="relative flex-1">
              <Image
                src={src}
                alt={title}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>
            {count > 1 ? (
              <div className="mt-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setIndex((prev) => (prev - 1 + count) % count)}
                  className="rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold text-white"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setIndex((prev) => (prev + 1) % count)}
                  className="rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold text-white"
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
