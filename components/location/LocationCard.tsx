'use client';

export type LocationVisibility = 'exact' | 'approximate' | 'hidden' | 'province_district';

interface LocationInfo {
  countryId?: number | null;
  provinceId?: number | null;
  districtId?: number | null;
  areaId?: number | null;
  provinceName?: string | null;
  districtName?: string | null;
  areaName?: string | null;
  addressText?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  visibility: LocationVisibility | null;
}

interface LocationCardProps {
  location: LocationInfo;
  buyerDistance?: number; // Distance in km if available
  locale?: 'en' | 'fa' | 'ps';
}

type LocationCopy = {
  title: string;
  exactHidden: string;
  approximateOnly: string;
  exactLocation: string;
  approximateArea: string;
  googleMaps: string;
  waze: string;
  kmAway: string;
  exactVisible: string;
  approximateVisible: string;
  provinceDistrictVisible: string;
};

const LOCATION_COPY: Record<'en' | 'fa' | 'ps', LocationCopy> = {
  en: {
    title: '📍 Location',
    exactHidden: '🔒 Seller has hidden the exact location.',
    approximateOnly: '📍 Approximate location only. Exact location is hidden by seller.',
    exactLocation: '📍 Exact Location',
    approximateArea: '🌍 Approximate Area',
    googleMaps: 'Directions',
    waze: 'Waze',
    kmAway: 'km away',
    exactVisible: '✓ Full location details are visible to buyers.',
    approximateVisible: '✓ Only approximate area is visible. Exact coordinates are hidden.',
    provinceDistrictVisible: '✓ Only province and district are visible. Exact location is hidden.',
  },
  fa: {
    title: '📍 موقعیت',
    exactHidden: '🔒 فروشنده موقعیت دقیق را پنهان کرده است.',
    approximateOnly: '📍 فقط موقعیت تقریبی نمایش داده می شود. موقعیت دقیق توسط فروشنده پنهان است.',
    exactLocation: '📍 موقعیت دقیق',
    approximateArea: '🌍 محدوده تقریبی',
    googleMaps: 'مسیریابی',
    waze: 'ویز',
    kmAway: 'کیلومتر فاصله',
    exactVisible: '✓ موقعیت کامل برای خریدار نمایش داده می شود.',
    approximateVisible: '✓ فقط محدوده تقریبی نمایش داده می شود. مختصات دقیق پنهان است.',
    provinceDistrictVisible: '✓ فقط ولایت و ولسوالی نمایش داده می شود. موقعیت دقیق پنهان است.',
  },
  ps: {
    title: '📍 ځای',
    exactHidden: '🔒 پلورونکي کره ځای پټ کړی دی.',
    approximateOnly: '📍 یوازې نږدې ځای ښکاري. کره ځای د پلورونکي له خوا پټ دی.',
    exactLocation: '📍 کره ځای',
    approximateArea: '🌍 نږدې سیمه',
    googleMaps: 'لار موندنه',
    waze: 'وېز',
    kmAway: 'کیلومتر لرې',
    exactVisible: '✓ بشپړ ځای معلومات پېرودونکو ته ښکاري.',
    approximateVisible: '✓ یوازې نږدې سیمه ښکاري. کره مختصات پټ دي.',
    provinceDistrictVisible: '✓ یوازې ولایت او ولسوالي ښکاري. کره ځای پټ دی.',
  },
};

export default function LocationCard({ location, buyerDistance, locale = 'en' }: LocationCardProps) {
  const copy = LOCATION_COPY[locale] ?? LOCATION_COPY.en;
  const canUseExactCoordinates = location.visibility === 'exact' && Boolean(location.latitude && location.longitude);

  if (!location.provinceName && !location.districtName) {
    return null;
  }

  const getGoogleMapsUrl = () => {
    if (canUseExactCoordinates) {
      return `https://www.google.com/maps/search/${location.latitude},${location.longitude}`;
    }
    const query = [location.provinceName, location.districtName, location.areaName]
      .filter(Boolean)
      .join(', ');
    return `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
  };

  const getWazeUrl = () => {
    if (canUseExactCoordinates) {
      return `https://www.waze.com/navigate?to=${location.latitude},${location.longitude}`;
    }
    return '';
  };

  const renderLocationText = () => {
    if (location.visibility === 'hidden' || location.visibility === 'province_district') {
      return (
        <div className="space-y-2">
          <p className="text-sm text-gray-700">
            <strong>{location.provinceName}</strong>
            {location.districtName && ` / ${location.districtName}`}
          </p>
          <p className="text-xs text-gray-500 italic">
            {copy.exactHidden}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        <p className="text-sm font-semibold text-gray-900">
          {location.provinceName}
          {location.districtName && ` / ${location.districtName}`}
          {location.areaName && ` / ${location.areaName}`}
        </p>
        {location.addressText && (
          <p className="text-sm text-gray-600">{location.addressText}</p>
        )}
        {location.visibility === 'approximate' && (
          <p className="text-xs text-gray-500 italic">
            {copy.approximateOnly}
          </p>
        )}
        {buyerDistance && location.visibility === 'exact' && (
          <p className="text-xs font-medium text-blue-600">
            {buyerDistance.toFixed(1)} {copy.kmAway}
          </p>
        )}
      </div>
    );
  };

  const canShowDirections = canUseExactCoordinates;

  return (
    <section className="rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 sm:px-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-sm font-bold text-gray-900">{copy.title}</h3>

        {canShowDirections ? (
          <div className="flex gap-1.5">
            {canShowDirections && (
              <>
              <a
                href={getGoogleMapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-blue-200 px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-50"
              >
                {copy.googleMaps}
              </a>
              {getWazeUrl() && (
                <a
                  href={getWazeUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-green-200 px-2.5 py-1.5 text-xs font-semibold text-green-700 transition-colors hover:bg-green-50"
                >
                  {copy.waze}
                </a>
              )}
              </>
            )}
          </div>
        ) : null}
      </div>

      <div className="mt-1.5">{renderLocationText()}</div>
      <div className="mt-2 border-t border-gray-100 pt-2 text-[11px] text-gray-500">
        {location.visibility === 'exact' && (
          <p>{copy.exactVisible}</p>
        )}
        {location.visibility === 'approximate' && (
          <p>{copy.approximateVisible}</p>
        )}
        {(location.visibility === 'hidden' || location.visibility === 'province_district') && (
          <p>{copy.provinceDistrictVisible}</p>
        )}
      </div>
    </section>
  );
}
