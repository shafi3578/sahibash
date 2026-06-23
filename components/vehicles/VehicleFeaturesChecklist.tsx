"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type FeatureGroup = {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
};

type Feature = {
  id: number;
  group_id: number;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
};

type Props = {
  value: number[];
  onChange: (featureIds: number[]) => void;
};

export function VehicleFeaturesChecklist({ value, onChange }: Props) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [groups, setGroups] = useState<FeatureGroup[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [{ data: groupRows }, { data: featureRows }] = await Promise.all([
        supabase.from("vehicle_feature_groups").select("id, name, slug, sort_order").order("sort_order"),
        supabase.from("vehicle_features").select("id, group_id, name, slug, sort_order, is_active").eq("is_active", true).order("sort_order"),
      ]);

      if (cancelled) {
        return;
      }

      setGroups((groupRows as FeatureGroup[]) ?? []);
      setFeatures((featureRows as Feature[]) ?? []);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const grouped = useMemo(() => {
    return groups.map((group) => ({
      ...group,
      features: features.filter((feature) => feature.group_id === group.id),
    })).filter((group) => group.features.length > 0);
  }, [groups, features]);

  function toggleFeature(featureId: number) {
    if (value.includes(featureId)) {
      onChange(value.filter((id) => id !== featureId));
      return;
    }

    onChange([...value, featureId]);
  }

  if (loading) {
    return <p className="text-sm text-[var(--ink-2)]">Loading vehicle features...</p>;
  }

  if (grouped.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm">
        <p className="font-semibold">Select the vehicle features that apply to this listing.</p>
        <span className="text-xs font-semibold text-[var(--ink-2)]">{value.length} selected</span>
      </div>

      {grouped.map((group) => (
        <section key={group.id} className="rounded-xl border border-[var(--line)] p-3">
          <h3 className="text-sm font-bold">{group.name}</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {group.features.map((feature) => {
              const checked = value.includes(feature.id);
              return (
                <label key={feature.id} className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-semibold ${checked ? "border-[var(--accent)] bg-sky-50" : "border-[var(--line)] bg-white"}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleFeature(feature.id)}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  <span>{feature.name}</span>
                </label>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
