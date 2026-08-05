import { redirect } from "next/navigation";
import type { AppLocale } from "@/lib/i18n/translations";

type PageProps = { params: Promise<{ locale: AppLocale }> };

export default async function LegacyLocalizedPostAdCreatePage({ params }: PageProps) {
  const { locale } = await params;
  redirect(`/${locale}/post-ad/create`);
}
