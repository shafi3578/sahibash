import { NextResponse } from "next/server";
import { InferenceClient } from "@huggingface/inference";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mapSignalsToCategory } from "@/lib/ai/category-mapping";
import { matchProductSpecsFromSignals } from "@/lib/ai/product-specs-matching";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { requestGatewayCategorySuggestion } from "@/lib/ai/gateway";

type Suggestion = {
  rootSlug: string;
  pathSlugs: string[];
  label: string;
  reason: string;
  confidence: number;
  leafCategoryId?: number;
  pathIds?: number[];
};

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_URLS = 12;
const MAX_IMAGE_URL_LENGTH = 2048;
const LAUNCH_ROOTS = new Set(["vehicles", "real-estate", "mobile-phones-tablets", "second-hand-items"]);

function parseImageUrls(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  let candidates: unknown;
  try {
    candidates = JSON.parse(raw);
  } catch {
    candidates = [raw];
  }
  if (!Array.isArray(candidates) || candidates.length > MAX_IMAGE_URLS) {
    throw new Error("INVALID_IMAGE_URLS");
  }
  return candidates.map((candidate) => {
    const value = String(candidate).trim();
    if (!value || value.length > MAX_IMAGE_URL_LENGTH) throw new Error("INVALID_IMAGE_URLS");
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) throw new Error("INVALID_IMAGE_URLS");
    return url.toString();
  });
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ suggestion: null, message: "Authentication required" }, { status: 401 });
    }

    const rateLimit = await consumeRateLimit({
      scope: "ai.category_suggestion",
      userId: user.id,
      maxRequests: 30,
      windowSeconds: 60 * 60,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json({ suggestion: null, message: "Too many requests. Please try again later." }, { status: 429 });
    }

    const key = process.env.HUGGINGFACE_API_KEY;

    const formData = await request.formData();
    const image = formData.get("image");
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const imageUrlsRaw = formData.get("image_urls");

    if (title.length > 120 || description.length > 5000) {
      return NextResponse.json({ suggestion: null, message: "Input is too long" }, { status: 413 });
    }

    if (image instanceof File && (!image.type.startsWith("image/") || image.size > MAX_IMAGE_BYTES)) {
      return NextResponse.json({ suggestion: null, message: "Image must be a supported file up to 10 MB" }, { status: 413 });
    }

    let imageUrls: string[];
    try {
      imageUrls = parseImageUrls(imageUrlsRaw);
    } catch {
      return NextResponse.json({ suggestion: null, message: "Image URLs are invalid" }, { status: 400 });
    }

    if (!(image instanceof File) && !title && !description) {
      return NextResponse.json({ suggestion: null, message: "Please provide image or title/description" }, { status: 400 });
    }

    let labels: Array<{ label: string; score: number }> = [];
    const { data: leafRows } = await supabase
      .from("category_nodes")
      .select("id,path")
      .eq("is_active", true)
      .eq("is_leaf", true)
      .limit(500);
    const allowedLeafPaths = (leafRows ?? [])
      .map((row) => String((row as { path?: string }).path ?? ""))
      .filter((path) => path && LAUNCH_ROOTS.has(path.split("/")[0]));
    const gatewaySuggestions = await requestGatewayCategorySuggestion({ title, description, allowedPaths: allowedLeafPaths });
    if (image instanceof File && key) {
      const client = new InferenceClient(key);
      const output = await client.imageClassification({
        model: "google/vit-base-patch16-224",
        data: image,
      });

      labels = Array.isArray(output)
        ? output
            .map((row) => ({
              label: String((row as { label?: string }).label ?? ""),
              score: Number((row as { score?: number }).score ?? 0),
            }))
            .filter((row) => row.label)
        : [];
    }

    const specsMatch = await matchProductSpecsFromSignals(supabase, {
      title,
      description,
      labels,
    });

    const mappedSuggestion = mapSignalsToCategory({
      title,
      description,
      labels,
      specsMatch,
    }) as Suggestion | null;
    const mappedPath = mappedSuggestion?.pathSlugs?.join("/") ?? "";
    const unhydratedSuggestions: Suggestion[] = gatewaySuggestions.length > 0
      ? gatewaySuggestions.map((gatewaySuggestion) => ({
          rootSlug: gatewaySuggestion.pathSlugs[0],
          pathSlugs: gatewaySuggestion.pathSlugs,
          label: gatewaySuggestion.pathSlugs.join(" > "),
          reason: gatewaySuggestion.reason,
          confidence: gatewaySuggestion.confidence,
        }))
      : mappedSuggestion && allowedLeafPaths.includes(mappedPath)
        ? [mappedSuggestion]
        : [];

    const neededPaths = Array.from(new Set(unhydratedSuggestions.flatMap((suggestion) =>
      suggestion.pathSlugs.map((_, index) => suggestion.pathSlugs.slice(0, index + 1).join("/"))
    )));
    const { data: pathRows } = neededPaths.length > 0
      ? await supabase
          .from("category_nodes")
          .select("id,path,is_active,is_leaf")
          .in("path", neededPaths)
          .eq("is_active", true)
      : { data: [] };
    const nodeByPath = new Map((pathRows ?? []).map((row) => [String(row.path), row]));
    const suggestions = unhydratedSuggestions
      .map((candidate) => {
        const fullPath = candidate.pathSlugs.join("/");
        const leaf = nodeByPath.get(fullPath);
        const pathIds = candidate.pathSlugs
          .map((_, index) => nodeByPath.get(candidate.pathSlugs.slice(0, index + 1).join("/"))?.id)
          .filter((id): id is number => typeof id === "number");
        if (!leaf?.is_leaf || pathIds.length !== candidate.pathSlugs.length) return null;
        return { ...candidate, leafCategoryId: Number(leaf.id), pathIds } satisfies Suggestion;
      })
      .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null)
      .slice(0, 3);
    const suggestion = suggestions[0] ?? null;

    let suggestedCategoryNodeId: number | null = null;
    if (suggestion) {
      const path = suggestion.pathSlugs.join("/");
      const { data: nodeData } = await supabase
        .from("category_nodes")
        .select("id")
        .eq("path", path)
        .maybeSingle();
      suggestedCategoryNodeId = nodeData?.id ?? null;
    }

    const responsePayload = {
      suggestion,
      suggestions,
      source: gatewaySuggestions.length > 0 ? "gateway" : "deterministic",
      labels: labels.slice(0, 8),
      suggestedProduct: specsMatch
        ? {
            categoryNodeId: specsMatch.categoryNodeId,
            categoryPath: specsMatch.categoryPath,
            brand: specsMatch.brand,
            model: specsMatch.model,
          }
        : null,
      suggestedSpecs: specsMatch
        ? {
            brand: specsMatch.brand,
            model: specsMatch.model,
            ...specsMatch.specs,
          }
        : null,
      lowConfidence: !suggestion || suggestion.confidence < 0.45,
      message:
        !suggestion || suggestion.confidence < 0.45
          ? "We could not detect clearly. Please choose category manually."
          : null,
    };

    await supabase.from("ai_detection_logs").insert({
      user_id: user.id,
      image_urls: imageUrls,
      title: title || null,
      description: description || null,
      detected_labels: labels,
      suggested_category_node_id: suggestedCategoryNodeId,
      suggested_specs: specsMatch
        ? {
            brand: specsMatch.brand,
            model: specsMatch.model,
            ...specsMatch.specs,
          }
        : {},
      confidence: suggestion?.confidence ?? null,
    });

    return NextResponse.json(responsePayload);
  } catch {
    return NextResponse.json(
      {
        suggestion: null,
        message: "AI suggestion failed",
      },
      { status: 500 }
    );
  }
}
