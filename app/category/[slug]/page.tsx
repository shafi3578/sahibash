import { notFound } from "next/navigation";
import { getApprovedListings, getCategories } from "@/lib/data/queries";
import { ListingCard } from "@/components/listing-card";
import { getDictionary } from "@/lib/i18n/server";
import { localizeCategoryName } from "@/lib/i18n/category-labels";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { locale } = await getDictionary();
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);

  if (!category) notFound();

  const listings = await getApprovedListings({ categoryId: category.id, locale });
  const localizedCategoryName = localizeCategoryName({
    locale,
    fallbackName: category.name,
    slug: category.slug,
  });

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold">{localizedCategoryName}</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </main>
  );
}
