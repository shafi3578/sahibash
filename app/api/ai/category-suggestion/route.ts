import { NextResponse } from "next/server";
import { InferenceClient } from "@huggingface/inference";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mapSignalsToCategory } from "@/lib/ai/category-mapping";
import { matchProductSpecsFromSignals } from "@/lib/ai/product-specs-matching";
import { consumeRateLimit } from "@/lib/security/rate-limit";

type Suggestion = {
  rootSlug: "real-estate" | "vehicles" | "mobile-phones-tablets" | "electronics-computers" | "home-furniture-appliances" | "clothing-personal-items" | "jobs" | "services" | "business-industry" | "farm-animals" | "education" | "sports-hobbies" | "other";
  pathSlugs: string[];
  label: string;
  reason: string;
  confidence: number;
};

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_URLS = 12;
const MAX_IMAGE_URL_LENGTH = 2048;

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
    if (!key) {
      return NextResponse.json({ suggestion: null, message: "AI suggestions are temporarily unavailable." }, { status: 200 });
    }

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
    if (image instanceof File) {
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

    const suggestion = mapSignalsToCategory({
      title,
      description,
      labels,
      specsMatch,
    }) as Suggestion | null;

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
