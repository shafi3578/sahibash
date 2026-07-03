/**
 * AI Category Suggestion Endpoint
 * POST /api/posting/suggest-category
 * 
 * Analyzes user input (photos, title, description, location, selling method)
 * and suggests the most appropriate category path with confidence score
 */

import { NextRequest, NextResponse } from "next/server";
import type { AISuggestion } from "@/lib/posting/types";
import { getRootCategories, getChildCategories } from "@/lib/posting/categoryTree";

type SuggestionRequest = {
  title: string;
  description: string;
  location?: { province?: string; district?: string };
  sellingMethod?: string;
  photoUrls?: string[];
};

/**
 * Simple heuristic-based category suggestion
 * In production, this would integrate with Claude API
 */
function suggestCategoryHeuristic(req: SuggestionRequest): AISuggestion | null {
  const titleLower = req.title.toLowerCase();
  const descLower = req.description.toLowerCase();

  // Phone detection
  if (
    titleLower.includes("iphone") ||
    titleLower.includes("apple") ||
    descLower.includes("iphone")
  ) {
    // Simple iPhone model detection
    let model = "iphone_13_pro_max"; // default

    if (
      titleLower.includes("13") ||
      titleLower.includes("thirteen")
    ) {
      model = "iphone_13_pro_max";
    } else if (
      titleLower.includes("14") ||
      titleLower.includes("fourteen")
    ) {
      model = "iphone_14_pro_max";
    } else if (
      titleLower.includes("15") ||
      titleLower.includes("fifteen")
    ) {
      model = "iphone_15_pro_max";
    }

    return {
      categoryPath: [
        {
          id: "phones_electronics",
          name: "Phones & Electronics",
          slug: "phones_electronics",
          labelKey: "category.phones",
          type: "main_category",
          active: true,
          sortOrder: 1,
          finalNode: false,
        },
        {
          id: "mobile_phones",
          name: "Mobile Phones",
          slug: "mobile_phones",
          labelKey: "category.mobile_phones",
          type: "subcategory",
          active: true,
          sortOrder: 1,
          finalNode: false,
        },
        {
          id: "apple_brand",
          name: "Apple",
          slug: "apple_brand",
          labelKey: "category.apple",
          type: "brand",
          active: true,
          sortOrder: 1,
          finalNode: false,
        },
        {
          id: model,
          name: `iPhone Model`,
          slug: model,
          labelKey: `category.${model}`,
          type: "model",
          active: true,
          sortOrder: 1,
          finalNode: true,
        },
      ],
      confidence: 0.85,
      reasoning: "Detected iPhone in title",
      usedPhotos: false,
      usedTitle: true,
      usedDescription: false,
      usedLocation: false,
    };
  }

  // Samsung/Android detection
  if (
    titleLower.includes("samsung") ||
    titleLower.includes("galaxy") ||
    titleLower.includes("xiaomi") ||
    titleLower.includes("android")
  ) {
    let brand = "samsung_brand";
    let model = "samsung_galaxy_s23_ultra";

    if (titleLower.includes("xiaomi")) {
      brand = "xiaomi_brand";
      model = "xiaomi_13_ultra";
    }

    return {
      categoryPath: [
        {
          id: "phones_electronics",
          name: "Phones & Electronics",
          slug: "phones_electronics",
          labelKey: "category.phones",
          type: "main_category",
          active: true,
          sortOrder: 1,
          finalNode: false,
        },
        {
          id: "mobile_phones",
          name: "Mobile Phones",
          slug: "mobile_phones",
          labelKey: "category.mobile_phones",
          type: "subcategory",
          active: true,
          sortOrder: 1,
          finalNode: false,
        },
        {
          id: brand,
          name: "Brand",
          slug: brand,
          labelKey: `category.${brand}`,
          type: "brand",
          active: true,
          sortOrder: 1,
          finalNode: false,
        },
        {
          id: model,
          name: "Model",
          slug: model,
          labelKey: `category.${model}`,
          type: "model",
          active: true,
          sortOrder: 1,
          finalNode: true,
        },
      ],
      confidence: 0.80,
      reasoning: "Detected Android/Samsung in title",
      usedPhotos: false,
      usedTitle: true,
      usedDescription: false,
      usedLocation: false,
    };
  }

  // Vehicle detection
  if (
    titleLower.includes("car") ||
    titleLower.includes("toyota") ||
    titleLower.includes("honda") ||
    titleLower.includes("suzuki") ||
    titleLower.includes("vehicle")
  ) {
    let model = "toyota_corolla";

    if (titleLower.includes("honda")) {
      model = "honda_civic";
    } else if (titleLower.includes("suzuki")) {
      model = "suzuki_swift";
    }

    return {
      categoryPath: [
        {
          id: "vehicles",
          name: "Vehicles",
          slug: "vehicles",
          labelKey: "category.vehicles",
          type: "main_category",
          active: true,
          sortOrder: 1,
          finalNode: false,
        },
        {
          id: "cars",
          name: "Cars",
          slug: "cars",
          labelKey: "category.cars",
          type: "subcategory",
          active: true,
          sortOrder: 1,
          finalNode: false,
        },
        {
          id: model,
          name: "Model",
          slug: model,
          labelKey: `category.${model}`,
          type: "model",
          active: true,
          sortOrder: 1,
          finalNode: true,
        },
      ],
      confidence: 0.75,
      reasoning: "Detected vehicle keywords in title",
      usedPhotos: false,
      usedTitle: true,
      usedDescription: false,
      usedLocation: false,
    };
  }

  // Real estate detection
  if (
    titleLower.includes("apartment") ||
    titleLower.includes("house") ||
    titleLower.includes("villa") ||
    titleLower.includes("property") ||
    titleLower.includes("real estate")
  ) {
    let type = "apartment";

    if (titleLower.includes("house")) type = "house";
    else if (titleLower.includes("villa")) type = "villa";
    else if (titleLower.includes("land")) type = "land";

    return {
      categoryPath: [
        {
          id: "real_estate",
          name: "Real Estate",
          slug: "real_estate",
          labelKey: "category.real_estate",
          type: "main_category",
          active: true,
          sortOrder: 1,
          finalNode: false,
        },
        {
          id: type,
          name: type.charAt(0).toUpperCase() + type.slice(1),
          slug: type,
          labelKey: `category.${type}`,
          type: "property_type",
          active: true,
          sortOrder: 1,
          finalNode: true,
        },
      ],
      confidence: 0.80,
      reasoning: "Detected real estate keywords",
      usedPhotos: false,
      usedTitle: true,
      usedDescription: false,
      usedLocation: false,
    };
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body: SuggestionRequest = await request.json();

    // Validate input
    if (!body.title || !body.description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    // Get suggestion using heuristic (TODO: integrate Claude API)
    const suggestion = suggestCategoryHeuristic(body);

    if (!suggestion) {
      return NextResponse.json(
        {
          error: "Could not determine category from provided information",
          suggestion: null,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error("Category suggestion error:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestion" },
      { status: 500 }
    );
  }
}
