// Category slug type for routing
export type CategorySlug =
  | "vehicles"
  | "real-estate"
  | "mobile-phones-tablets"
  | "electronics-computers"
  | "home-furniture-appliances"
  | "clothing-personal-items"
  | "jobs"
  | "services"
  | "business-industry"
  | "farm-animals"
  | "education"
  | "sports-hobbies"
  | "other";

// Subcategory attributes per category for form building
export const SUBCATEGORY_ATTRIBUTES: Record<CategorySlug, Record<string, string>> = {
  vehicles: {
    brand: "Brand",
    model: "Model",
    year: "Year",
    mileage: "Mileage (km)",
    fuel_type: "Fuel Type",
    transmission: "Transmission",
    color: "Color",
  },
  "real-estate": {
    property_type: "Property Type",
    rooms: "Number of Rooms",
    size: "Size (sqft)",
    floor: "Floor Number",
    furnished: "Furnished",
  },
  "mobile-phones-tablets": {
    brand: "Brand",
    model: "Model",
    storage: "Storage",
    ram: "RAM",
    warranty: "Warranty",
    item_condition: "Condition",
  },
  "electronics-computers": {
    brand: "Brand",
    model: "Model",
    storage: "Storage",
    ram: "RAM",
    warranty: "Warranty",
  },
  "home-furniture-appliances": {
    item_condition: "Condition",
  },
  "clothing-personal-items": {
    item_condition: "Condition",
  },
  jobs: {},
  services: {},
  "business-industry": {},
  "farm-animals": {},
  education: {},
  "sports-hobbies": {},
  other: {
    item_condition: "Condition",
  },
};

// Slug to human-readable name mapping
export const SLUG_TO_NAME: Record<CategorySlug, string> = {
  vehicles: "Vehicles",
  "real-estate": "Real Estate",
  "mobile-phones-tablets": "Mobile Phones & Tablets",
  "electronics-computers": "Electronics & Computers",
  "home-furniture-appliances": "Home, Furniture & Appliances",
  "clothing-personal-items": "Clothing & Personal Items",
  jobs: "Jobs",
  services: "Services",
  "business-industry": "Business & Industry",
  "farm-animals": "Farm & Animals",
  education: "Education",
  "sports-hobbies": "Sports & Hobbies",
  other: "Other",
};

export function getCategoryNameFromSlug(slug: string): string | null {
  const categorySlug = slug as CategorySlug;
  return SLUG_TO_NAME[categorySlug] || null;
}
