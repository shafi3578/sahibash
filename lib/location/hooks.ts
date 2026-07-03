'use client';

import { useState, useEffect, useCallback } from 'react';
import { Province, District, Area } from './types';

/**
 * Hook to fetch and cache provinces
 */
export function useProvinces() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await fetch('/api/location/provinces');
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch provinces');
        }

        setProvinces(result.data || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setProvinces([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProvinces();
  }, []);

  return { provinces, loading, error };
}

/**
 * Hook to fetch districts for a specific province
 * Only loads when provinceId is provided
 */
export function useDistricts(provinceId: string | null | undefined) {
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!provinceId) {
      setDistricts([]);
      setError(null);
      return;
    }

    const fetchDistricts = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/location/districts?province_id=${encodeURIComponent(provinceId)}`
        );
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch districts');
        }

        setDistricts(result.data || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setDistricts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDistricts();
  }, [provinceId]);

  return { districts, loading, error };
}

/**
 * Hook to fetch areas for a specific province/district
 * Can optionally fetch only popular areas
 */
export function useAreas(
  provinceId: string | null | undefined,
  districtId?: string | null,
  popularOnly?: boolean
) {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!provinceId) {
      setAreas([]);
      setError(null);
      return;
    }

    const fetchAreas = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          province_id: provinceId,
          ...(districtId && { district_id: districtId }),
          ...(popularOnly && { popular: 'true' }),
        });

        const response = await fetch(`/api/location/areas?${params}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch areas');
        }

        setAreas(result.data || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setAreas([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAreas();
  }, [provinceId, districtId, popularOnly]);

  return { areas, loading, error };
}

/**
 * Hook to submit a custom area
 */
export function useSubmitCustomArea() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (
      provinceId: string,
      name_en: string,
      name_fa: string,
      name_ps: string,
      districtId?: string,
      userId?: string
    ) => {
      setSubmitting(true);
      setError(null);

      try {
        const response = await fetch('/api/location/areas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            province_id: provinceId,
            district_id: districtId || null,
            name_en,
            name_fa,
            name_ps,
            user_id: userId,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to submit area');
        }

        return result.area;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    []
  );

  return { submit, submitting, error };
}
