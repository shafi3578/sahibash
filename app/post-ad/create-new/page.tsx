import { NewPostingForm } from "@/components/posting/NewPostingForm";
import type { AppLocale } from "@/lib/i18n/translations";

type PageProps = {
  params: Promise<{ locale: AppLocale }>;
};

export const metadata = {
  title: "Post a New Ad",
  description: "Create a new listing on Sahibash",
};

export default async function CreateNewPage({ params }: PageProps) {
  const { locale } = await params;

  return (
    <main className="min-h-screen bg-gray-50">
      <NewPostingForm locale={locale} />
    </main>
  );
}
