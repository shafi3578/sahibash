import { NextResponse } from "next/server";
import { saveListingDraftAction } from "@/lib/actions/drafts";

const MAX_RECOVERY_BYTES = 60_000;

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (!raw || new TextEncoder().encode(raw).byteLength > MAX_RECOVERY_BYTES) {
    return NextResponse.json({ ok: false }, { status: 413 });
  }

  let recovery: Record<string, unknown>;
  try {
    recovery = objectValue(JSON.parse(raw));
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const title = String(recovery.title ?? "").trim();
  const description = String(recovery.description ?? "").trim();
  const rootSlug = String(recovery.selectedRootSlug ?? "").trim();
  const photos = Array.isArray(recovery.photos) ? recovery.photos.slice(0, 15) : [];
  if (!title && !description && !rootSlug && photos.length === 0) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const selectedCategory = objectValue(recovery.selectedCategory);
  const location = objectValue(recovery.location);
  const language = recovery.language === "fa" || recovery.language === "ps" ? recovery.language : "en";
  const result = await saveListingDraftAction({
    postingType: "quick",
    category: {
      rootSlug,
      categoryNodeId: selectedCategory.id ?? null,
      categoryPath: selectedCategory.path ?? null,
      selectedCategory,
    },
    details: recovery,
    photos,
    location,
    language,
  });

  return NextResponse.json({ ok: result.ok }, { status: result.statusCode ?? (result.ok ? 200 : 400) });
}
