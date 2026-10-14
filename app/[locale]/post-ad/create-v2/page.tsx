import { redirect } from "next/navigation";
import { getCurrentLocale } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routing";

export default async function LegacyLocalizedPostAdV2Page() {
  const locale = await getCurrentLocale();
  redirect(localizePath("/post-ad/create", locale));
}
