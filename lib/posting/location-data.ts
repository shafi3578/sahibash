// Location data with 4 levels: Country > City/Province > District > Neighborhood

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

export const LOCATION_DATA: Country[] = [
  {
    id: 'af',
    name: 'Afghanistan',
    code: 'AF',
    cities: [
      {
        id: 'kabul',
        name: 'Kabul',
        districts: [
          {
            id: 'kabul-1',
            name: 'District 1',
            neighborhoods: [
              { id: 'kabul-1-1', name: 'Shahr-e Nau' },
              { id: 'kabul-1-2', name: 'Karte Char' },
              { id: 'kabul-1-3', name: 'Karte Se' },
            ],
          },
          {
            id: 'kabul-2',
            name: 'District 2',
            neighborhoods: [
              { id: 'kabul-2-1', name: 'Karte Parwan' },
              { id: 'kabul-2-2', name: 'Qala-e Fatihullah' },
              { id: 'kabul-2-3', name: 'Karte Naw' },
            ],
          },
          {
            id: 'kabul-3',
            name: 'District 3',
            neighborhoods: [
              { id: 'kabul-3-1', name: 'Microrayan' },
              { id: 'kabul-3-2', name: 'Silo' },
              { id: 'kabul-3-3', name: 'Qasaba' },
            ],
          },
        ],
      },
      {
        id: 'herat',
        name: 'Herat',
        districts: [
          {
            id: 'herat-1',
            name: 'District 1',
            neighborhoods: [
              { id: 'herat-1-1', name: 'Adalet Mah.' },
              { id: 'herat-1-2', name: 'Karte Seyed' },
              { id: 'herat-1-3', name: 'Guzar-e Bala' },
            ],
          },
          {
            id: 'herat-2',
            name: 'District 2',
            neighborhoods: [
              { id: 'herat-2-1', name: 'Osmangazi' },
              { id: 'herat-2-2', name: 'Guzar-e Payan' },
              { id: 'herat-2-3', name: 'Karte Chendol' },
            ],
          },
        ],
      },
      {
        id: 'kandahar',
        name: 'Kandahar',
        districts: [
          {
            id: 'kandahar-1',
            name: 'District 1',
            neighborhoods: [
              { id: 'kandahar-1-1', name: 'Bazaar District' },
              { id: 'kandahar-1-2', name: 'Pashtun Abad' },
            ],
          },
          {
            id: 'kandahar-2',
            name: 'District 2',
            neighborhoods: [
              { id: 'kandahar-2-1', name: 'Spin Boldak' },
              { id: 'kandahar-2-2', name: 'Ahmed Shah Baba' },
            ],
          },
        ],
      },
    ],
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
