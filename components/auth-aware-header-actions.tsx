"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AppLocale } from "@/lib/i18n/translations";
import { localizePath } from "@/lib/i18n/routing";
import { buildLoginRedirectHref } from "@/lib/account/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type HeaderLabels = {
  postAd: string;
  myProfile: string;
  login: string;
  register: string;
  logout: string;
};

function HeaderIcon({ name }: { name: "bell" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {name === "bell" ? <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></> : null}
    </svg>
  );
}

function useAuthStatus(initialAuthenticated = false) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);

  useEffect(() => {
    let mounted = true;
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setAuthenticated(Boolean(data.session?.user));
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(Boolean(session?.user));
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return authenticated;
}

export function AuthAwareNotificationLink({
  locale,
  label,
}: {
  locale: AppLocale;
  label: string;
}) {
  const authenticated = useAuthStatus(false);
  const href = authenticated
    ? localizePath("/dashboard/messages", locale)
    : buildLoginRedirectHref({ targetPath: "/dashboard/messages", locale });

  return (
    <Link href={href} aria-label={label} className="grid h-10 w-10 place-items-center rounded-full bg-white/80 text-[var(--ink-1)] lg:hidden">
      <HeaderIcon name="bell" />
    </Link>
  );
}

export function AuthAwareHeaderLinks({
  locale,
  labels,
}: {
  locale: AppLocale;
  labels: HeaderLabels;
}) {
  const authenticated = useAuthStatus(false);
  const router = useRouter();
  const postAdCreatePath = "/post-ad/create?posting=sell";
  const postAdHref = authenticated
    ? localizePath(postAdCreatePath, locale)
    : buildLoginRedirectHref({ targetPath: postAdCreatePath, locale, reason: "post" });

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push(localizePath("/", locale));
  }

  return (
    <>
      <Link href={postAdHref} className="hidden whitespace-nowrap rounded-full bg-[var(--accent)] px-3 py-2 text-xs font-semibold leading-none text-white lg:inline-flex lg:text-sm">
        {labels.postAd}
      </Link>
      {authenticated ? (
        <>
          <Link href={localizePath("/dashboard", locale)} className="hidden min-w-0 whitespace-nowrap rounded-full border border-black/20 bg-white px-3 py-2 text-xs font-semibold leading-none sm:text-sm lg:inline-flex">
            {labels.myProfile}
          </Link>
          <button type="button" onClick={signOut} className="hidden min-w-0 whitespace-nowrap rounded-full border border-black/20 bg-white px-3 py-2 text-xs font-semibold leading-none sm:text-sm lg:inline-flex">
            {labels.logout}
          </button>
        </>
      ) : (
        <>
          <Link href={localizePath("/login", locale)} className="hidden min-w-0 whitespace-nowrap rounded-full border border-black/20 bg-white px-3 py-2 text-xs font-semibold leading-none sm:text-sm lg:inline-flex">
            {labels.login}
          </Link>
          <Link href={localizePath("/register", locale)} className="hidden min-w-0 whitespace-nowrap rounded-full border border-black/20 bg-white px-3 py-2 text-xs font-semibold leading-none sm:text-sm lg:inline-flex">
            {labels.register}
          </Link>
        </>
      )}
    </>
  );
}
