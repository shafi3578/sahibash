import { NextResponse } from "next/server";
import { InferenceClient } from "@huggingface/inference";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mapSignalsToCategory } from "@/lib/ai/category-mapping";
import { matchProductSpecsFromSignals } from "@/lib/ai/product-specs-matching";

type Suggestion = {
  rootSlug: "real-estate" | "vehicles" | "mobile-phones-tablets" | "electronics-computers" | "home-furniture-appliances" | "clothing-personal-items" | "jobs" | "services" | "business-industry" | "farm-animals" | "education" | "sports-hobbies" | "other";
  pathSlugs: string[];
  label: string;
  reason: string;
  confidence: number;
};

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const key = process.env.HUGGINGFACE_API_KEY;
    if (!key) {
      return NextResponse.json({ suggestion: null, message: "HUGGINGFACE_API_KEY is missing" }, { status: 200 });
    }

    const formData = await request.formData();
    const image = formData.get("image");
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const imageUrlsRaw = formData.get("image_urls");

    const imageUrls = (() => {
      if (!imageUrlsRaw) return [] as string[];
      if (typeof imageUrlsRaw === "string") {
        try {
          const parsed = JSON.parse(imageUrlsRaw) as unknown;
          return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
        } catch {
          return imageUrlsRaw ? [imageUrlsRaw] : [];
        }
      }
      return [] as string[];
    })();

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

    if (user) {
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
    }

    return NextResponse.json(responsePayload);
  } catch (error) {
    return NextResponse.json(
      {
        suggestion: null,
        message: error instanceof Error ? error.message : "AI suggestion failed",
      },
      { status: 200 }
    );
  }
}