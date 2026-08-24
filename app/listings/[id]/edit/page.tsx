import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { updateListingAction, uploadListingImageFormAction } from "@/lib/actions/listings";
import { getCategoryFieldsWithOptions } from "@/lib/data/queries";
import { CITIES, CURRENCIES } from "@/lib/constants/marketplace";
import { getCurrentLocale } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routing";
import { getUiTranslations } from "@/lib/i18n/ui";
import {
  getSimpleCategoryConfig,
  getSimpleCategoryKind,
  getSimpleCategoryModelOptions,
  labelFor,
  optionLabel,
} from "@/lib/posting/simple-category-details";

function maskSellerPhone(phone: string) {
  const compact = phone.replace(/\s+/g, "");
  if (compact.length <= 7) return compact;
  return `${compact.slice(0, 5)}••••${compact.slice(-2)}`;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

async function handleUpdateListing(listingId: string, formData: FormData) {
  "use server";
  const result = await updateListingAction(listingId, formData);
  if (result.ok) {
    redirect(`/listings/${listingId}/manage`);
  }
}

export default async function EditListingPage({ params }: PageProps) {
  const { id: listingId } = await params;
  const locale = await getCurrentLocale();
  const ui = getUiTranslations(locale);

  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=${encodeURIComponent(`/listings/${listingId}/edit`)}`);

  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? createSupabaseAdmin() : await createSupabaseServerClient();

  // Fetch listing with relations
  const { data: listing, error } = await supabase
    .from("listings")
    .select(
      `
      *,
      category:category_id(*),
      subcategory:subcategory_id(*),
      listing_images(*),
      listing_attributes(*)
    `
    )
    .eq("id", listingId)
    .single();

  if (error || !listing || listing.user_id !== user.id) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-[var(--line)] bg-white p-6 text-center">
          <p className="text-[var(--ink-2)]">{ui.listingEdit.notFoundOrUnauthorized}</p>
          <Link href="/dashboard/my-ads" className="mt-3 inline-block text-[var(--accent)] font-semibold">
            {ui.listingEdit.backToMyListings}
          </Link>
        </div>
      </main>
    );
  }

  // Fetch category fields
  const categoryFields = await getCategoryFieldsWithOptions(listing.category_node_id ?? listing.subcategory_id);
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .maybeSingle();
  const sellerContactName = String(profile?.full_name ?? listing.contact_name ?? "").trim();
  const sellerContactPhone = String(profile?.phone ?? listing.contact_phone ?? "").trim();
  const profileContactCopy = locale === "fa"
    ? {
        note: "نام و شماره تماس از پروفایل شما گرفته می‌شود. برای تغییر آن به تنظیمات حساب بروید.",
        missing: "نام یا شماره موبایل پروفایل شما کامل نیست.",
        edit: "ویرایش در تنظیمات",
      }
    : locale === "ps"
      ? {
          note: "نوم او اړیکې شمېره ستاسو له پروفایل څخه اخیستل کېږي. د بدلون لپاره د حساب تنظیماتو ته لاړ شئ.",
          missing: "ستاسو د پروفایل نوم یا موبایل شمېره نیمګړې ده.",
          edit: "په تنظیماتو کې سمون",
        }
      : {
          note: "Name and phone come from your profile. Change them in Account Settings.",
          missing: "Your profile name or mobile phone is missing.",
          edit: "Edit in Settings",
        };

  const simpleCategoryKind = getSimpleCategoryKind(
    [listing.category?.slug, listing.subcategory?.slug].filter(Boolean).join("/"),
    listing.category?.slug ?? null
  );
  const simpleCategoryConfig = getSimpleCategoryConfig(simpleCategoryKind);

  const attributesMap = new Map(
    ((listing.listing_attributes || []) as Array<Record<string, unknown>>).map((attr) => [
      String(attr.attribute_key ?? attr.key ?? ""),
      String(attr.attribute_value_text ?? attr.attribute_value_number ?? attr.attribute_value_boolean ?? attr.value ?? ""),
    ])
  );
  const simpleArrayValue = (key: string) => {
    const raw = String(attributesMap.get(key) ?? "");
    if (!raw.trim()) return [] as string[];
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? parsed.map((value) => String(value)) : [];
    } catch {
      return raw.split(",").map((item) => item.trim()).filter(Boolean);
    }
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">{ui.listingEdit.editListing}</h1>
        <p className="mt-1 text-[var(--ink-2)]">{listing.title}</p>
      </div>

      <form action={handleUpdateListing.bind(null, listingId)} className="space-y-6">
        {/* Category Info */}
        <div className="rounded-lg border border-[var(--line)] bg-white p-6">
          <h2 className="mb-4 font-display text-lg font-bold">{ui.listingEdit.category}</h2>
          <div className="rounded-lg bg-[var(--surface-2)] p-3">
            <div className="text-sm">
              <div className="font-semibold">{listing.category?.name}</div>
              <div className="text-xs text-[var(--ink-2)]">{listing.subcategory?.name}</div>
            </div>
          </div>
          <input type="hidden" name="category_id" value={listing.category_id} />
          <input type="hidden" name="category_node_id" value={listing.category_node_id ?? listing.subcategory_id} />
          <input type="hidden" name="subcategory_id" value={listing.subcategory_id} />
          <input type="hidden" name="province" value={listing.province ?? ""} />
          <input type="hidden" name="province_id" value={listing.province_id ?? ""} />
          <input type="hidden" name="district_id" value={listing.district_id ?? ""} />
          <input type="hidden" name="area_text" value={listing.address_text ?? listing.address_optional ?? ""} />
          <input type="hidden" name="location_source" value={listing.location_source ?? "manual"} />
          <input type="hidden" name="location_visibility" value={listing.location_visibility ?? "hidden"} />
          <input type="hidden" name="is_location_confirmed" value={listing.is_location_confirmed ? "true" : "false"} />
          {listing.latitude ? <input type="hidden" name="latitude" value={String(listing.latitude)} /> : null}
          {listing.longitude ? <input type="hidden" name="longitude" value={String(listing.longitude)} /> : null}
          {listing.location_accuracy ? <input type="hidden" name="location_accuracy" value={String(listing.location_accuracy)} /> : null}
        </div>

        {/* Basic Info */}
        <div className="rounded-lg border border-[var(--line)] bg-white p-6">
          <h2 className="mb-4 font-display text-lg font-bold">{ui.listingEdit.basicInformation}</h2>
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-[var(--ink-1)]">{ui.listingEdit.title}</label>
              <input
                type="text"
                name="title"
                defaultValue={listing.title}
                required
                minLength={5}
                maxLength={120}
                className="mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-[var(--ink-2)]">{ui.listingEdit.titleHint}</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-[var(--ink-1)]">{ui.listingEdit.description}</label>
              <textarea
                name="description"
                defaultValue={listing.description}
                required
                minLength={20}
                maxLength={5000}
                rows={6}
                className="mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-[var(--ink-2)]">{ui.listingEdit.descriptionHint}</p>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="rounded-lg border border-[var(--line)] bg-white p-6">
          <h2 className="mb-4 font-display text-lg font-bold">{ui.listingEdit.location}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* City */}
            <div>
              <label className="block text-sm font-semibold text-[var(--ink-1)]">{ui.listingEdit.city}</label>
              <select
                name="city"
                defaultValue={listing.city}
                required
                className="mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-sm"
              >
                {CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* District */}
            <div>
              <label className="block text-sm font-semibold text-[var(--ink-1)]">{ui.listingEdit.districtOptional}</label>
              <input
                type="text"
                name="district"
                defaultValue={listing.district || ""}
                maxLength={80}
                className="mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="rounded-lg border border-[var(--line)] bg-white p-6">
          <h2 className="mb-4 font-display text-lg font-bold">{ui.listingEdit.pricing}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Price */}
            <div>
              <label className="block text-sm font-semibold text-[var(--ink-1)]">{ui.listingEdit.price}</label>
              <input
                type="number"
                name="price"
                defaultValue={listing.price}
                required
                min="1"
                step="1"
                className="mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-sm"
              />
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-semibold text-[var(--ink-1)]">{ui.listingEdit.currency}</label>
              <select
                name="currency"
                defaultValue={listing.currency}
                required
                className="mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-sm"
              >
                {CURRENCIES.map((curr) => (
                  <option key={curr} value={curr}>
                    {curr}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="rounded-lg border border-[var(--line)] bg-white p-6">
          <h2 className="mb-4 font-display text-lg font-bold">{ui.listingEdit.contactInformation}</h2>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-bold text-emerald-950">
                  {sellerContactName || profileContactCopy.missing}
                  {sellerContactPhone ? ` • ${maskSellerPhone(sellerContactPhone)}` : ""}
                </p>
                <p className="mt-1 text-emerald-900">{profileContactCopy.note}</p>
              </div>
              <Link href={localizePath("/dashboard/settings/account", locale)} className="inline-flex rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-emerald-800">
                {profileContactCopy.edit}
              </Link>
            </div>
            <input type="hidden" name="contact_name" value={sellerContactName} />
            <input type="hidden" name="contact_phone" value={sellerContactPhone} />
          </div>
        </div>

        {/* Dynamic Fields by Category */}
        {simpleCategoryConfig ? (
          <div className="rounded-lg border border-[var(--line)] bg-white p-6">
            <h2 className="mb-4 font-display text-lg font-bold">{labelFor(locale, simpleCategoryConfig.title)}</h2>
            <div className="space-y-4">
              {simpleCategoryConfig.fields.map((field) => {
                const currentValue = attributesMap.get(field.key) || "";
                const customKey = `${field.key}Custom`;
                const storedCustomValue = attributesMap.get(customKey) || "";
                if (field.key === "model" && (simpleCategoryKind === "car" || simpleCategoryKind === "motorcycle")) {
                  const makeValue = String(attributesMap.get("make") || "");
                  const modelOptions = getSimpleCategoryModelOptions(simpleCategoryKind, makeValue);
                  if (modelOptions.length === 0 || makeValue === "Other") {
                    return (
                      <div key={field.key}>
                        <label className="block text-sm font-semibold text-[var(--ink-1)]">{labelFor(locale, field.label)}</label>
                        <input
                          type="text"
                          name={field.key}
                          defaultValue={currentValue}
                          required={field.required}
                          className="mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-sm"
                        />
                      </div>
                    );
                  }

                  return (
                    <div key={field.key}>
                      <label className="block text-sm font-semibold text-[var(--ink-1)]">{labelFor(locale, field.label)}</label>
                      <select
                        name={field.key}
                        defaultValue={storedCustomValue ? "Other" : currentValue}
                        required={field.required}
                        className="mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-sm"
                      >
                        <option value="">{ui.listingEdit.selectField.replace("{field}", labelFor(locale, field.label))}</option>
                        {modelOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                        <option value="Other">{ui.listingEdit.other}</option>
                      </select>
                      {field.allowCustom ? (
                        <input
                          type="text"
                          name={customKey}
                          defaultValue={storedCustomValue}
                          placeholder="If Other, specify"
                          className="mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-sm"
                        />
                      ) : null}
                    </div>
                  );
                }

                if (field.type === "multiselect") {
                  const selected = new Set(simpleArrayValue(field.key));
                  return (
                    <div key={field.key}>
                      <label className="block text-sm font-semibold text-[var(--ink-1)]">{labelFor(locale, field.label)}</label>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {(field.options ?? []).map((option) => (
                          <label key={option.value} className="flex items-center gap-2 rounded-lg border border-[var(--line)] px-3 py-2 text-sm">
                            <input
                              type="checkbox"
                              name={field.key}
                              value={option.value}
                              defaultChecked={selected.has(option.value)}
                              className="rounded"
                            />
                            {optionLabel(locale, option)}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                }

                if (field.type === "textarea") {
                  return (
                    <div key={field.key}>
                      <label className="block text-sm font-semibold text-[var(--ink-1)]">{labelFor(locale, field.label)}</label>
                      <textarea
                        name={field.key}
                        defaultValue={currentValue}
                        rows={5}
                        className="mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-sm"
                      />
                    </div>
                  );
                }

                if (field.type === "select") {
                  const optionValues = new Set((field.options ?? []).map((option) => option.value));
                  const selectValue = field.allowCustom
                    ? storedCustomValue
                      ? "Other"
                      : optionValues.has(String(currentValue))
                        ? currentValue
                        : ""
                    : currentValue;
                  return (
                    <div key={field.key}>
                      <label className="block text-sm font-semibold text-[var(--ink-1)]">{labelFor(locale, field.label)}</label>
                      <select
                        name={field.key}
                        defaultValue={selectValue}
                        required={field.required}
                        className="mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-sm"
                      >
                        <option value="">{ui.listingEdit.selectField.replace("{field}", labelFor(locale, field.label))}</option>
                        {(field.options ?? []).map((option) => (
                          <option key={option.value} value={option.value}>{optionLabel(locale, option)}</option>
                        ))}
                        {field.allowCustom ? <option value="Other">{ui.listingEdit.other}</option> : null}
                      </select>
                      {field.allowCustom ? (
                        <input
                          type="text"
                          name={customKey}
                          defaultValue={storedCustomValue}
                          placeholder="If Other, specify"
                          className="mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-sm"
                        />
                      ) : null}
                    </div>
                  );
                }

                return (
                  <div key={field.key}>
                    <label className="block text-sm font-semibold text-[var(--ink-1)]">{labelFor(locale, field.label)}</label>
                    <input
                      type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                      name={field.key}
                      defaultValue={currentValue}
                      required={field.required}
                      min={field.min}
                      max={field.max}
                      step="1"
                      className="mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-sm"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : categoryFields.length > 0 ? (
          <div className="rounded-lg border border-[var(--line)] bg-white p-6">
            <h2 className="mb-4 font-display text-lg font-bold">{ui.listingEdit.additionalDetails}</h2>
            <div className="space-y-4">
              {categoryFields.map((field) => (
                <div key={field.id}>
                  <label className="block text-sm font-semibold text-[var(--ink-1)]">
                    {field.field_label}
                    {field.is_required && <span className="text-red-600">*</span>}
                  </label>

                  {field.field_type === "text" && (
                    <input
                      type="text"
                      name={field.field_key}
                      defaultValue={attributesMap.get(field.field_key) || ""}
                      required={field.is_required}
                      className="mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-sm"
                    />
                  )}

                  {field.field_type === "number" && (
                    <input
                      type="number"
                      name={field.field_key}
                      defaultValue={attributesMap.get(field.field_key) || ""}
                      required={field.is_required}
                      step="1"
                      className="mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-sm"
                    />
                  )}

                  {field.field_type === "select" && (
                    <select
                      name={field.field_key}
                      defaultValue={attributesMap.get(field.field_key) || ""}
                      required={field.is_required}
                      className="mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-sm"
                    >
                      <option value="">{ui.listingEdit.selectField.replace("{field}", field.field_label)}</option>
                      {((field as unknown) as { options: Array<{ id: string; option_value: string }> }).options?.map((opt) => (
                        <option key={opt.id} value={opt.option_value}>
                          {opt.option_value}
                        </option>
                      ))}
                    </select>
                  )}

                  {field.field_type === "boolean" && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        name={field.field_key}
                        value="true"
                        defaultChecked={attributesMap.get(field.field_key) === "true"}
                        className="rounded"
                      />
                      <label className="text-sm">{field.field_label}</label>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Photos */}
        <div className="rounded-lg border border-[var(--line)] bg-white p-6">
          <h2 className="mb-4 font-display text-lg font-bold">{ui.listingEdit.photos}</h2>

          {/* Existing Images */}
          {listing.listing_images?.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-sm font-semibold">{ui.listingEdit.currentPhotos}</p>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {((listing.listing_images || []) as Array<{ id: string; image_url?: string; public_url?: string; is_primary: boolean }>).map((image) => (
                  <div key={image.id} className="relative aspect-square overflow-hidden rounded-lg border border-[var(--line)]">
                    <Image
                      src={image.image_url || image.public_url || "/placeholder.jpg"}
                      alt={ui.listingEdit.listingImageAlt}
                      fill
                      className="object-cover"
                    />
                    {image.is_primary && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <span className="text-xs font-bold text-white">{ui.listingEdit.primary}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload New */}
          <div>
            <p className="mb-2 text-sm font-semibold">{ui.listingEdit.uploadNewPhotos}</p>
            <input type="hidden" name="listing_id" value={listingId} />
            <input
              type="file"
              name="image"
              accept="image/*"
              multiple
              className="block w-full rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-sm"
            />
            <button
              type="submit"
              formAction={uploadListingImageFormAction}
              className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {ui.listingEdit.upload}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 rounded-lg bg-[var(--accent)] px-4 py-3 font-semibold text-white hover:opacity-90"
          >
            {ui.listingEdit.saveChanges}
          </button>
          <Link
            href={`/listings/${listingId}/manage`}
            className="flex-1 rounded-lg border border-[var(--line)] px-4 py-3 text-center font-semibold hover:bg-[var(--surface-2)]"
          >
            {ui.listingEdit.cancel}
          </Link>
        </div>
      </form>
    </main>
  );
}
