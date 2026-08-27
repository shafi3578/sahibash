export function notificationDestination(payload: unknown) {
  const value = payload && typeof payload === "object" && !Array.isArray(payload)
    ? payload as Record<string, unknown>
    : {};

  if (typeof value.listing_id === "string" && typeof value.sender_user_id === "string") {
    return `/dashboard/messages?listing=${encodeURIComponent(value.listing_id)}&participant=${encodeURIComponent(value.sender_user_id)}`;
  }
  if (typeof value.offer_id === "string") return "/dashboard/offers";
  if (typeof value.follower_user_id === "string") {
    return `/sellers/${encodeURIComponent(value.follower_user_id)}`;
  }
  if (typeof value.listing_id === "string") {
    return `/listings/${encodeURIComponent(value.listing_id)}`;
  }
  return "/dashboard/notifications";
}
