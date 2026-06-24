export const LAUNCH_ACTIVE_CATEGORY_SLUGS = [
  "vehicles",
  "real-estate",
  "mobile-phones-tablets",
  "second-hand-items",
] as const;

export const COMING_SOON_HOME_CATEGORY_SLUGS = [
  "jobs",
  "services",
  "business-industry",
  "farm-animals",
  "education",
  "sports-hobbies",
  "other",
] as const;

export const ACTIVE_HOME_CATEGORY_SLUGS = LAUNCH_ACTIVE_CATEGORY_SLUGS;

export const COMING_SOON_CATEGORY_LABELS = COMING_SOON_HOME_CATEGORY_SLUGS;

export const RELATED_CATEGORIES: Record<string, string[]> = {
  "real-estate": [
    "home-furniture-appliances",
    "services",
    "business-industry",
  ],
  vehicles: [
    "services",
    "business-industry",
    "farm-animals",
  ],
  "second-hand-items": [
    "real-estate",
    "services",
    "other",
  ],
  "mobile-phones-tablets": [
    "electronics-computers",
    "services",
    "other",
  ],
  "electronics-computers": [
    "mobile-phones-tablets",
    "services",
    "other",
  ],
  "home-furniture-appliances": [
    "real-estate",
    "services",
    "other",
  ],
  "clothing-personal-items": [
    "other",
    "services",
  ],
  jobs: [
    "services",
    "business-industry",
  ],
  services: [
    "business-industry",
    "jobs",
    "other",
  ],
  "business-industry": [
    "services",
    "vehicles",
    "real-estate",
  ],
  "farm-animals": [
    "vehicles",
    "services",
    "business-industry",
  ],
  education: [
    "services",
    "jobs",
  ],
  "sports-hobbies": [
    "other",
    "services",
  ],
  other: [
    "services",
  ],
};
