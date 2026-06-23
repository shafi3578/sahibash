"use client";

import { useEffect, useState } from "react";
import { useMemo } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export type VehicleBrand = { id: number; name: string; slug: string };
export type VehicleSeries = { id: number; brand_id: number; name: string; slug: string };
export type VehicleModel = { id: number; name: string; slug: string; series_id: number | null; body_type: string | null; doors: number | null; seats: number | null };
export type VehicleGeneration = { id: number; name: string; slug: string; year_start: number | null; year_end: number | null };
export type VehicleVariant = { id: number; name: string; slug: string; fuel_type: string | null; transmission: string | null; engine_size: string | null; drive_type: string | null; body_type: string | null; engine_power: string | null; engine_capacity: string | null; wheel_drive: string | null; doors: number | null; seats: number | null };
export type VehicleSpec = { spec_key: string; spec_label: string; spec_value: string; is_locked: boolean };

export type VehicleSelection = {
  brand: VehicleBrand | null;
  series: VehicleSeries | null;
  model: VehicleModel | null;
  generation: VehicleGeneration | null;
  variant: VehicleVariant | null;
  specs: VehicleSpec[];
};

type Props = {
  categoryNodeId: number;
  aiSuggestedBrand?: string | null;
  aiSuggestedModel?: string | null;
  onChange: (selection: VehicleSelection) => void;
};

export function VehicleSmartSelector({ categoryNodeId, aiSuggestedBrand, aiSuggestedModel, onChange }: Props) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [brands, setBrands] = useState<VehicleBrand[]>([]);
  const [series, setSeries] = useState<VehicleSeries[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [generations, setGenerations] = useState<VehicleGeneration[]>([]);
  const [variants, setVariants] = useState<VehicleVariant[]>([]);

  const [selectedBrand, setSelectedBrand] = useState<VehicleBrand | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<VehicleSeries | null>(null);
  const [selectedModel, setSelectedModel] = useState<VehicleModel | null>(null);
  const [selectedGen, setSelectedGen] = useState<VehicleGeneration | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<VehicleVariant | null>(null);
  const [specs, setSpecs] = useState<VehicleSpec[]>([]);
  const [loading, setLoading] = useState(true);
  const [supportsSeries, setSupportsSeries] = useState(true);

  const normalizedSuggestion = aiSuggestedModel?.toLowerCase() ?? "";

  // fetch brands matching category node
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("vehicle_brands")
        .select("id, name, slug")
        .eq("category_node_id", categoryNodeId)
        .eq("is_active", true)
        .order("name");

      if (cancelled) return;
      const list = (data as VehicleBrand[]) ?? [];
      setBrands(list);

      if (aiSuggestedBrand) {
        const match = list.find((b) => b.name.toLowerCase() === aiSuggestedBrand.toLowerCase() || b.slug === aiSuggestedBrand.toLowerCase().replace(/\s+/g, "-"));
        if (match) {
          setSelectedBrand(match);
        }
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [categoryNodeId, aiSuggestedBrand, supabase]);


  // fetch series when brand changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selectedBrand) {
        if (!cancelled) {
          setSeries([]);
          setSelectedSeries(null);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from("vehicle_series")
          .select("id, brand_id, name, slug")
          .eq("brand_id", selectedBrand.id)
          .eq("is_active", true)
          .order("display_order");

        if (cancelled) return;
        if (error) {
          setSupportsSeries(false);
          setSeries([]);
          setSelectedSeries(null);
          return;
        }

        setSupportsSeries(true);
        const list = (data as VehicleSeries[]) ?? [];
        setSeries(list);
        if (list.length === 1) {
          setSelectedSeries(list[0]);
        } else {
          setSelectedSeries(null);
        }
      } catch {
        if (!cancelled) {
          setSupportsSeries(false);
          setSeries([]);
          setSelectedSeries(null);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [selectedBrand, supabase]);

  // fetch models when series or brand changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selectedBrand) {
        if (!cancelled) {
          setModels([]);
          setSelectedModel(null);
        }
        return;
      }

      if (supportsSeries && series.length > 0 && !selectedSeries) {
        if (!cancelled) {
          setModels([]);
          setSelectedModel(null);
        }
        return;
      }

      const selectClause = supportsSeries
        ? "id, name, slug, series_id, body_type, doors, seats"
        : "id, name, slug, body_type, doors, seats";

      let query = supabase.from("vehicle_models").select(selectClause).eq("is_active", true).order("display_order");

      if (supportsSeries && selectedSeries) {
        query = query.eq("series_id", selectedSeries.id);
      } else {
        query = query.eq("brand_id", selectedBrand.id);
      }

      const { data, error } = await query;
      if (cancelled) return;
      if (error) {
        setModels([]);
        setSelectedModel(null);
        return;
      }

      const list = (((data as unknown) as Array<Omit<VehicleModel, "series_id"> & { series_id?: number | null }>) ?? []).map((item) => ({
        ...item,
        series_id: item.series_id ?? null,
      }));
      setModels(list);
      if (normalizedSuggestion) {
        const match = list.find((m) => m.name.toLowerCase().includes(normalizedSuggestion) || normalizedSuggestion.includes(m.name.toLowerCase()));
        if (match) setSelectedModel(match);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedBrand, selectedSeries, series.length, supabase, normalizedSuggestion, supportsSeries]);

  // fetch generations when model changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selectedModel) {
        if (!cancelled) { setGenerations([]); setSelectedGen(null); }
        return;
      }
      const { data } = await supabase
        .from("vehicle_generations")
        .select("id, name, slug, year_start, year_end")
        .eq("model_id", selectedModel.id)
        .eq("is_active", true)
        .order("display_order");
      if (cancelled) return;
      const list = (data as VehicleGeneration[]) ?? [];
      setGenerations(list);
      setSelectedGen(list.length === 1 ? list[0] : null);
    })();
    return () => { cancelled = true; };
  }, [selectedModel, supabase]);

  // fetch variants when generation changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selectedGen) {
        if (!cancelled) { setVariants([]); setSelectedVariant(null); }
        return;
      }
      let list: VehicleVariant[] = [];
      try {
        const { data, error } = await supabase
          .from("vehicle_variants")
          .select("id, name, slug, fuel_type, transmission, engine_size, drive_type, body_type, engine_power, engine_capacity, wheel_drive, doors, seats")
          .eq("generation_id", selectedGen.id)
          .eq("is_active", true)
          .order("display_order");

        if (error) throw error;
        list = (data as VehicleVariant[]) ?? [];
      } catch {
        const { data } = await supabase
          .from("vehicle_variants")
          .select("id, name, slug, fuel_type, transmission, engine_size, drive_type")
          .eq("generation_id", selectedGen.id)
          .eq("is_active", true)
          .order("display_order");

        list = ((data as Array<Pick<VehicleVariant, "id" | "name" | "slug" | "fuel_type" | "transmission" | "engine_size" | "drive_type">>) ?? []).map((item) => ({
          ...item,
          body_type: null,
          engine_power: null,
          engine_capacity: item.engine_size ?? null,
          wheel_drive: item.drive_type ?? null,
          doors: null,
          seats: null,
        }));
      }
      if (cancelled) return;
      setVariants(list);
      setSelectedVariant(list.length === 1 ? list[0] : null);
    })();
    return () => { cancelled = true; };
  }, [selectedGen, supabase]);

  // load specs when variant is selected
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selectedVariant) {
        if (!cancelled) setSpecs([]);
        return;
      }
      const { data } = await supabase
        .from("vehicle_specifications")
        .select("spec_key, spec_label, spec_value, is_locked")
        .eq("variant_id", selectedVariant.id)
        .order("sort_order");
      if (!cancelled) setSpecs((data as VehicleSpec[]) ?? []);
    })();
    return () => { cancelled = true; };
  }, [selectedVariant, supabase]);

  const mergedSpecs = useMemo(() => {
    const composed: VehicleSpec[] = [
      selectedBrand ? { spec_key: "make", spec_label: "Make", spec_value: selectedBrand.name, is_locked: true } : null,
      selectedSeries ? { spec_key: "series", spec_label: "Series", spec_value: selectedSeries.name, is_locked: true } : null,
      selectedModel ? { spec_key: "model", spec_label: "Model", spec_value: selectedModel.name, is_locked: true } : null,
      selectedVariant ? { spec_key: "variant", spec_label: "Variant", spec_value: selectedVariant.name, is_locked: true } : null,
      selectedVariant?.body_type ? { spec_key: "body_type", spec_label: "Body Type", spec_value: selectedVariant.body_type, is_locked: true } : null,
      selectedVariant?.fuel_type ? { spec_key: "fuel_type", spec_label: "Fuel Type", spec_value: selectedVariant.fuel_type, is_locked: true } : null,
      selectedVariant?.transmission ? { spec_key: "gear", spec_label: "Gear / Transmission", spec_value: selectedVariant.transmission, is_locked: true } : null,
      selectedVariant?.engine_power ? { spec_key: "engine_power", spec_label: "Engine Power", spec_value: selectedVariant.engine_power, is_locked: true } : null,
      (selectedVariant?.engine_capacity || selectedVariant?.engine_size) ? { spec_key: "engine_capacity", spec_label: "Engine Capacity", spec_value: selectedVariant.engine_capacity ?? selectedVariant.engine_size ?? "", is_locked: true } : null,
      (selectedVariant?.wheel_drive || selectedVariant?.drive_type) ? { spec_key: "wheel_drive", spec_label: "Wheel Drive", spec_value: selectedVariant.wheel_drive ?? selectedVariant.drive_type ?? "", is_locked: true } : null,
      selectedVariant?.doors ? { spec_key: "doors", spec_label: "Doors", spec_value: String(selectedVariant.doors), is_locked: true } : null,
      selectedVariant?.seats ? { spec_key: "seats", spec_label: "Seats", spec_value: String(selectedVariant.seats), is_locked: true } : null,
    ].filter((value): value is VehicleSpec => Boolean(value));

    const byKey = new Map<string, VehicleSpec>();
    for (const spec of specs) {
      byKey.set(spec.spec_key, spec);
    }
    for (const spec of composed) {
      if (!byKey.has(spec.spec_key)) {
        byKey.set(spec.spec_key, spec);
      }
    }

    return Array.from(byKey.values());
  }, [selectedBrand, selectedSeries, selectedModel, selectedVariant, specs]);

  // notify parent whenever selection changes
  useEffect(() => {
    onChange({ brand: selectedBrand, series: selectedSeries, model: selectedModel, generation: selectedGen, variant: selectedVariant, specs: mergedSpecs });
  }, [selectedBrand, selectedSeries, selectedModel, selectedGen, selectedVariant, mergedSpecs, onChange]);

  function reset() {
    setSelectedBrand(null);
    setSelectedSeries(null);
    setSelectedModel(null);
    setSelectedGen(null);
    setSelectedVariant(null);
    setSpecs([]);
  }

  if (loading && brands.length === 0) {
    return <p className="mt-3 text-sm text-[var(--ink-2)]">Loading vehicle catalog...</p>;
  }

  // When tables don't exist yet, fall back to a notice
  if (!loading && brands.length === 0) {
    return null; // silent — old product_specs fallback handles rest
  }

  const breadcrumbParts = [
    selectedBrand?.name,
    selectedSeries?.name,
    selectedModel?.name,
    selectedGen?.name,
    selectedVariant?.name,
  ].filter(Boolean);

  return (
    <div className="space-y-3">
      {breadcrumbParts.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm">
          {breadcrumbParts.map((part, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-[var(--ink-2)]">›</span>}
              <span className="font-semibold">{part}</span>
            </span>
          ))}
          <button type="button" onClick={reset} className="ml-auto rounded-lg border border-[var(--line)] bg-white px-2 py-0.5 text-xs text-[var(--ink-2)]">
            Change
          </button>
        </div>
      )}

      {/* Brand */}
      {!selectedBrand && (
        <div>
          <p className="mb-2 text-sm font-bold">Select Brand</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {brands.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => { setSelectedBrand(b); setSelectedModel(null); setSelectedGen(null); setSelectedVariant(null); }}
                className="rounded-xl border border-[var(--line)] bg-white px-3 py-3 text-sm font-semibold text-left"
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Series */}
      {selectedBrand && !selectedSeries && series.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-bold">Select Series</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {series.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => { setSelectedSeries(item); setSelectedModel(null); setSelectedGen(null); setSelectedVariant(null); }}
                className="rounded-xl border border-[var(--line)] bg-white px-3 py-3 text-sm font-semibold text-left"
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Model */}
      {selectedBrand && (series.length === 0 || selectedSeries) && !selectedModel && (
        <div>
          <p className="mb-2 text-sm font-bold">Select Model</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {models.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => { setSelectedModel(m); setSelectedGen(null); setSelectedVariant(null); }}
                className="rounded-xl border border-[var(--line)] bg-white px-3 py-3 text-sm font-semibold text-left"
              >
                {m.name}
                {m.body_type && <span className="block text-xs font-normal text-[var(--ink-2)]">{m.body_type}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Generation */}
      {selectedModel && !selectedGen && generations.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-bold">Select Engine / Trim</p>
          <div className="grid grid-cols-2 gap-2">
            {generations.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => { setSelectedGen(g); setSelectedVariant(null); }}
                className="rounded-xl border border-[var(--line)] bg-white px-3 py-3 text-sm font-semibold text-left"
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Variant */}
      {selectedGen && !selectedVariant && variants.length > 1 && (
        <div>
          <p className="mb-2 text-sm font-bold">Select Style / Package</p>
          <div className="grid grid-cols-1 gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVariant(v)}
                className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-white px-3 py-3 text-sm font-semibold text-left"
              >
                <span>{v.name}</span>
                <span className="text-xs text-[var(--ink-2)]">{[v.fuel_type, v.transmission].filter(Boolean).join(" · ")}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Locked specs preview */}
      {selectedVariant && mergedSpecs.length > 0 && (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink-2)]">Auto-filled Locked Specifications</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {mergedSpecs.filter((s) => s.is_locked).map((s) => (
              <div key={s.spec_key} className="rounded-lg bg-white px-3 py-2 text-sm">
                <p className="text-[var(--ink-2)]">{s.spec_label}</p>
                <p className="font-semibold">{s.spec_value}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-[var(--ink-2)]">These are auto-filled from the selected vehicle. Sellers only enter condition, year, KM, paint report, and selling details.</p>
        </div>
      )}
    </div>
  );
}
