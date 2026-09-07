import HomePage from "@/app/page";

export default async function LocaleRootPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <HomePage searchParams={searchParams} />;
}
