import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { updateListingAction, uploadListingImageFormAction } from "@/lib/actions/listings";
import { getCategoryFieldsWithOptions } from "@/lib/data/queries";
import { CITIES, CURRENCIES } from "@/lib/constants/marketplace";

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

  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=${encodeURIComponent(`/listings/${listingId}/edit`)}`);

  const supabase = await createSupabaseServerClient();

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
          <p className="text-[var(--ink-2)]">Listing not found or unauthorized</p>
          <Link href="/dashboard/my-ads" className="mt-3 inline-block text-[var(--accent)] font-semibold">
            Back to My Listings
          </Link>
        </div>
      </main>
    );
  }

  // Fetch category fields
  const categoryFields = await getCategoryFieldsWithOptions(listing.category_node_id ?? listing.subcategory_id);

  // Build attributes map for quick lookup
  const attributesMap = new Map(
    ((listing.listing_attributes || []) as Array<{ key: string; value: string }>).map((attr) => [attr.key, attr.value])
  );

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">Edit Listing</h1>
        <p className="mt-1 text-[var(--ink-2)]">{listing.title}</p>
      </div>

      <form action={handleUpdateListing.bind(null, listingId)} className="space-y-6">
        {/* Category Info */}
        <div className="rounded-lg border border-[var(--line)] bg-white p-6">
          <h2 className="mb-4 font-display text-lg font-bold">Category</h2>
          <div className="rounded-lg bg-[var(--surface-2)] p-3">
            <div className="text-sm">
              <div className="font-semibold">{listing.category?.name}</div>
              <div className="text-xs text-[var(--ink-2)]">{listing.subcategory?.name}</div>
            </div>
          </div>
          <input type="hidden" name="category_id" value={listing.category_id} />
          <input type="hidden" name="category_node_id" value={listing.category_node_id ?? listing.subcategory_id} />
          <input type="hidden" name="subcategory_id" value={listing.subcategory_id} />
        </div>

        {/* Basic Info */}
        <div className="rounded-lg border border-[var(--line)] bg-white p-6">
          <h2 className="mb-4 font-display text-lg font-bold">Basic Information</h2>
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-[var(--ink-1)]">Title</label>
              <input
                type="text"
                name="title"
                defaultValue={listing.title}
                required
                minLength={5}
                maxLength={120}
                className="mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-[var(--ink-2)]">5-120 characters</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-[var(--ink-1)]">Description</label>
              <textarea
                name="description"
                defaultValue={listing.description}
                required
                minLength={20}
                maxLength={5000}
                rows={6}
                className="mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-[var(--ink-2)]">20-5000 characters</p>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="rounded-lg border border-[var(--line)] bg-white p-6">
          <h2 className="mb-4 font-display text-lg font-bold">Location</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* City */}
            <div>
              <label className="block text-sm font-semibold text-[var(--ink-1)]">City</label>
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
              <label className="block text-sm font-semibold text-[var(--ink-1)]">District (Optional)</label>
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
          <h2 className="mb-4 font-display text-lg font-bold">Pricing</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Price */}
            <div>
              <label className="block text-sm font-semibold text-[var(--ink-1)]">Price</label>
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
              <label className="block text-sm font-semibold text-[var(--ink-1)]">Currency</label>
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
          <h2 className="mb-4 font-display text-lg font-bold">Contact Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-[var(--ink-1)]">Contact Name (Optional)</label>
              <input
                type="text"
                name="contact_name"
                defaultValue={listing.contact_name || ""}
                maxLength={80}
                className="mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-sm"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-[var(--ink-1)]">Phone</label>
              <input
                type="tel"
                name="contact_phone"
                defaultValue={listing.contact_phone}
                required
                minLength={7}
                maxLength={20}
                className="mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Fields by Category */}
        {categoryFields.length > 0 && (
          <div className="rounded-lg border border-[var(--line)] bg-white p-6">
            <h2 className="mb-4 font-display text-lg font-bold">Additional Details</h2>
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
                      <option value="">Select {field.field_label}</option>
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
        )}

        {/* Photos */}
        <div className="rounded-lg border border-[var(--line)] bg-white p-6">
          <h2 className="mb-4 font-display text-lg font-bold">Photos</h2>

          {/* Existing Images */}
          {listing.listing_images?.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-sm font-semibold">Current Photos</p>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {((listing.listing_images || []) as Array<{ id: string; image_url?: string; public_url?: string; is_primary: boolean }>).map((image) => (
                  <div key={image.id} className="relative aspect-square overflow-hidden rounded-lg border border-[var(--line)]">
                    <Image
                      src={image.image_url || image.public_url || "/placeholder.jpg"}
                      alt="Listing"
                      fill
                      className="object-cover"
                    />
                    {image.is_primary && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <span className="text-xs font-bold text-white">PRIMARY</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload New */}
          <div>
            <p className="mb-2 text-sm font-semibold">Upload New Photos</p>
            <form action={uploadListingImageFormAction}>
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
                className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Upload
              </button>
            </form>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 rounded-lg bg-[var(--accent)] px-4 py-3 font-semibold text-white hover:opacity-90"
          >
            Save Changes
          </button>
          <Link
            href={`/listings/${listingId}/manage`}
            className="flex-1 rounded-lg border border-[var(--line)] px-4 py-3 text-center font-semibold hover:bg-[var(--surface-2)]"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
