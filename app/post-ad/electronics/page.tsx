import ElectronicsPostAdForm from "./post-ad-electronics-form";
import { getElectronicsSubcategories } from "@/lib/data/electronics";
import { getDictionary } from "@/lib/i18n/server";

export default async function ElectronicsPostAdPage() {
  const [subcategories, { t }] = await Promise.all([
    getElectronicsSubcategories(),
    getDictionary(),
  ]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold">Post Electronics Ad</h1>
      <ElectronicsPostAdForm subcategories={subcategories} t={t} />
    </main>
  );
}
