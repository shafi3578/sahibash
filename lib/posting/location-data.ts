// Location data with 4 levels: Country > City/Province > District > Neighborhood

import { AFGHAN_PROVINCES } from "@/lib/constants/marketplace";

export interface Neighborhood {
  id: string;
  name: string;
}

export interface District {
  id: string;
  name: string;
  neighborhoods: Neighborhood[];
}

export interface City {
  id: string;
  name: string;
  districts: District[];
}

export interface Country {
  id: string;
  name: string;
  code: string;
  cities: City[];
}

function slugifyLocation(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createPlaceholderDistricts(cityName: string): District[] {
  const citySlug = slugifyLocation(cityName);

  return [1, 2, 3].map((districtNumber) => {
    const districtName = `${cityName} District ${districtNumber}`;
    const districtSlug = `${citySlug}-district-${districtNumber}`;

    return {
      id: districtSlug,
      name: districtName,
      neighborhoods: [
        { id: `${districtSlug}-1`, name: `${districtName} Center` },
        { id: `${districtSlug}-2`, name: `${districtName} North` },
      ],
    };
  });
}

export const LOCATION_DATA: Country[] = [
  {
    id: 'af',
    name: 'Afghanistan',
    code: 'AF',
    cities: AFGHAN_PROVINCES.map((province) => ({
      id: slugifyLocation(province),
      name: province,
      districts: createPlaceholderDistricts(province),
    })),
  },
];

// Helper functions
export const getCountries = () => LOCATION_DATA;

export const getCities = (countryId: string) => {
  const country = LOCATION_DATA.find((c) => c.id === countryId);
  return country?.cities || [];
};

export const getDistricts = (countryId: string, cityId: string) => {
  const country = LOCATION_DATA.find((c) => c.id === countryId);
  const city = country?.cities.find((c) => c.id === cityId);
  return city?.districts || [];
};

export const getNeighborhoods = (countryId: string, cityId: string, districtId: string) => {
  const country = LOCATION_DATA.find((c) => c.id === countryId);
  const city = country?.cities.find((c) => c.id === cityId);
  const district = city?.districts.find((d) => d.id === districtId);
  return district?.neighborhoods || [];
};
