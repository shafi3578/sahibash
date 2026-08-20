import type { AppLocale } from "@/lib/i18n/translations";

type ShareListing = {
  id: string;
  title?: string | null;
  price?: number | string | null;
  currency?: string | null;
  province?: string | null;
  district?: string | null;
};

const CHANNELS = new Set(["whatsapp", "telegram", "facebook", "copy_link", "generic"]);

export function normalizeShareChannel(channel: string | null | undefined) {
  return CHANNELS.has(String(channel)) ? String(channel) : "generic";
}

export function buildListingShareOutput(listing: ShareListing, locale: AppLocale, channel: string, baseUrl: string) {
  const safeChannel = normalizeShareChannel(channel);
  const url = new URL(`/listings/${listing.id}`, baseUrl);
  url.searchParams.set("utm_source", safeChannel);
  url.searchParams.set("utm_medium", "seller_share");
  url.searchParams.set("utm_campaign", "post_once_share_everywhere");

  const title = listing.title?.trim() || (locale === "en" ? "Sahibash listing" : locale === "fa" ? "اعلان صاحباش" : "د صاحباش اعلان");
  const place = [listing.province, listing.district].filter(Boolean).join(" / ");
  const price = listing.price ? `${listing.price} ${listing.currency ?? "AFN"}` : "";

  const lead =
    locale === "en"
      ? "I posted this on Sahibash:"
      : locale === "fa"
        ? "این اعلان را در صاحباش ثبت کردم:"
        : "دا اعلان مې په صاحباش کې ثبت کړی:";

  const parts = [lead, title, price, place, url.toString()].filter(Boolean);
  return {
    channel: safeChannel,
    shareUrl: url.toString(),
    shareText: parts.join("\n"),
  };
}
