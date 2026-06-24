import { requireUser } from "@/lib/auth";
import ElectronicsPostAdForm from "./post-ad-electronics-form";
import { getElectronicsSubcategories } from "@/lib/data/electronics";

export default async function ElectronicsPostAdPage() {
  await requireUser();
  const subcategories = await getElectronicsSubcategories();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold">Post Electronics Ad</h1>
      <ElectronicsPostAdForm subcategories={subcategories} />
    </main>
  );
}
