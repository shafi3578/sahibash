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
  mapComingSoon: string;
  coordinates: string;
  googleMaps: string;
  waze: string;
  copyCoordinates: string;
  copiedCoordinates: string;
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
    mapComingSoon: 'Map integration coming soon. Open in external map below.',
    coordinates: 'Coordinates',
    googleMaps: '🗺️ Google Maps',
    waze: '🧭 Waze',
    copyCoordinates: '📋 Copy Coordinates',
    copiedCoordinates: 'Coordinates copied to clipboard',
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
    mapComingSoon: 'ادغام نقشه به زودی اضافه می شود. فعلا از نقشه بیرونی استفاده کنید.',
    coordinates: 'مختصات',
    googleMaps: '🗺️ گوگل مپس',
    waze: '🧭 ویز',
    copyCoordinates: '📋 کپی مختصات',
    copiedCoordinates: 'مختصات در کلیپ بورد کپی شد',
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
    mapComingSoon: 'د نقشې ادغام ژر راځي. تر هغه وخته لاندې بهرنۍ نقشه وکاروئ.',
    coordinates: 'مختصات',
    googleMaps: '🗺️ ګوګل مپس',
    waze: '🧭 وېز',
    copyCoordinates: '📋 مختصات کاپي کړئ',
    copiedCoordinates: 'مختصات کلپ بورډ ته کاپي شول',
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

  const canShowMap = canUseExactCoordinates;

  const canShowDirections = canUseExactCoordinates;

  return (
    <div className="border rounded-lg p-4 bg-white">
      {/* Header */}
      <h3 className="text-lg font-semibold text-gray-900 mb-3">{copy.title}</h3>

      {/* Location Text */}
      {renderLocationText()}

      {/* Map Preview Placeholder */}
      {canShowMap && (
        <div className="mt-4 bg-gray-100 rounded-lg h-48 flex items-center justify-center border border-gray-300">
          <div className="text-center text-gray-600">
            <p className="text-sm mb-1">
              {location.visibility === 'exact' ? copy.exactLocation : copy.approximateArea}
            </p>
            <p className="text-xs text-gray-500">
              {copy.mapComingSoon}
            </p>
            {canUseExactCoordinates ? (
              <p className="text-xs text-gray-500 mt-1">
                {copy.coordinates}: {location.latitude?.toFixed(4)}, {location.longitude?.toFixed(4)}
              </p>
            ) : null}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {(canShowDirections || Boolean(getGoogleMapsUrl())) && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {canShowDirections && (
            <>
              <a
                href={getGoogleMapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors"
              >
                {copy.googleMaps}
              </a>
              {getWazeUrl() && (
                <a
                  href={getWazeUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-50 border border-green-200 rounded-lg transition-colors"
                >
                  {copy.waze}
                </a>
              )}
            </>
          )}
          {canShowDirections && (
            <button
              onClick={() => {
                if (location.latitude && location.longitude) {
                  navigator.clipboard.writeText(
                    `${location.latitude},${location.longitude}`
                  );
                  alert(copy.copiedCoordinates);
                }
              }}
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors"
            >
              {copy.copyCoordinates}
            </button>
          )}
        </div>
      )}

      {/* Privacy Notice */}
      <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
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
    </div>
  );
}
