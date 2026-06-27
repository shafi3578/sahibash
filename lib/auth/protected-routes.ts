const PROTECTED_PREFIXES = [
  "/post-ad",
  "/dashboard/my-listings",
  "/dashboard/my-ads",
  "/listings/create",
  "/listings/edit",
];

const PROTECTED_CONTAINS = ["/edit", "/manage"];

export function isProtectedPostingPath(pathname: string): boolean {
  const path = String(pathname || "/");

  if (PROTECTED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    return true;
  }

  if (path.startsWith("/listings/") && PROTECTED_CONTAINS.some((segment) => path.includes(segment))) {
    return true;
  }

  return false;
}

export function isPostAdPath(pathname: string): boolean {
  const path = String(pathname || "/");
  return path === "/post-ad" || path.startsWith("/post-ad/");
}
