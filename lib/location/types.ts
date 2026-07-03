// Location system types

export interface Province {
  id: string;
  slug: string;
  name_en: string;
  name_fa: string;
  name_ps: string;
  aliases: string[];
  sort_order: number;
  is_active: boolean;
}

export interface District {
  id: string;
  province_id: string;
  slug: string;
  name_en: string;
  name_fa: string;
  name_ps: string;
  aliases: string[];
  sort_order: number;
  is_active: boolean;
}

export interface Area {
  id: string;
  province_id: string;
  district_id: string | null;
  slug: string | null;
  name_en: string;
  name_fa: string;
  name_ps: string;
  aliases: string[];
  is_popular: boolean;
  is_approved: boolean;
  submitted_by_user_id: string | null;
  submitted_at: string | null;
}

export interface LocationSelection {
  province_id: string;
  province_name?: string;
  district_id?: string;
  district_name?: string;
  area_id?: string;
  area_name?: string;
  area_custom?: string; // User-typed custom area
  location_latitude?: number;
  location_longitude?: number;
  location_gps_private?: boolean;
}

export type LocaleType = 'en' | 'fa' | 'ps';
