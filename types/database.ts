export type AppRole = "user" | "admin";
export type ListingStatus = "pending" | "approved" | "rejected" | "sold" | "expired";
export type Currency = "AFN" | "USD";
export type ReportStatus = "open" | "reviewed" | "dismissed" | "actioned";
export type MessageStatus = "sent" | "delivered" | "read";
export type OfferStatus = "pending" | "accepted" | "rejected" | "cancelled";
export type PromotionType = "featured" | "urgent" | "bump";
export type NotificationType =
  | "listing_approved"
  | "listing_rejected"
  | "listing_expiring"
  | "listing_message"
  | "listing_offer"
  | "system";
export type LanguageCode = "en" | "fa" | "ps";

// Location Types
export type LocationSource = "manual" | "browser" | "gps" | "map_pin";
export type LocationVisibility = "exact" | "approximate" | "hidden";

export type CategoryId = number;
export type CategoryNodeId = number;
export type CategoryFieldId = number;

export type AfghanistanLocation =
  | "Kabul"
  | "Herat"
  | "Mazar-e-Sharif"
  | "Kandahar"
  | "Jalalabad"
  | "Kunduz"
  | "Ghazni"
  | "Bamyan"
  | "Balkh"
  | "Takhar"
  | "Baghlan"
  | "Nangarhar"
  | "Helmand"
  | "Badakhshan"
  | "Faryab";

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  province: string | null;
  avatar_url: string | null;
  preferred_language: LanguageCode;
  role: AppRole;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: CategoryId;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  is_coming_soon: boolean;
  launch_date: string | null;
  created_at: string;
  updated_at: string;
};

export type CategoryWaitlist = {
  id: number;
  category_id: CategoryId;
  user_id: string | null;
  email: string | null;
  created_at: string;
};

export type CategoryNode = {
  id: CategoryNodeId;
  category_id: CategoryId;
  parent_id: CategoryNodeId | null;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  level: number;
  path: string;
  display_order: number;
  sort_order?: number;
  is_leaf?: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CategoryField = {
  id: CategoryFieldId;
  category_node_id: CategoryNodeId;
  field_key: string;
  field_label: string;
  field_type: "text" | "number" | "boolean" | "select" | "date";
  is_required: boolean;
  options_json: Record<string, unknown> | string[] | null;
  unit: string | null;
  display_order: number;
  sort_order?: number;
  group_key?: string | null;
  visibility_rules?: Record<string, unknown> | null;
  validation_rules?: Record<string, unknown> | null;
  is_filterable?: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Listing = {
  id: string;
  user_id: string;
  category_id: CategoryId;
  category_node_id: CategoryNodeId;
  vehicle_variant_id: number | null;
  vehicle_type: string | null;
  vehicle_subtype: string | null;
  vehicle_brand: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  vehicle_is_manual: boolean;
  vehicle_is_classic: boolean;
  vehicle_is_custom: boolean;
  vehicle_manual_specs: Record<string, unknown> | null;
  title: string;
  description: string;
  price: number;
  currency: Currency;
  city: string;
  country_id: number | null;
  province_id: number | null;
  district_id: number | null;
  area_id: number | null;
  province: string | null;
  district: string | null;
  neighborhood: string | null;
  address_text: string | null;
  address_optional: string | null;
  latitude: number | null;
  longitude: number | null;
  location_accuracy: number | null;
  location_visibility: LocationVisibility;
  video_url: string | null;
  contact_phone: string;
  contact_name: string | null;
  delivery_preference: string | null;
  meeting_preference: string | null;
  negotiable: boolean;
  minimum_offer: number | null;
  status: ListingStatus;
  featured: boolean;
  urgent: boolean;
  views_count: number;
  favorites_count: number;
  messages_count: number;
  listing_score: number;
  created_at: string;
  updated_at: string;
  expires_at: string;
  published_at: string | null;
  last_bumped_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  archived_at: string | null;
};

export type ListingAttribute = {
  id: number;
  listing_id: string;
  category_field_id: CategoryFieldId | null;
  attribute_key: string;
  attribute_value_text: string | null;
  attribute_value_number: number | null;
  attribute_value_boolean: boolean | null;
  attribute_value_json: Record<string, unknown> | null;
  unit: string | null;
  created_at: string;
  updated_at: string;
};

export type ListingImage = {
  id: string;
  listing_id: string;
  storage_path: string;
  public_url: string | null;
  image_url?: string | null;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ProductSpec = {
  id: number;
  category_node_id: CategoryNodeId;
  brand: string;
  model: string;
  aliases: string[];
  specs: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
};

export type AIDetectionLog = {
  id: number;
  user_id: string;
  image_urls: string[];
  title: string | null;
  description: string | null;
  detected_labels: Record<string, unknown>[];
  suggested_category_node_id: CategoryNodeId | null;
  suggested_specs: Record<string, unknown>;
  confidence: number | null;
  created_at: string;
};

export type Favorite = {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
};

export type SavedSearch = {
  id: string;
  user_id: string;
  name: string;
  query_text: string | null;
  filters: Record<string, unknown>;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  listing_id: string;
  sender_user_id: string;
  recipient_user_id: string;
  body: string;
  status: MessageStatus;
  created_at: string;
  read_at: string | null;
  deleted_by_sender: boolean;
  deleted_by_recipient: boolean;
};

export type Offer = {
  id: string;
  listing_id: string;
  buyer_user_id: string;
  seller_user_id: string;
  offered_price: number;
  currency: Currency;
  status: OfferStatus;
  buyer_note: string | null;
  seller_response_note: string | null;
  buyer_seen_at: string | null;
  seller_seen_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Report = {
  id: string;
  listing_id: string;
  reporter_user_id: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  admin_note: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ListingView = {
  id: number;
  listing_id: string;
  viewer_user_id: string | null;
  viewer_ip: string | null;
  user_agent: string | null;
  viewed_at: string;
};

export type ListingPriceHistory = {
  id: number;
  listing_id: string;
  changed_by: string;
  old_price: number | null;
  new_price: number;
  currency: Currency;
  reason: string | null;
  created_at: string;
};

export type ListingNote = {
  id: string;
  listing_id: string;
  user_id: string;
  note: string;
  created_at: string;
  updated_at: string;
};

export type ListingPromotion = {
  id: string;
  listing_id: string;
  promotion_type: PromotionType;
  starts_at: string;
  ends_at: string | null;
  created_by: string;
  created_at: string;
  metadata: Record<string, unknown>;
};

export type Notification = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  payload: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
};

export type ListingWithRelations = Listing & {
  category?: Category;
  category_node?: CategoryNode;
  country?: Country;
  province?: Province;
  district?: District;
  area?: Area;
  provinces?: Province;
  districts?: District;
  areas?: Area;
  profile?: Profile;
  profiles?: Profile;
  listing_images?: ListingImage[];
  listing_attributes?: ListingAttribute[];
  vehicle_damage?: VehicleDamageReport | null;
  vehicle_variant?: VehicleVariantRecord | null;
  vehicle_features?: ListingVehicleFeature[];
};

export type ListingWithImages = ListingWithRelations;

export type MessageThread = {
  listing_id: string;
  last_message_at: string;
  unread_count: number;
  messages: Message[];
  listing?: Listing;
  participant?: Profile;
};

export type AdminDashboardStats = {
  total_users: number;
  total_listings: number;
  pending_listings: number;
  approved_listings: number;
  rejected_listings: number;
  reported_listings: number;
};

// Backward compatibility alias for old code paths
export type Subcategory = CategoryNode;

export type VehicleDamagePart = {
  id: number;
  damage_report_id: number;
  part_key: string;
  part_label: string;
  condition: string;
  created_at: string;
};

export type VehicleDamageReport = {
  id: number;
  listing_id: string;
  all_original: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  vehicle_damage_parts?: VehicleDamagePart[];
};

export type VehicleBrandRecord = {
  id: number;
  category_node_id: number | null;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type VehicleSeriesRecord = {
  id: number;
  brand_id: number;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type VehicleModelRecord = {
  id: number;
  brand_id: number;
  series_id: number | null;
  name: string;
  slug: string;
  body_type: string | null;
  doors: number | null;
  seats: number | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type VehicleVariantRecord = {
  id: number;
  generation_id: number;
  name: string;
  slug: string;
  fuel_type: string | null;
  transmission: string | null;
  body_type: string | null;
  engine_power: string | null;
  engine_capacity: string | null;
  wheel_drive: string | null;
  doors: number | null;
  seats: number | null;
  engine_size?: string | null;
  drive_type?: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type VehicleFeatureGroup = {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
  created_at: string;
};

export type VehicleFeature = {
  id: number;
  group_id: number;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  group?: VehicleFeatureGroup;
};

export type ListingVehicleFeature = {
  id: number;
  listing_id: string;
  feature_id: number;
  created_at: string;
  vehicle_feature?: VehicleFeature;
};

// Location Tables
export type Country = {
  id: number;
  name: string;
  slug: string;
  iso_code: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Province = {
  id: number;
  country_id: number;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type District = {
  id: number;
  province_id: number;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Area = {
  id: number;
  district_id: number;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ListingLocation = {
  countryId: number | null;
  provinceId: number | null;
  districtId: number | null;
  areaId: number | null;
  provinceName: string | null;
  districtName: string | null;
  areaName: string | null;
  addressText: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  visibility: LocationVisibility;
};
