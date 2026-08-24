export type PublicLocationVisibility = "exact" | "approximate" | "hidden" | "province_district" | string | null | undefined;

export type PublicLocationRow = {
  latitude?: number | null;
  longitude?: number | null;
  address_text?: string | null;
  location_visibility?: PublicLocationVisibility;
};

function toFiniteCoordinate(value: unknown) {
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
}

function toApproximateCoordinate(value: unknown) {
  const coordinate = toFiniteCoordinate(value);
  if (coordinate === null) return null;

  // Two decimals is roughly a 1km grid for latitude in Afghanistan. This is
  // deterministic, so repeated requests cannot average random offsets back to
  // the seller's original pin.
  return Math.round(coordinate * 100) / 100;
}

export function sanitizePublicLocation<T extends PublicLocationRow>(location: T) {
  if (location.location_visibility === "exact") {
    return {
      ...location,
      latitude: toFiniteCoordinate(location.latitude),
      longitude: toFiniteCoordinate(location.longitude),
      address_text: location.address_text ?? null,
    };
  }

  if (location.location_visibility === "approximate") {
    return {
      ...location,
      latitude: toApproximateCoordinate(location.latitude),
      longitude: toApproximateCoordinate(location.longitude),
      address_text: null,
    };
  }

  return {
    ...location,
    latitude: null,
    longitude: null,
    address_text: null,
  };
}
