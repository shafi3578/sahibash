import { getPostingRootCategories } from "@/lib/data/queries";
import PostAdForm from "./post-ad-form";
import { requireUser } from "@/lib/auth";

export default async function PostAdPage() {
  await requireUser();
  const categories = await getPostingRootCategories();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold">Post an Ad</h1>
      <PostAdForm categories={categories} />
    </main>
  );
}
