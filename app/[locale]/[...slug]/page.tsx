import type { ComponentType } from "react";
import { notFound } from "next/navigation";
import HomePage from "@/app/page";
import LoginPage from "@/app/login/page";
import RegisterPage from "@/app/register/page";
import ResetPasswordPage from "@/app/reset-password/page";
import SearchPage from "@/app/search/page";
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
import FavoritesPage from "@/app/favorites/page";
import MyAdsPage from "@/app/my-ads/page";
import AdminPage from "@/app/admin/page";
import AdministratorPage from "@/app/administrator/page";
import AdminCategoriesPage from "@/app/admin/categories/page";
import AdminElectronicsPage from "@/app/admin/electronics/page";
import AdminListingsPage from "@/app/admin/listings/page";
import AdminSearchPage from "@/app/admin/search/page";
import AdminRolesPage from "@/app/admin/roles/page";
import AdminAuditPage from "@/app/admin/audit/page";
import AdminUsersPage from "@/app/admin/users/page";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getPublishedStaticPageBySlug } from "@/lib/data/static-pages";

const renderPage = <T extends Record<string, unknown>>(
  Page: ComponentType<T>,
  props: T = {} as T,
) => {
  return <Page {...props} />;
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
    return renderPage(HomePage, { searchParams: resolvedSearchParams });
  }

  if (first === "login" && slug.length === 1) {
    return renderPage(LoginPage, { searchParams: resolvedSearchParams });
  }

  if (first === "register" && slug.length === 1) {
    return renderPage(RegisterPage, { searchParams: resolvedSearchParams });
  }

  if (first === "reset-password" && slug.length === 1) {
    return renderPage(ResetPasswordPage, { searchParams: resolvedSearchParams });
  }

  if (first === "search" && slug.length === 1) {
    return renderPage(SearchPage, { searchParams: resolvedSearchParams });
  }

  if (first === "post-ad") {
    if (slug.length === 1) {
      return renderPage(PostAdPage, { searchParams: resolvedSearchParams });
    }
    if (second === "create") {
      return renderPage(PostAdCreatePage, { searchParams: resolvedSearchParams });
    }
    if (second === "create-new") {
      return renderPage(PostAdCreateNewPage, { searchParams: resolvedSearchParams });
    }
    if (second === "create-v2") {
      return renderPage(PostAdCreateV2Page, { searchParams: resolvedSearchParams });
    }
    if (second === "electronics") {
      return renderPage(PostAdElectronicsPage, { searchParams: resolvedSearchParams });
    }
  }

  if (first === "categories") {
    if (slug.length === 1) {
      return renderPage(CategoriesPage, { searchParams: resolvedSearchParams });
    }
    if (slug.length === 2) {
      return renderPage(CategoryPage, { params: { slug: second }, searchParams: resolvedSearchParams });
    }
  }

  if (first === "category" && slug.length === 2) {
    return renderPage(CategoryPage, { params: { slug: second }, searchParams: resolvedSearchParams });
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
      return renderPage(ListingPage, { params: { id: second }, searchParams });
    }
    if (slug.length === 3) {
      if (third === "edit") {
        return renderPage(ListingEditPage, { params: { id: second }, searchParams });
      }
      if (third === "manage") {
        return renderPage(ListingManagePage, { params: { id: second }, searchParams });
      }
      if (third === "price-history") {
        return renderPage(ListingPriceHistoryPage, { params: { id: second }, searchParams });
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
        case "settings":
          return renderPage(DashboardSettingsPage, { searchParams: resolvedSearchParams });
      }
    }
  }

  if (first === "favorites" && slug.length === 1) {
    return renderPage(FavoritesPage, { searchParams: resolvedSearchParams });
  }

  if (first === "my-ads" && slug.length === 1) {
    return renderPage(MyAdsPage, { searchParams: resolvedSearchParams });
  }

  if (first === "admin") {
    if (slug.length === 1) {
      return renderPage(AdminPage, { searchParams: resolvedSearchParams });
    }
    if (slug.length === 2) {
      switch (second) {
        case "categories":
          return renderPage(AdminCategoriesPage, { searchParams: resolvedSearchParams });
        case "electronics":
          return renderPage(AdminElectronicsPage, { searchParams: resolvedSearchParams });
        case "listings":
          return renderPage(AdminListingsPage, { searchParams: resolvedSearchParams });
        case "search":
          return renderPage(AdminSearchPage, { searchParams: resolvedSearchParams });
        case "roles":
          return renderPage(AdminRolesPage, { searchParams: resolvedSearchParams });
        case "audit":
          return renderPage(AdminAuditPage, { searchParams: resolvedSearchParams });
        case "users":
          return renderPage(AdminUsersPage, { searchParams: resolvedSearchParams });
      }
    }
  }

  if (first === "administrator") {
    if (slug.length === 1) {
      return renderPage(AdministratorPage, { searchParams: resolvedSearchParams });
    }
    if (slug.length === 2 && second === "settings") {
      const SettingsPage = (await import("@/app/administrator/settings/page")).default;
      return renderPage(SettingsPage, { searchParams: resolvedSearchParams });
    }
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
