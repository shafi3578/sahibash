import type { ComponentType } from "react";
import { notFound } from "next/navigation";
import HomePage from "@/app/page";
import LoginPage from "@/app/login/page";
import RegisterPage from "@/app/register/page";
import ResetPasswordPage from "@/app/reset-password/page";
import SearchPage from "@/app/search/page";
import FeaturedPage from "@/app/featured/page";
import PostAdPage from "@/app/post-ad/page";
import PostAdCreatePage from "@/app/post-ad/create/page";
import PostAdCreateNewPage from "@/app/post-ad/create-new/page";
import PostAdCreateV2Page from "@/app/post-ad/create-v2/page";
import PostAdElectronicsPage from "@/app/post-ad/electronics/page";
import CategoriesPage from "@/app/categories/page";
import CategoryPage from "@/app/categories/[slug]/page";
import ListingsPage from "@/app/listings/page";
import ListingsCreatePage from "@/app/listings/create/page";
import ListingsEditPage from "@/app/listings/edit/page";
import ListingPage from "@/app/listings/[id]/page";
import ListingEditPage from "@/app/listings/[id]/edit/page";
import ListingManagePage from "@/app/listings/[id]/manage/page";
import ListingPriceHistoryPage from "@/app/listings/[id]/price-history/page";
import DashboardPage from "@/app/dashboard/page";
import DashboardAccountInformationPage from "@/app/dashboard/account-information/page";
import DashboardAccountSecurityPage from "@/app/dashboard/account-security/page";
import DashboardFavoritesPage from "@/app/dashboard/favorites/page";
import DashboardFavoriteSearchesPage from "@/app/dashboard/favorite-searches/page";
import DashboardHelpPage from "@/app/dashboard/help/page";
import DashboardMessagesPage from "@/app/dashboard/messages/page";
import DashboardMyAdsPage from "@/app/dashboard/my-ads/page";
import DashboardMyListingsPage from "@/app/dashboard/my-listings/page";
import DashboardOffersPage from "@/app/dashboard/offers/page";
import DashboardPrivacyPage from "@/app/dashboard/privacy/page";
import DashboardQuestionsPage from "@/app/dashboard/questions/page";
import DashboardSettingsPage from "@/app/dashboard/settings/page";
import DashboardSafetyPage from "@/app/dashboard/safety/page";
import DashboardSettingsAccountPage from "@/app/dashboard/settings/account/page";
import DashboardSettingsLanguagePage from "@/app/dashboard/settings/language/page";
import DashboardSettingsNotificationsPage from "@/app/dashboard/settings/notifications/page";
import FavoritesPage from "@/app/favorites/page";
import MyAdsPage from "@/app/my-ads/page";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getPublishedStaticPageBySlug } from "@/lib/data/static-pages";
import type { AppLocale } from "@/lib/i18n/translations";
import { buildLocalizedMetadata } from "@/lib/i18n/metadata";
import { PublicInfoPage } from "@/components/public-info-page";

export async function generateMetadata({ params }: { params: Promise<{ locale: AppLocale; slug?: string[] }> }) {
  const { locale, slug } = await params;
  return buildLocalizedMetadata(locale, slug);
}

// Adapt the locale catch-all props to the concrete page contracts. Next.js
// validates each concrete page separately during the build.
const renderPage = (Page: unknown, props: Record<string, unknown> = {}) => {
  const RoutedPage = Page as ComponentType<Record<string, unknown>>;
  return <RoutedPage {...props} />;
};

export default async function LocaleCatchAllPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const slug = resolvedParams.slug ?? [];
  const [first, second, third] = slug;

  if (slug.length === 0) {
    return renderPage(HomePage, { searchParams });
  }

  if (first === "login" && slug.length === 1) {
    return renderPage(LoginPage, { searchParams });
  }

  if (first === "register" && slug.length === 1) {
    return renderPage(RegisterPage, { searchParams });
  }

  if (first === "reset-password" && slug.length === 1) {
    return renderPage(ResetPasswordPage);
  }

  if (first === "search" && slug.length === 1) {
    return renderPage(SearchPage, { searchParams });
  }

  if (first === "featured" && slug.length === 1) {
    return renderPage(FeaturedPage);
  }

  if (first === "post-ad") {
    if (slug.length === 1) {
      return renderPage(PostAdPage);
    }
    if (second === "create") {
      return renderPage(PostAdCreatePage, { searchParams });
    }
    if (second === "create-new") {
      const locale = await getCurrentLocale();
      return renderPage(PostAdCreateNewPage, { params: Promise.resolve({ locale }) });
    }
    if (second === "create-v2") {
      return renderPage(PostAdCreateV2Page);
    }
    if (second === "electronics") {
      return renderPage(PostAdElectronicsPage);
    }
  }

  if (first === "categories") {
    if (slug.length === 1) {
      return renderPage(CategoriesPage);
    }
    if (slug.length === 2) {
      return renderPage(CategoryPage, { params: Promise.resolve({ slug: second }), searchParams });
    }
  }

  if (first === "category" && slug.length === 2) {
    return renderPage(CategoryPage, { params: Promise.resolve({ slug: second }), searchParams });
  }

  if (first === "listings") {
    if (slug.length === 1) {
      return renderPage(ListingsPage, { searchParams });
    }
    if (slug.length === 2) {
      if (second === "create") {
        return renderPage(ListingsCreatePage, { searchParams });
      }
      if (second === "edit") {
        return renderPage(ListingsEditPage, { searchParams });
      }
      return renderPage(ListingPage, { params: Promise.resolve({ id: second }), searchParams });
    }
    if (slug.length === 3) {
      if (third === "edit") {
        return renderPage(ListingEditPage, { params: Promise.resolve({ id: second }), searchParams });
      }
      if (third === "manage") {
        return renderPage(ListingManagePage, { params: Promise.resolve({ id: second }) });
      }
      if (third === "price-history") {
        return renderPage(ListingPriceHistoryPage, { params: Promise.resolve({ id: second }) });
      }
    }
  }

  if (first === "dashboard") {
    if (slug.length === 1) {
      return renderPage(DashboardPage, { searchParams: resolvedSearchParams });
    }
    if (slug.length === 2) {
      switch (second) {
        case "account-information":
          return renderPage(DashboardAccountInformationPage, { searchParams: resolvedSearchParams });
        case "account-security":
          return renderPage(DashboardAccountSecurityPage, { searchParams: resolvedSearchParams });
        case "favorites":
          return renderPage(DashboardFavoritesPage, { searchParams: resolvedSearchParams });
        case "favorite-searches":
          return renderPage(DashboardFavoriteSearchesPage, { searchParams: resolvedSearchParams });
        case "help":
          return renderPage(DashboardHelpPage, { searchParams: resolvedSearchParams });
        case "messages":
          return renderPage(DashboardMessagesPage, { searchParams: resolvedSearchParams });
        case "my-ads":
          return renderPage(DashboardMyAdsPage, { searchParams: resolvedSearchParams });
        case "my-listings":
          return renderPage(DashboardMyListingsPage, { searchParams: resolvedSearchParams });
        case "offers":
          return renderPage(DashboardOffersPage, { searchParams: resolvedSearchParams });
        case "privacy":
          return renderPage(DashboardPrivacyPage, { searchParams: resolvedSearchParams });
        case "questions":
          return renderPage(DashboardQuestionsPage, { searchParams: resolvedSearchParams });
        case "safety":
          return renderPage(DashboardSafetyPage, { searchParams: resolvedSearchParams });
        case "settings":
          return renderPage(DashboardSettingsPage, { searchParams: resolvedSearchParams });
      }
    }
    if (slug.length === 3 && second === "settings") {
      switch (third) {
        case "account":
          return renderPage(DashboardSettingsAccountPage, { searchParams: resolvedSearchParams });
        case "language":
          return renderPage(DashboardSettingsLanguagePage, { searchParams: resolvedSearchParams });
        case "notifications":
          return renderPage(DashboardSettingsNotificationsPage, { searchParams: resolvedSearchParams });
      }
    }
  }

  if (first === "favorites" && slug.length === 1) {
    return renderPage(FavoritesPage, { searchParams: resolvedSearchParams });
  }

  if (first === "my-ads" && slug.length === 1) {
    return renderPage(MyAdsPage, { searchParams: resolvedSearchParams });
  }

  if (slug.length === 1 && (first === "privacy" || first === "terms" || first === "safety" || first === "contact")) {
    return <PublicInfoPage page={first} />;
  }

  if (slug.length === 1) {
    const locale = await getCurrentLocale();
    const staticPage = await getPublishedStaticPageBySlug(locale, first);
    if (staticPage) {
      return (
        <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <article className="rounded-2xl border border-[var(--line)] bg-white p-6">
            <h1 className="font-display text-3xl font-bold">{staticPage.title}</h1>
            <div className="mt-4 whitespace-pre-wrap text-base leading-8 text-[var(--ink-2)]">{staticPage.body}</div>
          </article>
        </main>
      );
    }
  }

  notFound();
}
