"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { VehicleDamageDiagram } from "@/components/vehicles/VehicleDamageDiagram";
import {
  saveReviewedIngestCandidate,
  type CandidateReviewState,
} from "@/lib/actions/inventory-review";
import {
  labelForLocale,
  type ListingSchemaConfig,
} from "@/lib/listing-schema-config";
import type { AppLocale } from "@/lib/i18n/translations";
import {
  defaultVehicleDamageParts,
  normalizeVehicleDamageParts,
  shouldShowVehicleDamageDiagram,
  type DamagePart,
} from "@/lib/vehicles/damage-report";

type Option = { id: number; label: string; path?: string };
type DistrictOption = Option & { provinceId: number };

type Props = {
  candidateId: string;
  locale: AppLocale;
  initial: {
    categoryNodeId: number | null;
    provinceId: number | null;
    districtId: number | null;
    normalizedPhone: string;
    normalizedPriceAfn: number | null;
    payload: Record<string, unknown>;
  };
  categories: Option[];
  provinces: Option[];
  districts: DistrictOption[];
  initialSchema: ListingSchemaConfig | null;
};

const INITIAL_STATE: CandidateReviewState = { status: "idle", code: "idle" };

function record(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function IngestCandidateReviewForm({
  candidateId,
  locale,
  initial,
  categories,
  provinces,
  districts,
  initialSchema,
}: Props) {
  const router = useRouter();
  const action = saveReviewedIngestCandidate.bind(null, candidateId);
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const [categoryNodeId, setCategoryNodeId] = useState(initial.categoryNodeId ?? 0);
  const [categoryQuery, setCategoryQuery] = useState("");
  const [provinceId, setProvinceId] = useState(initial.provinceId ?? 0);
  const [districtId, setDistrictId] = useState(initial.districtId ?? 0);
  const [priceMode, setPriceMode] = useState(String(initial.payload.price_mode ?? "contact"));
  const [schema, setSchema] = useState<ListingSchemaConfig | null>(initialSchema);
  const [schemaStatus, setSchemaStatus] = useState<"idle" | "loading" | "error">(
    initialSchema ? "idle" : "error",
  );
  const translations = record(initial.payload.translations);
  const en = record(translations.en);
  const fa = record(translations.fa);
  const ps = record(translations.ps);
  const details = record(initial.payload.details);
  const vehicle = record(initial.payload.vehicle);
  const reviewNotes = record(initial.payload.review_notes);
  const initialDamageParts = normalizeVehicleDamageParts(vehicle.damage_parts);
  const [damageParts, setDamageParts] = useState<DamagePart[]>(() =>
    initialDamageParts.length === 13 ? initialDamageParts : defaultVehicleDamageParts(),
  );
  const selectedCategoryPath = categories.find((category) => category.id === categoryNodeId)?.path ?? "";
  const [rootSlug, branchKey] = selectedCategoryPath.split("/");
  const showVehicleDamage = shouldShowVehicleDamageDiagram(rootSlug, branchKey);
  const visibleCategories = useMemo(() => {
    const normalizedQuery = categoryQuery.trim().toLocaleLowerCase();
    const matches = normalizedQuery
      ? categories.filter((category) => `${category.label} ${category.path ?? ""}`.toLocaleLowerCase().includes(normalizedQuery))
      : categories;
    const limited = matches.slice(0, 100);
    const selected = categories.find((category) => category.id === categoryNodeId);
    return selected && !limited.some((category) => category.id === selected.id)
      ? [selected, ...limited]
      : limited;
  }, [categories, categoryNodeId, categoryQuery]);
  const visibleDistricts = useMemo(
    () => districts.filter((district) => district.provinceId === provinceId),
    [districts, provinceId],
  );
  const errors = new Map((state.errors ?? []).map((error) => [error.field, error.code]));

  const copy = locale === "fa"
    ? {
        title: "اصلاح و آماده‌سازی اعلان",
        intro: "محتوا، ترجمه‌ها، دسته دقیق، موقعیت، قیمت و جزئیات تخصصی را بررسی کنید. تنها نسخه کامل قابل نشر می‌شود.",
        category: "دسته نهایی",
        categorySearch: "جستجوی دسته با نام یا مسیر",
        loadingSchema: "در حال بارگذاری جزئیات دسته…",
        schemaError: "ساختار این دسته بارگذاری نشد. دسته را دوباره انتخاب کنید.",
        location: "موقعیت اعلان",
        province: "ولایت",
        district: "ولسوالی / شهر",
        contact: "شماره تماس منبع",
        priceMode: "روش قیمت",
        contactPrice: "قیمت به تماس",
        fixed: "قیمت ثابت",
        negotiable: "قابل مذاکره",
        amount: "قیمت به افغانی",
        originalLanguage: "زبان اصلی اعلان",
        english: "انگلیسی",
        dari: "دری",
        pashto: "پشتو",
        adTitle: "عنوان",
        description: "توضیحات",
        categoryDetails: "جزئیات مخصوص دسته",
        bodyReport: "گزارش تصویری وضعیت بدنه",
        optional: "اختیاری",
        required: "ضروری",
        bodyNote: "یادداشت وضعیت بدنه (اختیاری)",
        reviewNote: "یادداشت داخلی بررسی (اختیاری)",
        save: "ذخیره اصلاحات",
        ready: "تایید آمادگی نشر",
        saving: "در حال ذخیره…",
        saved: "اصلاحات ذخیره شد.",
        readyDone: "اعلان کامل است و اکنون می‌تواند نشر شود.",
        invalid: "اصلاحات ذخیره شد، اما بخش‌های مشخص‌شده هنوز کامل نیست.",
        media: "حداقل یک تصویر معتبر لازم است.",
        failed: "ذخیره بررسی ناموفق بود. دوباره تلاش کنید.",
        fieldError: "این مقدار را بررسی کنید.",
        select: "انتخاب",
      }
    : locale === "ps"
      ? {
          title: "اعلان سم او د خپرولو لپاره چمتو کړئ",
          intro: "منځپانګه، ژباړې، کره کټګوري، ځای، بیه او ځانګړي تفصیلات وڅېړئ. یوازې بشپړ اعلان خپرېدای شي.",
          category: "وروستۍ کټګوري",
          categorySearch: "کټګوري د نوم یا لارې له مخې ولټوئ",
          loadingSchema: "د کټګورۍ تفصیلات بارېږي…",
          schemaError: "د دې کټګورۍ جوړښت بار نه شو. کټګوري بیا وټاکئ.",
          location: "د اعلان ځای",
          province: "ولایت",
          district: "ولسوالي / ښار",
          contact: "د سرچینې د اړیکې شمېره",
          priceMode: "د بیې ډول",
          contactPrice: "بیه په اړیکه",
          fixed: "ټاکلې بیه",
          negotiable: "د خبرو وړ",
          amount: "بیه په افغانیو",
          originalLanguage: "د اعلان اصلي ژبه",
          english: "انګلیسي",
          dari: "دري",
          pashto: "پښتو",
          adTitle: "سرلیک",
          description: "تشریح",
          categoryDetails: "د کټګورۍ ځانګړي تفصیلات",
          bodyReport: "د بدنې د حالت انځوریز راپور",
          optional: "اختیاري",
          required: "اړین",
          bodyNote: "د بدنې د حالت یادښت (اختیاري)",
          reviewNote: "د بیاکتنې داخلي یادښت (اختیاري)",
          save: "سمونونه خوندي کړئ",
          ready: "د خپرولو چمتووالی تایید کړئ",
          saving: "خوندي کېږي…",
          saved: "سمونونه خوندي شول.",
          readyDone: "اعلان بشپړ دی او اوس خپرېدای شي.",
          invalid: "سمونونه خوندي شول، خو نښه شوې برخې لا نیمګړې دي.",
          media: "لږ تر لږه یو سم انځور اړین دی.",
          failed: "بیاکتنه خوندي نه شوه. بیا هڅه وکړئ.",
          fieldError: "دا ارزښت وڅېړئ.",
          select: "وټاکئ",
        }
      : {
          title: "Correct and prepare listing",
          intro: "Review content, translations, exact category, location, price, and category details. Only a complete listing can become publishable.",
          category: "Final category",
          categorySearch: "Search category by name or path",
          loadingSchema: "Loading category details…",
          schemaError: "This category schema could not be loaded. Select the category again.",
          location: "Listing location",
          province: "Province",
          district: "District / City",
          contact: "Source contact phone",
          priceMode: "Price method",
          contactPrice: "Contact for price",
          fixed: "Fixed price",
          negotiable: "Negotiable",
          amount: "Price in AFN",
          originalLanguage: "Original listing language",
          english: "English",
          dari: "Dari",
          pashto: "Pashto",
          adTitle: "Title",
          description: "Description",
          categoryDetails: "Category-specific details",
          bodyReport: "Visual body-condition report",
          optional: "Optional",
          required: "Required",
          bodyNote: "Vehicle body-condition note (optional)",
          reviewNote: "Internal review note (optional)",
          save: "Save corrections",
          ready: "Confirm ready to publish",
          saving: "Saving…",
          saved: "Corrections saved.",
          readyDone: "The listing is complete and can now be published.",
          invalid: "Corrections were saved, but the highlighted fields are still incomplete.",
          media: "At least one valid photo is required.",
          failed: "The review could not be saved. Try again.",
          fieldError: "Check this value.",
          select: "Select",
        };

  useEffect(() => {
    if (!categoryNodeId || categoryNodeId === initial.categoryNodeId) return;
    const controller = new AbortController();
    fetch(`/api/admin/inventory/schema?categoryNodeId=${categoryNodeId}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Schema request failed");
        return response.json() as Promise<{ config: ListingSchemaConfig }>;
      })
      .then((payload) => {
        setSchema(payload.config);
        setSchemaStatus("idle");
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setSchema(null);
          setSchemaStatus("error");
        }
      });
    return () => controller.abort();
  }, [categoryNodeId, initial.categoryNodeId, initialSchema]);

  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [router, state.status]);

  const statusMessage = state.code === "ready"
    ? copy.readyDone
    : state.code === "saved"
      ? copy.saved
      : state.code === "missing_media"
        ? copy.media
        : state.code === "invalid"
          ? copy.invalid
          : state.code === "failed"
            ? copy.failed
            : "";

  function selectCategory(nextCategoryNodeId: number) {
    setCategoryNodeId(nextCategoryNodeId);
    if (nextCategoryNodeId === initial.categoryNodeId) {
      setSchema(initialSchema);
      setSchemaStatus(initialSchema ? "idle" : "error");
    } else if (nextCategoryNodeId > 0) {
      setSchema(null);
      setSchemaStatus("loading");
    } else {
      setSchema(null);
      setSchemaStatus("error");
    }
  }

  function fieldInput(field: ListingSchemaConfig["fields"][number]) {
    const name = `detail__${field.key}`;
    const defaultValue = details[field.key];
    const common = "mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm";
    if (field.type === "boolean") {
      return (
        <label key={field.key} className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-[var(--line)] px-3 py-2 text-sm font-semibold">
          <span>{labelForLocale(field.labels, locale)} <small className="text-[var(--ink-2)]">({field.required ? copy.required : copy.optional})</small></span>
          <input type="hidden" name={name} value="false" />
          <input type="checkbox" name={name} value="true" defaultChecked={defaultValue === true || defaultValue === "true"} className="h-5 w-5" />
        </label>
      );
    }
    return (
      <label key={field.key} className="text-sm font-bold">
        {labelForLocale(field.labels, locale)} {field.unit ? <span className="font-normal text-[var(--ink-2)]">({field.unit})</span> : null} <small className="font-normal text-[var(--ink-2)]">({field.required ? copy.required : copy.optional})</small>
        {field.type === "select" ? (
          <select name={name} defaultValue={String(defaultValue ?? "")} className={common}>
            <option value="">{copy.select}</option>
            {field.options.map((option) => <option key={option.value} value={option.value}>{labelForLocale(option.labels, locale)}</option>)}
          </select>
        ) : (
          <input name={name} type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"} defaultValue={String(defaultValue ?? "")} className={common} />
        )}
        {errors.has(name) ? <span className="mt-1 block text-xs text-red-700">{copy.fieldError}</span> : null}
      </label>
    );
  }

  return (
    <form action={formAction} className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
      <h2 className="font-display text-xl font-bold">{copy.title}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--ink-2)]">{copy.intro}</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold sm:col-span-2">
          {copy.category}
          <input value={categoryQuery} onChange={(event) => setCategoryQuery(event.target.value)} placeholder={copy.categorySearch} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2.5" />
          <select name="category_node_id" value={categoryNodeId || ""} onChange={(event) => selectCategory(Number(event.target.value))} className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-3">
            <option value="">{copy.select}</option>
            {visibleCategories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
          </select>
          {errors.has("category_node_id") ? <span className="mt-1 block text-xs text-red-700">{copy.fieldError}</span> : null}
        </label>

        <fieldset className="grid gap-3 rounded-xl border border-[var(--line)] p-4 sm:col-span-2 sm:grid-cols-2">
          <legend className="px-2 text-sm font-bold">{copy.location}</legend>
          <label className="text-sm font-bold">{copy.province}
            <select name="province_id" value={provinceId || ""} onChange={(event) => { setProvinceId(Number(event.target.value)); setDistrictId(0); }} className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5">
              <option value="">{copy.select}</option>
              {provinces.map((province) => <option key={province.id} value={province.id}>{province.label}</option>)}
            </select>
            {errors.has("province_id") ? <span className="mt-1 block text-xs text-red-700">{copy.fieldError}</span> : null}
          </label>
          <label className="text-sm font-bold">{copy.district}
            <select name="district_id" value={districtId || ""} onChange={(event) => setDistrictId(Number(event.target.value))} className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5">
              <option value="">{copy.select}</option>
              {visibleDistricts.map((district) => <option key={district.id} value={district.id}>{district.label}</option>)}
            </select>
            {errors.has("district_id") ? <span className="mt-1 block text-xs text-red-700">{copy.fieldError}</span> : null}
          </label>
        </fieldset>

        <label className="text-sm font-bold">{copy.contact}
          <input name="contact_phone" defaultValue={initial.normalizedPhone} inputMode="tel" autoComplete="tel" dir="ltr" className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2.5 text-left" />
          {errors.has("contact_phone") ? <span className="mt-1 block text-xs text-red-700">{copy.fieldError}</span> : null}
        </label>
        <label className="text-sm font-bold">{copy.originalLanguage}
          <select name="original_language" defaultValue={String(initial.payload.original_language ?? "fa")} className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5">
            <option value="en">{copy.english}</option><option value="fa">{copy.dari}</option><option value="ps">{copy.pashto}</option>
          </select>
        </label>
        <label className="text-sm font-bold">{copy.priceMode}
          <select name="price_mode" value={priceMode} onChange={(event) => setPriceMode(event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5">
            <option value="contact">{copy.contactPrice}</option><option value="fixed">{copy.fixed}</option><option value="negotiable">{copy.negotiable}</option>
          </select>
        </label>
        <label className="text-sm font-bold">{copy.amount}
          <input name="price_afn" type="number" min="1" step="1" disabled={priceMode === "contact"} defaultValue={initial.normalizedPriceAfn && initial.normalizedPriceAfn > 0 ? initial.normalizedPriceAfn : ""} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2.5 disabled:bg-[var(--surface-2)]" />
          {errors.has("price_afn") ? <span className="mt-1 block text-xs text-red-700">{copy.fieldError}</span> : null}
        </label>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {(["en", "fa", "ps"] as const).map((language) => {
          const values = language === "en" ? en : language === "fa" ? fa : ps;
          const languageLabel = language === "en" ? copy.english : language === "fa" ? copy.dari : copy.pashto;
          return (
            <fieldset key={language} className="rounded-xl border border-[var(--line)] p-4" dir={language === "en" ? "ltr" : "rtl"}>
              <legend className="px-2 text-sm font-bold">{languageLabel}</legend>
              <label className="text-sm font-bold">{copy.adTitle}
                <input name={`title_${language}`} defaultValue={String(values.title ?? "")} maxLength={120} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2.5" />
                {errors.has(`title_${language}`) ? <span className="mt-1 block text-xs text-red-700">{copy.fieldError}</span> : null}
              </label>
              <label className="mt-3 block text-sm font-bold">{copy.description}
                <textarea name={`description_${language}`} defaultValue={String(values.description ?? "")} minLength={20} maxLength={5000} rows={8} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2.5 leading-6" />
                {errors.has(`description_${language}`) ? <span className="mt-1 block text-xs text-red-700">{copy.fieldError}</span> : null}
              </label>
            </fieldset>
          );
        })}
      </div>

      <fieldset className="mt-5 rounded-xl border border-[var(--line)] p-4">
        <legend className="px-2 text-sm font-bold">{copy.categoryDetails}</legend>
        {schemaStatus === "loading" ? <p className="text-sm text-[var(--ink-2)]">{copy.loadingSchema}</p> : null}
        {schemaStatus === "error" ? <p className="text-sm font-semibold text-red-700">{copy.schemaError}</p> : null}
        {schema ? <div key={categoryNodeId} className="grid gap-3 sm:grid-cols-2">{schema.fields.filter((field) => field.active && field.posting).map(fieldInput)}</div> : null}
      </fieldset>

      {showVehicleDamage ? (
        <fieldset className="mt-5 rounded-xl border border-[var(--line)] p-4">
          <legend className="px-2 text-sm font-bold">{copy.bodyReport}</legend>
          <VehicleDamageDiagram value={damageParts} onChange={setDamageParts} locale={locale} />
          <input type="hidden" name="damage_parts_json" value={JSON.stringify(damageParts)} />
          {errors.has("damage_parts_json") ? <span className="mt-2 block text-xs text-red-700">{copy.fieldError}</span> : null}
        </fieldset>
      ) : null}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold">{copy.bodyNote}
          <textarea name="body_condition_note" defaultValue={String(vehicle.body_condition_note ?? "")} rows={3} maxLength={500} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2.5" />
        </label>
        <label className="text-sm font-bold">{copy.reviewNote}
          <textarea name="review_note" defaultValue={String(reviewNotes.note ?? "")} rows={3} maxLength={1000} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2.5" />
        </label>
      </div>

      {statusMessage ? <p role="status" className={`mt-4 rounded-xl px-3 py-2 text-sm font-semibold ${state.status === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>{statusMessage}</p> : null}
      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="submit" name="intent" value="save" disabled={pending} className="rounded-xl border border-[var(--line)] px-4 py-3 text-sm font-bold disabled:opacity-60">{pending ? copy.saving : copy.save}</button>
        <button type="submit" name="intent" value="ready" disabled={pending || schemaStatus !== "idle"} className="rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{pending ? copy.saving : copy.ready}</button>
      </div>
    </form>
  );
}
