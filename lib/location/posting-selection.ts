export function createManualLocationSelection(provinceId: number | null, districtId: number | null) {
  return {
    source: "manual" as const,
    latitude: null,
    longitude: null,
    accuracy: null,
    confirmed: Boolean(provinceId && districtId),
    hint: null,
  };
}

export function canConfirmDetectedLocation(selection: {
  isDetectingLocation: boolean;
  source: string | null;
  provinceId: number | null;
  districtId: number | null;
  latitude: number | null;
  longitude: number | null;
}) {
  return !selection.isDetectingLocation
    && selection.source === "device"
    && Boolean(selection.provinceId && selection.districtId)
    && Number.isFinite(selection.latitude)
    && Number.isFinite(selection.longitude);
}

// Geolocation callbacks cannot be aborted. Ignore them after a manual choice or
// a newer request, including reverse-geocoding responses already in flight.
export function createLocationRequestGuard() {
  let generation = 0;
  return {
    begin() {
      const requestGeneration = ++generation;
      return () => requestGeneration === generation;
    },
    cancel() {
      generation += 1;
    },
  };
}
