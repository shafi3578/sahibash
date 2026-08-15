import ElectronicsPostAdForm from "./post-ad-electronics-form";
import { getElectronicsSubcategories } from "@/lib/data/electronics";
import { getDictionary } from "@/lib/i18n/server";
import { ELECTRONICS_LEAVES, type Lang } from "@/data/electronics-categories";

export default async function ElectronicsPostAdPage() {
  const [subcategories, { t, locale }] = await Promise.all([
    getElectronicsSubcategories(),
    getDictionary(),
  ]);

  const resolvedSubcategories = ELECTRONICS_LEAVES.map((leaf, index) => {
    const match = subcategories.find((item) => item.slug === leaf.slug || item.slug === leaf.id);
    return {
      id: match?.id ?? (1000 + index), // Unique numeric ID for each leaf
      name: match?.name ?? leaf.labels[locale as Lang],
      slug: leaf.slug,
      category_node_id: match?.category_node_id ?? null,
    };
  }).filter((item) => item.name);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold">Post Electronics Ad</h1>
      <ElectronicsPostAdForm subcategories={resolvedSubcategories} t={t} locale={locale} />
    </main>
  );
}
