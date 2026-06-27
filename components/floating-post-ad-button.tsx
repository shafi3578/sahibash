"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AppLocale } from "@/lib/i18n/translations";
import { localizePath } from "@/lib/i18n/routing";

type Props = {
  locale: AppLocale;
  label: string;
  href: string;
};

const HIDDEN_PATH_SEGMENTS = ["/post-ad", "/login", "/register", "/dashboard", "/admin"];

export function FloatingPostAdButton({ locale, label, href }: Props) {
  const pathname = usePathname();
  const localizedHiddenPaths = HIDDEN_PATH_SEGMENTS.map((segment) => localizePath(segment, locale));
  const shouldHide = localizedHiddenPaths.some((hiddenPath) => pathname === hiddenPath || pathname.startsWith(`${hiddenPath}/`));

  if (shouldHide) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 px-4 lg:hidden">
      <div className="mx-auto flex max-w-7xl justify-center">
        <Link
          href={href}
          className="pointer-events-auto inline-flex min-h-12 w-full max-w-sm items-center justify-center whitespace-nowrap rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-16px_rgba(0,0,0,0.75)]"
        >
          {label}
        </Link>
      </div>
    </div>
  );
}