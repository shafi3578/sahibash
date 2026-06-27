import type { AppLocale } from "@/lib/i18n/translations";

type DashboardUi = {
  myAccount: string;
  myAccountDescription: string;
  welcomeBack: string;
  welcomeBackDescription: string;
  listingsActivity: string;
  listingsActivityDescription: string;
  profileSecurity: string;
  profileSecurityDescription: string;
  myListings: string;
  myListingsDescription: string;
  favoriteListings: string;
  favoriteListingsDescription: string;
  favoriteSearches: string;
  favoriteSearchesDescription: string;
  messages: string;
  messagesDescription: string;
  questionsAnswers: string;
  questionsAnswersDescription: string;
  offers: string;
  offersDescription: string;
  accountInformation: string;
  accountInformationDescription: string;
  accountSecurity: string;
  accountSecurityDescription: string;
  settings: string;
  settingsDescription: string;
  helpCenter: string;
  helpCenterDescription: string;
  privacyTerms: string;
  privacyTermsDescription: string;
  searchListingsByTitleOrId: string;
  search: string;
  activeListings: string;
  inactiveListings: string;
  id: string;
  views: string;
  favorites: string;
  status: string;
  expiry: string;
  underReview: string;
  markAsSold: string;
  delete: string;
  uploadImage: string;
  noMessagesYet: string;
  messageThreadsAppear: string;
  listingId: string;
  participant: string;
  newReply: string;
  newSellerReply: string;
  typeReply: string;
  reply: string;
  removeFavorite: string;
};

type AdminUi = {
  dashboard: string;
  pending: string;
  approved: string;
  rejected: string;
  sold: string;
  reports: string;
  listingApprovalQueue: string;
  searchAdmin: string;
  categoryAdmin: string;
  approveRejectDelete: string;
  approve: string;
  reject: string;
  delete: string;
  translations: string;
  original: string;
  save: string;
  flag: string;
  searchSystemAdmin: string;
  searchAdminDescription: string;
  totalSearches: string;
  zeroResultSearches: string;
  resultsButNoClick: string;
  createAlias: string;
  canonicalTerm: string;
  aliasesCommaSeparated: string;
  categoryScopeOptional: string;
  active: string;
  saveAlias: string;
  suggestedNewAliases: string;
  suggestedAliasesDescription: string;
  noSuggestionsYet: string;
  canonical: string;
  language: string;
  saveAliasRule: string;
  aliasDictionary: string;
  update: string;
  enable: string;
  disable: string;
  approvedBy: string;
  notApproved: string;
  updated: string;
  topZeroResultQueries: string;
  topSearchedTerms: string;
  topRewrittenAliases: string;
  searchesWithResultsNoClick: string;
  addCategory: string;
  categoryName: string;
  categorySlug: string;
  description: string;
  displayOrder: string;
  saveCategory: string;
  addCategoryAlias: string;
  selectCategory: string;
  aliasTerm: string;
  categories: string;
  recentAliases: string;
  manageCategoriesAndAliases: string;
  multiLanguage: string;
  completedStatus: string;
  failedStatus: string;
  staleStatus: string;
  needsReviewStatus: string;
};

type ResetPasswordUi = {
  requestPasswordReset: string;
  emailPlaceholder: string;
  sendResetLink: string;
  setNewPassword: string;
  newPasswordPlaceholder: string;
  updatePassword: string;
};

type PostAdLandingUi = {
  whatDoYouWantToDo: string;
  chooseFlowDescription: string;
  sellSomething: string;
  sellSomethingDescription: string;
  quickPost: string;
  quickPostDescription: string;
  startQuickPost: string;
  activeCategories: string;
};

type WaitlistUi = {
  email: string;
  joining: string;
  notifyWhenAvailable: string;
  emailPlaceholder: string;
};

type CategoriesPageUi = {
  title: string;
  searchPlaceholder: string;
  backHome: string;
};

type LocationUi = {
  geolocationTitle: string;
  geolocationDescription: string;
  geolocationNotSupported: string;
  geolocationUnavailable: string;
  geolocationPermissionDenied: string;
  geolocationTimedOut: string;
  geolocationPositionUnavailable: string;
  gettingLocation: string;
  useCurrentLocation: string;
  selectManually: string;
  loadingMap: string;
  invalidCoordinates: string;
  mapDescription: string;
  latitude: string;
  longitude: string;
  latitudePlaceholder: string;
  longitudePlaceholder: string;
  accuracyOptional: string;
  accuracyPlaceholder: string;
  saveLocation: string;
  selectLocationFirst: string;
  methodTitle: string;
  methodCurrentTitle: string;
  methodCurrentDescription: string;
  methodManualTitle: string;
  methodManualDescription: string;
  methodMapTitle: string;
  methodMapDescription: string;
  methodSkipTitle: string;
  methodSkipDescription: string;
  back: string;
  changeLocation: string;
  continue: string;
};

type ListingsPageUi = {
  allListings: string;
};

type ListingManageUi = {
  notFoundOrUnauthorized: string;
  backToMyListings: string;
  backToListings: string;
  featured: string;
  urgent: string;
  statistics: string;
  views: string;
  favorites: string;
  messages: string;
  priceHistory: string;
  editListing: string;
  markAsSold: string;
  bumpDate: string;
  removeFeatured: string;
  makeFeatured: string;
  removeUrgent: string;
  markUrgent: string;
  expires: string;
  expired: string;
  thisListingHasExpired: string;
  deleteListing: string;
};

type ListingEditUi = {
  notFoundOrUnauthorized: string;
  backToMyListings: string;
  editListing: string;
  category: string;
  basicInformation: string;
  title: string;
  titleHint: string;
  description: string;
  descriptionHint: string;
  location: string;
  city: string;
  districtOptional: string;
  pricing: string;
  price: string;
  currency: string;
  contactInformation: string;
  contactNameOptional: string;
  phone: string;
  additionalDetails: string;
  selectField: string;
  photos: string;
  currentPhotos: string;
  listingImageAlt: string;
  primary: string;
  uploadNewPhotos: string;
  upload: string;
  saveChanges: string;
  cancel: string;
};

type PriceHistoryUi = {
  notFoundOrUnauthorized: string;
  backToMyListings: string;
  priceHistory: string;
  backToListing: string;
  noPriceChangesRecorded: string;
  date: string;
  oldPrice: string;
  newPrice: string;
  change: string;
  reason: string;
  originalPrice: string;
  currentPrice: string;
  totalChange: string;
};

type AdminElectronicsUi = {
  title: string;
  description: string;
  addBrand: string;
  selectCategory: string;
  brandName: string;
  sortOrder: string;
  popular: string;
  saveBrand: string;
  addModel: string;
  selectBrand: string;
  modelName: string;
  releaseYear: string;
  saveModel: string;
  upsertSpec: string;
  selectModel: string;
  specKey: string;
  specLabel: string;
  specValue: string;
  specGroupOptional: string;
  filterable: string;
  saveSpec: string;
  upsertOption: string;
  optionType: string;
  optionValue: string;
  saveOption: string;
};

export type UiTranslations = {
  dashboard: DashboardUi;
  admin: AdminUi;
  resetPassword: ResetPasswordUi;
  postAdLanding: PostAdLandingUi;
  waitlist: WaitlistUi;
  categoriesPage: CategoriesPageUi;
  location: LocationUi;
  listingsPage: ListingsPageUi;
  listingManage: ListingManageUi;
  listingEdit: ListingEditUi;
  priceHistory: PriceHistoryUi;
  adminElectronics: AdminElectronicsUi;
};

export const UI_TRANSLATIONS: Record<AppLocale, UiTranslations> = {
  en: {
    dashboard: {
      myAccount: "My Account",
      myAccountDescription: "Manage your listings, favorites, messages, offers, and account settings.",
      welcomeBack: "Welcome back",
      welcomeBackDescription: "Use the account menu to open each section. This page is now a summary view to avoid duplicated navigation blocks.",
      listingsActivity: "Listings and activity",
      listingsActivityDescription: "Track your listings, messages, questions, and offers from the menu on the left.",
      profileSecurity: "Profile and security",
      profileSecurityDescription: "Update account information, password, privacy choices, and preferences in one place.",
      myListings: "My Listings",
      myListingsDescription: "Manage active and inactive listings, status, and photos.",
      favoriteListings: "Favorite Listings",
      favoriteListingsDescription: "See items you saved and quickly re-open them.",
      favoriteSearches: "Favorite Searches",
      favoriteSearchesDescription: "Track saved search filters and alerts.",
      messages: "Messages",
      messagesDescription: "View conversations with buyers and sellers.",
      questionsAnswers: "Questions & Answers",
      questionsAnswersDescription: "Review questions on your listings.",
      offers: "Offers",
      offersDescription: "Manage incoming and outgoing offers.",
      accountInformation: "Account Information",
      accountInformationDescription: "Update profile details and contact info.",
      accountSecurity: "Account Security",
      accountSecurityDescription: "Password, sessions, and security settings.",
      settings: "Settings",
      settingsDescription: "Language, notifications, and preferences.",
      helpCenter: "Help Center",
      helpCenterDescription: "Support articles and account help.",
      privacyTerms: "Privacy & Terms",
      privacyTermsDescription: "Read marketplace rules and legal pages.",
      searchListingsByTitleOrId: "Search my listings by title or listing ID",
      search: "Search",
      activeListings: "Active Listings",
      inactiveListings: "Inactive Listings",
      id: "ID",
      views: "Views",
      favorites: "Favorites",
      status: "Status",
      expiry: "Expiry",
      underReview: "Under Review",
      markAsSold: "Mark as Sold",
      delete: "Delete",
      uploadImage: "Upload Image",
      noMessagesYet: "No messages yet",
      messageThreadsAppear: "Message threads will appear here when users contact you.",
      listingId: "Listing ID",
      participant: "Participant",
      newReply: "New reply",
      newSellerReply: "New seller reply",
      typeReply: "Type your reply...",
      reply: "Reply",
      removeFavorite: "Remove Favorite",
    },
    admin: {
      dashboard: "Admin Dashboard",
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
      sold: "Sold",
      reports: "Reports",
      listingApprovalQueue: "Listing Approval Queue",
      searchAdmin: "Search Admin",
      categoryAdmin: "Category Admin",
      approveRejectDelete: "Approve, reject, and delete listings.",
      approve: "Approve",
      reject: "Reject",
      delete: "Delete",
      translations: "Translations",
      original: "Original",
      save: "Save",
      flag: "Flag",
      searchSystemAdmin: "Search System Admin",
      searchAdminDescription: "Manage aliases and monitor multilingual search quality in production.",
      totalSearches: "Total Searches",
      zeroResultSearches: "Zero-Result Searches",
      resultsButNoClick: "Results But No Click",
      createAlias: "Create Alias",
      canonicalTerm: "Canonical term (example: iphone)",
      aliasesCommaSeparated: "Aliases, comma-separated",
      categoryScopeOptional: "Category scope (optional)",
      active: "Active",
      saveAlias: "Save Alias",
      suggestedNewAliases: "Suggested New Aliases",
      suggestedAliasesDescription: "Based on repeated zero-result query terms not covered by active dictionary rules.",
      noSuggestionsYet: "No suggestions yet.",
      canonical: "Canonical",
      language: "Language",
      saveAliasRule: "Save Alias Rule",
      aliasDictionary: "Alias Dictionary",
      update: "Update",
      enable: "Enable",
      disable: "Disable",
      approvedBy: "Approved by",
      notApproved: "Not approved",
      updated: "Updated",
      topZeroResultQueries: "Top Zero-Result Queries",
      topSearchedTerms: "Top Searched Terms",
      topRewrittenAliases: "Top Rewritten Aliases",
      searchesWithResultsNoClick: "Searches With Results But No Click",
      addCategory: "Add Category",
      categoryName: "Category name",
      categorySlug: "category-slug",
      description: "Description",
      displayOrder: "Display order",
      saveCategory: "Save Category",
      addCategoryAlias: "Add Category Alias",
      selectCategory: "Select category",
      aliasTerm: "Alias term",
      categories: "Categories",
      recentAliases: "Recent Aliases",
      manageCategoriesAndAliases: "Manage categories, aliases, and field metadata for smart posting and search.",
      multiLanguage: "Multi",
      completedStatus: "Completed",
      failedStatus: "Failed",
      staleStatus: "Stale",
      needsReviewStatus: "Needs review",
    },
    resetPassword: {
      requestPasswordReset: "Request Password Reset",
      emailPlaceholder: "you@example.com",
      sendResetLink: "Send Reset Link",
      setNewPassword: "Set New Password",
      newPasswordPlaceholder: "New password",
      updatePassword: "Update Password",
    },
    postAdLanding: {
      whatDoYouWantToDo: "What do you want to do?",
      chooseFlowDescription: "Choose your posting flow. You can edit everything before publishing.",
      sellSomething: "Sell something",
      sellSomethingDescription: "Create a normal for-sale listing.",
      quickPost: "Quick Post",
      quickPostDescription: "Enter title, price, photos, and location first; we will suggest the rest intelligently.",
      startQuickPost: "Start Quick Post",
      activeCategories: "Active categories",
    },
    waitlist: {
      email: "Email",
      joining: "Joining...",
      notifyWhenAvailable: "Notify Me When Available",
      emailPlaceholder: "you@example.com",
    },
    categoriesPage: {
      title: "Category Selection",
      searchPlaceholder: "Keyword or listing no.",
      backHome: "Back Home",
    },
    location: {
      geolocationTitle: "Use Your Current Location",
      geolocationDescription: "We'll use your device location to automatically fill in your listing location. You can review and change it before publishing.",
      geolocationNotSupported: "Geolocation is not supported by your browser",
      geolocationUnavailable: "Unable to retrieve location",
      geolocationPermissionDenied: "Location permission denied. Please enable location access.",
      geolocationTimedOut: "Location request timed out.",
      geolocationPositionUnavailable: "Position information is unavailable.",
      gettingLocation: "Getting Your Location...",
      useCurrentLocation: "Use My Current Location",
      selectManually: "Select Manually Instead",
      loadingMap: "Loading map...",
      invalidCoordinates: "Please enter valid coordinates",
      mapDescription: "Enter or adjust coordinates for your listing location. Kabul center is approximately 34.52° N, 69.18° E.",
      latitude: "Latitude",
      longitude: "Longitude",
      latitudePlaceholder: "Latitude",
      longitudePlaceholder: "Longitude",
      accuracyOptional: "Accuracy (meters, optional)",
      accuracyPlaceholder: "Accuracy in meters",
      saveLocation: "Save Location",
      selectLocationFirst: "Please select a location first",
      methodTitle: "How would you like to add the location?",
      methodCurrentTitle: "Use My Current Location",
      methodCurrentDescription: "Let Sahibash detect your location automatically (faster)",
      methodManualTitle: "Select Manually",
      methodManualDescription: "Choose province, district, and area from lists",
      methodMapTitle: "Choose on Map",
      methodMapDescription: "Enter or adjust coordinates on a map",
      methodSkipTitle: "Skip for Now",
      methodSkipDescription: "Add location details later",
      back: "Back",
      changeLocation: "Change Location",
      continue: "Continue",
    },
    listingsPage: {
      allListings: "All Listings",
    },
    listingManage: {
      notFoundOrUnauthorized: "Listing not found or unauthorized",
      backToMyListings: "Back to My Listings",
      backToListings: "Back to Listings",
      featured: "FEATURED",
      urgent: "URGENT",
      statistics: "Statistics",
      views: "Views",
      favorites: "Favorites",
      messages: "Messages",
      priceHistory: "Price History",
      editListing: "Edit Listing",
      markAsSold: "Mark as Sold",
      bumpDate: "Bump Date",
      removeFeatured: "Remove Featured",
      makeFeatured: "Make Featured",
      removeUrgent: "Remove Urgent",
      markUrgent: "Mark Urgent",
      expires: "EXPIRES",
      expired: "Expired",
      thisListingHasExpired: "This listing has expired",
      deleteListing: "Delete Listing",
    },
    listingEdit: {
      notFoundOrUnauthorized: "Listing not found or unauthorized",
      backToMyListings: "Back to My Listings",
      editListing: "Edit Listing",
      category: "Category",
      basicInformation: "Basic Information",
      title: "Title",
      titleHint: "5-120 characters",
      description: "Description",
      descriptionHint: "20-5000 characters",
      location: "Location",
      city: "City",
      districtOptional: "District (Optional)",
      pricing: "Pricing",
      price: "Price",
      currency: "Currency",
      contactInformation: "Contact Information",
      contactNameOptional: "Contact Name (Optional)",
      phone: "Phone",
      additionalDetails: "Additional Details",
      selectField: "Select {field}",
      photos: "Photos",
      currentPhotos: "Current Photos",
      listingImageAlt: "Listing",
      primary: "PRIMARY",
      uploadNewPhotos: "Upload New Photos",
      upload: "Upload",
      saveChanges: "Save Changes",
      cancel: "Cancel",
    },
    priceHistory: {
      notFoundOrUnauthorized: "Listing not found or unauthorized",
      backToMyListings: "Back to My Listings",
      priceHistory: "Price History",
      backToListing: "Back to Listing",
      noPriceChangesRecorded: "No price changes recorded yet",
      date: "Date",
      oldPrice: "Old Price",
      newPrice: "New Price",
      change: "Change",
      reason: "Reason",
      originalPrice: "Original Price",
      currentPrice: "Current Price",
      totalChange: "Total Change",
    },
    adminElectronics: {
      title: "Electronics Catalog Admin",
      description: "Manage brands, models, specs, and options without developer changes.",
      addBrand: "Add Brand",
      selectCategory: "Select Category",
      brandName: "Brand Name",
      sortOrder: "Sort Order",
      popular: "Popular",
      saveBrand: "Save Brand",
      addModel: "Add Model",
      selectBrand: "Select Brand",
      modelName: "Model Name",
      releaseYear: "Release Year",
      saveModel: "Save Model",
      upsertSpec: "Upsert Spec",
      selectModel: "Select Model",
      specKey: "Spec Key (e.g. screen_size)",
      specLabel: "Spec Label",
      specValue: "Spec Value",
      specGroupOptional: "Spec Group (optional)",
      filterable: "Filterable",
      saveSpec: "Save Spec",
      upsertOption: "Upsert Option",
      optionType: "Option Type (storage, color, ram)",
      optionValue: "Option Value (128GB)",
      saveOption: "Save Option",
    },
  },
  fa: {
    dashboard: {
      myAccount: "حساب من",
      myAccountDescription: "اعلان‌ها، علاقه‌مندی‌ها، پیام‌ها، پیشنهادها و تنظیمات حساب خود را مدیریت کنید.",
      welcomeBack: "خوش آمدید",
      welcomeBackDescription: "از منوی حساب برای باز کردن هر بخش استفاده کنید. این صفحه برای جلوگیری از محتوای تکراری به نمای خلاصه تبدیل شده است.",
      listingsActivity: "اعلان‌ها و فعالیت",
      listingsActivityDescription: "اعلان‌ها، پیام‌ها، پرسش‌ها و پیشنهادهای خود را از منوی سمت چپ دنبال کنید.",
      profileSecurity: "پروفایل و امنیت",
      profileSecurityDescription: "اطلاعات حساب، رمز عبور، حریم خصوصی و تنظیمات خود را در یک‌جا به‌روز کنید.",
      myListings: "اعلان‌های من",
      myListingsDescription: "اعلان‌های فعال و غیرفعال، وضعیت و عکس‌ها را مدیریت کنید.",
      favoriteListings: "اعلان‌های مورد علاقه",
      favoriteListingsDescription: "موارد ذخیره‌شده را ببینید و سریع دوباره باز کنید.",
      favoriteSearches: "جستجوهای مورد علاقه",
      favoriteSearchesDescription: "فیلترها و هشدارهای ذخیره‌شده را دنبال کنید.",
      messages: "پیام‌ها",
      messagesDescription: "گفتگوها با خریداران و فروشندگان را ببینید.",
      questionsAnswers: "سوالات و پاسخ‌ها",
      questionsAnswersDescription: "سوالات اعلان‌های خود را بررسی کنید.",
      offers: "پیشنهادها",
      offersDescription: "پیشنهادهای ورودی و خروجی را مدیریت کنید.",
      accountInformation: "اطلاعات حساب",
      accountInformationDescription: "جزئیات پروفایل و اطلاعات تماس را به‌روزرسانی کنید.",
      accountSecurity: "امنیت حساب",
      accountSecurityDescription: "رمز عبور، نشست‌ها و تنظیمات امنیتی.",
      settings: "تنظیمات",
      settingsDescription: "زبان، اعلان‌ها و ترجیحات.",
      helpCenter: "مرکز کمک",
      helpCenterDescription: "مقالات پشتیبانی و کمک حساب.",
      privacyTerms: "حریم خصوصی و شرایط",
      privacyTermsDescription: "قوانین بازار و صفحات حقوقی را بخوانید.",
      searchListingsByTitleOrId: "اعلان‌های خود را با عنوان یا شناسه جستجو کنید",
      search: "جستجو",
      activeListings: "اعلان‌های فعال",
      inactiveListings: "اعلان‌های غیرفعال",
      id: "شناسه",
      views: "بازدیدها",
      favorites: "علاقه‌مندی‌ها",
      status: "وضعیت",
      expiry: "انقضا",
      underReview: "در حال بررسی",
      markAsSold: "به عنوان فروخته‌شده علامت بزن",
      delete: "حذف",
      uploadImage: "آپلود عکس",
      noMessagesYet: "هنوز پیامی وجود ندارد",
      messageThreadsAppear: "وقتی کاربران با شما تماس بگیرند، گفتگوها اینجا ظاهر می‌شود.",
      listingId: "شناسه اعلان",
      participant: "شرکت‌کننده",
      newReply: "پاسخ جدید",
      newSellerReply: "پاسخ جدید فروشنده",
      typeReply: "پاسخ خود را بنویسید...",
      reply: "پاسخ",
      removeFavorite: "حذف از علاقه‌مندی",
    },
    admin: {
      dashboard: "داشبورد ادمین",
      pending: "در انتظار",
      approved: "تایید شده",
      rejected: "رد شده",
      sold: "فروخته شده",
      reports: "گزارش‌ها",
      listingApprovalQueue: "صف تایید اعلان‌ها",
      searchAdmin: "ادمین جستجو",
      categoryAdmin: "ادمین دسته‌بندی",
      approveRejectDelete: "اعلان‌ها را تایید، رد یا حذف کنید.",
      approve: "تایید",
      reject: "رد",
      delete: "حذف",
      translations: "ترجمه‌ها",
      original: "اصلی",
      save: "ذخیره",
      flag: "علامت‌گذاری",
      searchSystemAdmin: "ادمین سیستم جستجو",
      searchAdminDescription: "مدیریت هم‌معنی‌ها و نظارت کیفیت جستجوی چندزبانه در تولید.",
      totalSearches: "کل جستجوها",
      zeroResultSearches: "جستجوهای بدون نتیجه",
      resultsButNoClick: "نتیجه دارد اما کلیک نشده",
      createAlias: "ایجاد هم‌معنی",
      canonicalTerm: "عبارت اصلی (مثال: iphone)",
      aliasesCommaSeparated: "هم‌معنی‌ها با کاما",
      categoryScopeOptional: "دامنه دسته‌بندی (اختیاری)",
      active: "فعال",
      saveAlias: "ذخیره هم‌معنی",
      suggestedNewAliases: "هم‌معنی‌های پیشنهادی جدید",
      suggestedAliasesDescription: "براساس اصطلاحات پرتکرار بدون نتیجه که هنوز قانون فعال ندارند.",
      noSuggestionsYet: "هنوز پیشنهادی وجود ندارد.",
      canonical: "اصلی",
      language: "زبان",
      saveAliasRule: "ذخیره قانون هم‌معنی",
      aliasDictionary: "فرهنگ هم‌معنی",
      update: "به‌روزرسانی",
      enable: "فعال‌سازی",
      disable: "غیرفعال‌سازی",
      approvedBy: "تایید شده توسط",
      notApproved: "تایید نشده",
      updated: "به‌روزشده",
      topZeroResultQueries: "پرتکرارترین جستجوهای بدون نتیجه",
      topSearchedTerms: "پرتکرارترین عبارات جستجو",
      topRewrittenAliases: "پرتکرارترین بازنویسی هم‌معنی",
      searchesWithResultsNoClick: "جستجوهای دارای نتیجه بدون کلیک",
      addCategory: "افزودن دسته‌بندی",
      categoryName: "نام دسته‌بندی",
      categorySlug: "اسلاگ دسته‌بندی",
      description: "توضیحات",
      displayOrder: "ترتیب نمایش",
      saveCategory: "ذخیره دسته‌بندی",
      addCategoryAlias: "افزودن هم‌معنی دسته‌بندی",
      selectCategory: "انتخاب دسته‌بندی",
      aliasTerm: "عبارت هم‌معنی",
      categories: "دسته‌بندی‌ها",
      recentAliases: "هم‌معنی‌های اخیر",
      manageCategoriesAndAliases: "مدیریت دسته‌بندی‌ها، هم‌معنی‌ها و متادیتای فیلدها برای ثبت هوشمند و جستجو.",
      multiLanguage: "چندزبانه",
      completedStatus: "تکمیل‌شده",
      failedStatus: "ناموفق",
      staleStatus: "قدیمی",
      needsReviewStatus: "نیازمند بررسی",
    },
    resetPassword: {
      requestPasswordReset: "درخواست بازنشانی رمز عبور",
      emailPlaceholder: "you@example.com",
      sendResetLink: "ارسال لینک بازنشانی",
      setNewPassword: "تنظیم رمز عبور جدید",
      newPasswordPlaceholder: "رمز عبور جدید",
      updatePassword: "به‌روزرسانی رمز عبور",
    },
    postAdLanding: {
      whatDoYouWantToDo: "چه کاری می‌خواهید انجام دهید؟",
      chooseFlowDescription: "نوع جریان ثبت اعلان را انتخاب کنید. قبل از انتشار می‌توانید همه چیز را ویرایش کنید.",
      sellSomething: "چیزی برای فروش",
      sellSomethingDescription: "یک اعلان عادی برای فروش بسازید.",
      quickPost: "پست سریع",
      quickPostDescription: "ابتدا عنوان، قیمت، عکس و موقعیت را وارد کنید؛ بقیه موارد را هوشمند پیشنهاد می‌کنیم.",
      startQuickPost: "شروع پست سریع",
      activeCategories: "دسته‌های فعال",
    },
    waitlist: {
      email: "ایمیل",
      joining: "در حال عضویت...",
      notifyWhenAvailable: "وقتی آماده شد خبرم کن",
      emailPlaceholder: "you@example.com",
    },
    categoriesPage: {
      title: "انتخاب دسته‌بندی",
      searchPlaceholder: "کلیدواژه یا شماره اعلان",
      backHome: "بازگشت به خانه",
    },
    location: {
      geolocationTitle: "استفاده از موقعیت فعلی",
      geolocationDescription: "از موقعیت دستگاه شما برای تکمیل خودکار موقعیت اعلان استفاده می‌کنیم. قبل از انتشار می‌توانید آن را بررسی و ویرایش کنید.",
      geolocationNotSupported: "مرورگر شما از موقعیت‌یابی پشتیبانی نمی‌کند",
      geolocationUnavailable: "دریافت موقعیت ممکن نشد",
      geolocationPermissionDenied: "اجازه موقعیت رد شد. لطفا دسترسی موقعیت را فعال کنید.",
      geolocationTimedOut: "درخواست موقعیت زمان‌بر شد.",
      geolocationPositionUnavailable: "اطلاعات موقعیت در دسترس نیست.",
      gettingLocation: "در حال دریافت موقعیت...",
      useCurrentLocation: "استفاده از موقعیت فعلی من",
      selectManually: "انتخاب دستی",
      loadingMap: "در حال بارگذاری نقشه...",
      invalidCoordinates: "لطفا مختصات معتبر وارد کنید",
      mapDescription: "مختصات اعلان خود را وارد یا تنظیم کنید. مرکز کابل تقریبا 34.52° N و 69.18° E است.",
      latitude: "عرض جغرافیایی",
      longitude: "طول جغرافیایی",
      latitudePlaceholder: "عرض جغرافیایی",
      longitudePlaceholder: "طول جغرافیایی",
      accuracyOptional: "دقت (متر، اختیاری)",
      accuracyPlaceholder: "دقت به متر",
      saveLocation: "ذخیره موقعیت",
      selectLocationFirst: "لطفا ابتدا یک موقعیت انتخاب کنید",
      methodTitle: "چگونه می‌خواهید موقعیت را اضافه کنید؟",
      methodCurrentTitle: "استفاده از موقعیت فعلی من",
      methodCurrentDescription: "اجازه دهید صاحباش موقعیت شما را خودکار تشخیص دهد (سریع‌تر)",
      methodManualTitle: "انتخاب دستی",
      methodManualDescription: "استان، ولسوالی و ناحیه را از فهرست‌ها انتخاب کنید",
      methodMapTitle: "انتخاب روی نقشه",
      methodMapDescription: "مختصات را روی نقشه وارد یا تنظیم کنید",
      methodSkipTitle: "فعلا رد شود",
      methodSkipDescription: "جزئیات موقعیت را بعدا اضافه کنید",
      back: "بازگشت",
      changeLocation: "تغییر موقعیت",
      continue: "ادامه",
    },
    listingsPage: {
      allListings: "همه اعلان‌ها",
    },
    listingManage: {
      notFoundOrUnauthorized: "اعلان پیدا نشد یا اجازه دسترسی ندارید",
      backToMyListings: "بازگشت به اعلان‌های من",
      backToListings: "بازگشت به اعلان‌ها",
      featured: "ویژه",
      urgent: "فوری",
      statistics: "آمار",
      views: "بازدیدها",
      favorites: "علاقه‌مندی‌ها",
      messages: "پیام‌ها",
      priceHistory: "تاریخچه قیمت",
      editListing: "ویرایش اعلان",
      markAsSold: "علامت‌گذاری به‌عنوان فروخته‌شده",
      bumpDate: "تازه‌سازی تاریخ",
      removeFeatured: "حذف حالت ویژه",
      makeFeatured: "ویژه کردن",
      removeUrgent: "حذف حالت فوری",
      markUrgent: "علامت‌گذاری فوری",
      expires: "انقضا",
      expired: "منقضی",
      thisListingHasExpired: "این اعلان منقضی شده است",
      deleteListing: "حذف اعلان",
    },
    listingEdit: {
      notFoundOrUnauthorized: "اعلان پیدا نشد یا اجازه دسترسی ندارید",
      backToMyListings: "بازگشت به اعلان‌های من",
      editListing: "ویرایش اعلان",
      category: "دسته‌بندی",
      basicInformation: "اطلاعات پایه",
      title: "عنوان",
      titleHint: "۵ تا ۱۲۰ کاراکتر",
      description: "توضیحات",
      descriptionHint: "۲۰ تا ۵۰۰۰ کاراکتر",
      location: "موقعیت",
      city: "شهر",
      districtOptional: "ناحیه (اختیاری)",
      pricing: "قیمت‌گذاری",
      price: "قیمت",
      currency: "واحد پول",
      contactInformation: "اطلاعات تماس",
      contactNameOptional: "نام تماس (اختیاری)",
      phone: "تلفن",
      additionalDetails: "جزئیات بیشتر",
      selectField: "انتخاب {field}",
      photos: "عکس‌ها",
      currentPhotos: "عکس‌های فعلی",
      listingImageAlt: "اعلان",
      primary: "اصلی",
      uploadNewPhotos: "آپلود عکس‌های جدید",
      upload: "آپلود",
      saveChanges: "ذخیره تغییرات",
      cancel: "لغو",
    },
    priceHistory: {
      notFoundOrUnauthorized: "اعلان پیدا نشد یا اجازه دسترسی ندارید",
      backToMyListings: "بازگشت به اعلان‌های من",
      priceHistory: "تاریخچه قیمت",
      backToListing: "بازگشت به اعلان",
      noPriceChangesRecorded: "هنوز تغییری در قیمت ثبت نشده است",
      date: "تاریخ",
      oldPrice: "قیمت قبلی",
      newPrice: "قیمت جدید",
      change: "تغییر",
      reason: "دلیل",
      originalPrice: "قیمت اولیه",
      currentPrice: "قیمت فعلی",
      totalChange: "تغییر کل",
    },
    adminElectronics: {
      title: "ادمین کاتالوگ الکترونیک",
      description: "برندها، مدل‌ها، مشخصات و گزینه‌ها را بدون تغییر توسط توسعه‌دهنده مدیریت کنید.",
      addBrand: "افزودن برند",
      selectCategory: "انتخاب دسته‌بندی",
      brandName: "نام برند",
      sortOrder: "ترتیب",
      popular: "محبوب",
      saveBrand: "ذخیره برند",
      addModel: "افزودن مدل",
      selectBrand: "انتخاب برند",
      modelName: "نام مدل",
      releaseYear: "سال عرضه",
      saveModel: "ذخیره مدل",
      upsertSpec: "درج یا به‌روزرسانی مشخصه",
      selectModel: "انتخاب مدل",
      specKey: "کلید مشخصه (مثلا screen_size)",
      specLabel: "برچسب مشخصه",
      specValue: "مقدار مشخصه",
      specGroupOptional: "گروه مشخصه (اختیاری)",
      filterable: "قابل فیلتر",
      saveSpec: "ذخیره مشخصه",
      upsertOption: "درج یا به‌روزرسانی گزینه",
      optionType: "نوع گزینه (storage، color، ram)",
      optionValue: "مقدار گزینه (128GB)",
      saveOption: "ذخیره گزینه",
    },
  },
  ps: {
    dashboard: {
      myAccount: "زما حساب",
      myAccountDescription: "خپل اعلانونه، خوښې، پیغامونه، وړاندیزونه او د حساب تنظیمات اداره کړئ.",
      welcomeBack: "بیا ښه راغلاست",
      welcomeBackDescription: "د حساب له مینو څخه هره برخه پرانیزئ. دا پاڼه د تکراري محتوا د کمولو لپاره لنډیز ته بدله شوې.",
      listingsActivity: "اعلانونه او فعالیت",
      listingsActivityDescription: "خپل اعلانونه، پیغامونه، پوښتنې او وړاندیزونه د چپ مینو څخه تعقیب کړئ.",
      profileSecurity: "پروفایل او امنیت",
      profileSecurityDescription: "د حساب معلومات، پاسورډ، محرمیت او خوښې په یوه ځای کې نوي کړئ.",
      myListings: "زما اعلانونه",
      myListingsDescription: "فعال او غیرفعال اعلانونه، حالت او عکسونه اداره کړئ.",
      favoriteListings: "خوښ اعلانونه",
      favoriteListingsDescription: "ساتلي توکي وګورئ او ژر یې بېرته خلاص کړئ.",
      favoriteSearches: "خوښې لټونونه",
      favoriteSearchesDescription: "ساتلي فلټرونه او خبرتیاوې تعقیب کړئ.",
      messages: "پیغامونه",
      messagesDescription: "له پېرودونکو او پلورونکو سره خبرې اترې وګورئ.",
      questionsAnswers: "پوښتنې او ځوابونه",
      questionsAnswersDescription: "په خپلو اعلانونو پوښتنې وڅېړئ.",
      offers: "وړاندیزونه",
      offersDescription: "راتلونکي او وتونکي وړاندیزونه اداره کړئ.",
      accountInformation: "د حساب معلومات",
      accountInformationDescription: "د پروفایل جزییات او د اړیکې معلومات نوي کړئ.",
      accountSecurity: "د حساب امنیت",
      accountSecurityDescription: "پاسورډ، ناستې او امنیتي تنظیمات.",
      settings: "تنظیمات",
      settingsDescription: "ژبه، خبرتیاوې او خوښې.",
      helpCenter: "مرستې مرکز",
      helpCenterDescription: "د ملاتړ مقالې او د حساب مرسته.",
      privacyTerms: "محرمیت او شرطونه",
      privacyTermsDescription: "د بازار اصول او حقوقي پاڼې ولولئ.",
      searchListingsByTitleOrId: "خپل اعلانونه د سرلیک یا اعلان شمیرې له مخې ولټوئ",
      search: "لټون",
      activeListings: "فعال اعلانونه",
      inactiveListings: "غیرفعال اعلانونه",
      id: "شناسه",
      views: "کتنې",
      favorites: "خوښې",
      status: "حالت",
      expiry: "ختمېدنه",
      underReview: "تر کتنې لاندې",
      markAsSold: "د پلورل شوي په توګه نښه کړئ",
      delete: "حذف",
      uploadImage: "انځور پورته کول",
      noMessagesYet: "لا تراوسه پیغام نشته",
      messageThreadsAppear: "کله چې کاروونکي درسره اړیکه ونیسي، د پیغامونو سلسلې به دلته ښکاره شي.",
      listingId: "د اعلان شمېره",
      participant: "ګډونوال",
      newReply: "نوی ځواب",
      newSellerReply: "د پلورونکي نوی ځواب",
      typeReply: "خپل ځواب ولیکئ...",
      reply: "ځواب",
      removeFavorite: "له خوښو لرې کړئ",
    },
    admin: {
      dashboard: "د اډمین ډشبورډ",
      pending: "په انتظار کې",
      approved: "تایید شوی",
      rejected: "رد شوی",
      sold: "پلورل شوی",
      reports: "راپورونه",
      listingApprovalQueue: "د اعلان تایید کتار",
      searchAdmin: "د لټون اډمین",
      categoryAdmin: "د کټګورۍ اډمین",
      approveRejectDelete: "اعلانونه تایید، رد او حذف کړئ.",
      approve: "تایید",
      reject: "رد",
      delete: "حذف",
      translations: "ژباړې",
      original: "اصلي",
      save: "خوندي کول",
      flag: "نښه کول",
      searchSystemAdmin: "د لټون سیسټم اډمین",
      searchAdminDescription: "په تولید کې د څو ژبو لټون کیفیت وڅارئ او مترادفونه اداره کړئ.",
      totalSearches: "ټول لټونونه",
      zeroResultSearches: "بې پایلې لټونونه",
      resultsButNoClick: "پایلې شته خو کلیک نشته",
      createAlias: "مترادف جوړول",
      canonicalTerm: "اصلي اصطلاح (بیلګه: iphone)",
      aliasesCommaSeparated: "مترادفونه، په کوما",
      categoryScopeOptional: "د کټګورۍ ساحه (اختیاري)",
      active: "فعال",
      saveAlias: "مترادف خوندي کړئ",
      suggestedNewAliases: "نوي وړاندیز شوي مترادفونه",
      suggestedAliasesDescription: "د هغو تکراري بې پایلې اصطلاحاتو پر بنسټ چې فعال قواعد نه لري.",
      noSuggestionsYet: "لا تراوسه وړاندیز نشته.",
      canonical: "اصلي",
      language: "ژبه",
      saveAliasRule: "د مترادف قاعده خوندي کړئ",
      aliasDictionary: "د مترادفونو قاموس",
      update: "تازه کول",
      enable: "فعالول",
      disable: "غیرفعالول",
      approvedBy: "تایید شوی لخوا",
      notApproved: "تایید نه دی شوی",
      updated: "تازه شوی",
      topZeroResultQueries: "تر ټولو ډېر بې پایلې لټونونه",
      topSearchedTerms: "تر ټولو ډېر لټون شوي اصطلاحات",
      topRewrittenAliases: "تر ټولو ډېر بیا لیکل شوي مترادفونه",
      searchesWithResultsNoClick: "هغه لټونونه چې پایله لري خو کلیک نه لري",
      addCategory: "کټګوري زیاته کړئ",
      categoryName: "د کټګورۍ نوم",
      categorySlug: "category-slug",
      description: "تشریح",
      displayOrder: "د ښودنې ترتیب",
      saveCategory: "کټګوري خوندي کړئ",
      addCategoryAlias: "د کټګورۍ مترادف زیات کړئ",
      selectCategory: "کټګوري وټاکئ",
      aliasTerm: "مترادف اصطلاح",
      categories: "کټګورۍ",
      recentAliases: "وروستي مترادفونه",
      manageCategoriesAndAliases: "د هوښیار پوسټ او لټون لپاره کټګورۍ، مترادفونه او د فیلډ متادیتا اداره کړئ.",
      multiLanguage: "څوژبیز",
      completedStatus: "بشپړ شوی",
      failedStatus: "ناکام",
      staleStatus: "زړېدلی",
      needsReviewStatus: "بیاکتنې ته اړتیا لري",
    },
    resetPassword: {
      requestPasswordReset: "د پاسورډ بیا تنظیم غوښتنه",
      emailPlaceholder: "you@example.com",
      sendResetLink: "د بیا تنظیم لینک واستوئ",
      setNewPassword: "نوی پاسورډ وټاکئ",
      newPasswordPlaceholder: "نوی پاسورډ",
      updatePassword: "پاسورډ تازه کړئ",
    },
    postAdLanding: {
      whatDoYouWantToDo: "تاسو څه کول غواړئ؟",
      chooseFlowDescription: "د پوسټ کولو بهیر وټاکئ. د خپرولو مخکې هر څه سمولای شئ.",
      sellSomething: "د خرڅلاو اعلان",
      sellSomethingDescription: "یو عادي د پلور اعلان جوړ کړئ.",
      quickPost: "چټک پوسټ",
      quickPostDescription: "لومړی سرلیک، بیه، عکسونه او ځای ولیکئ؛ پاتې به هوښیار ډول وړاندیز شي.",
      startQuickPost: "چټک پوسټ پیل کړئ",
      activeCategories: "فعاله کټګورۍ",
    },
    waitlist: {
      email: "ایمیل",
      joining: "د یوځای کېدو په حال کې...",
      notifyWhenAvailable: "کله چې چمتو شي خبر راکړئ",
      emailPlaceholder: "you@example.com",
    },
    categoriesPage: {
      title: "د کټګورۍ ټاکنه",
      searchPlaceholder: "کلیدي کلمه یا اعلان شمېره",
      backHome: "کور ته بېرته",
    },
    location: {
      geolocationTitle: "اوسنی ځای وکاروئ",
      geolocationDescription: "ستاسو د وسیلې ځای کاروو تر څو د اعلان ځای په اوتومات ډول ډک شي. د خپرولو مخکې یې بیا کتل او بدلولای شئ.",
      geolocationNotSupported: "ستاسو براوزر جغرافیوي موقعیت نه ملاتړ کوي",
      geolocationUnavailable: "ځای ترلاسه نشو",
      geolocationPermissionDenied: "د ځای اجازه رد شوه. مهرباني وکړئ د ځای لاسرسی فعال کړئ.",
      geolocationTimedOut: "د ځای غوښتنه وخت ته ورسیده.",
      geolocationPositionUnavailable: "د ځای معلومات شتون نه لري.",
      gettingLocation: "ستاسو ځای ترلاسه کېږي...",
      useCurrentLocation: "زما اوسنی ځای وکاروئ",
      selectManually: "پر ځای یې لاسي وټاکئ",
      loadingMap: "نقشه بارېږي...",
      invalidCoordinates: "مهرباني وکړئ سم مختصات دننه کړئ",
      mapDescription: "د اعلان لپاره مختصات دننه یا اصلاح کړئ. د کابل مرکز نږدې 34.52° N او 69.18° E دی.",
      latitude: "عرض البلد",
      longitude: "طول البلد",
      latitudePlaceholder: "عرض البلد",
      longitudePlaceholder: "طول البلد",
      accuracyOptional: "دقت (متر، اختیاري)",
      accuracyPlaceholder: "دقت په متر",
      saveLocation: "ځای خوندي کړئ",
      selectLocationFirst: "مهرباني وکړئ لومړی یو ځای وټاکئ",
      methodTitle: "تاسو څنګه غواړئ ځای اضافه کړئ؟",
      methodCurrentTitle: "زما اوسنی ځای وکاروئ",
      methodCurrentDescription: "پرېږدئ صاحباش ستاسو ځای په اوتومات ډول وپېژني (چټک)",
      methodManualTitle: "لاسي ټاکنه",
      methodManualDescription: "ولایت، ولسوالۍ او ساحه له لستونو وټاکئ",
      methodMapTitle: "په نقشه کې وټاکئ",
      methodMapDescription: "مختصات په نقشه کې دننه یا برابر کړئ",
      methodSkipTitle: "اوس لپاره پرېږدئ",
      methodSkipDescription: "د ځای جزئیات وروسته اضافه کړئ",
      back: "بېرته",
      changeLocation: "ځای بدل کړئ",
      continue: "دوام",
    },
    listingsPage: {
      allListings: "ټول اعلانونه",
    },
    listingManage: {
      notFoundOrUnauthorized: "اعلان ونه موندل شو یا اجازه نه لرئ",
      backToMyListings: "زما اعلانونو ته بېرته",
      backToListings: "اعلانونو ته بېرته",
      featured: "ځانګړی",
      urgent: "فوري",
      statistics: "احصایې",
      views: "کتنې",
      favorites: "خوښې",
      messages: "پیغامونه",
      priceHistory: "د بیې تاریخچه",
      editListing: "اعلان سمول",
      markAsSold: "د پلورل شوي په توګه نښه کړئ",
      bumpDate: "نېټه تازه کول",
      removeFeatured: "ځانګړی حالت لرې کړئ",
      makeFeatured: "ځانګړی کړئ",
      removeUrgent: "فوري حالت لرې کړئ",
      markUrgent: "فوري نښه کړئ",
      expires: "ختمېدنه",
      expired: "ختم شوی",
      thisListingHasExpired: "دا اعلان پای ته رسېدلی دی",
      deleteListing: "اعلان ړنګول",
    },
    listingEdit: {
      notFoundOrUnauthorized: "اعلان ونه موندل شو یا اجازه نه لرئ",
      backToMyListings: "زما اعلانونو ته بېرته",
      editListing: "اعلان سمول",
      category: "کټګوري",
      basicInformation: "بنسټیز معلومات",
      title: "سرلیک",
      titleHint: "۵ تر ۱۲۰ توري",
      description: "تشریح",
      descriptionHint: "۲۰ تر ۵۰۰۰ توري",
      location: "ځای",
      city: "ښار",
      districtOptional: "ولسوالي (اختیاري)",
      pricing: "بیه ټاکنه",
      price: "بیه",
      currency: "اسعار",
      contactInformation: "د اړیکې معلومات",
      contactNameOptional: "د اړیکې نوم (اختیاري)",
      phone: "تلیفون",
      additionalDetails: "نور جزییات",
      selectField: "{field} وټاکئ",
      photos: "انځورونه",
      currentPhotos: "اوسني انځورونه",
      listingImageAlt: "اعلان",
      primary: "اصلي",
      uploadNewPhotos: "نوي انځورونه پورته کړئ",
      upload: "پورته کول",
      saveChanges: "بدلونونه خوندي کړئ",
      cancel: "لغوه",
    },
    priceHistory: {
      notFoundOrUnauthorized: "اعلان ونه موندل شو یا اجازه نه لرئ",
      backToMyListings: "زما اعلانونو ته بېرته",
      priceHistory: "د بیې تاریخچه",
      backToListing: "اعلان ته بېرته",
      noPriceChangesRecorded: "لا تر اوسه د بیې بدلون نه دی ثبت شوی",
      date: "نېټه",
      oldPrice: "پخوانۍ بیه",
      newPrice: "نوې بیه",
      change: "بدلون",
      reason: "دلیل",
      originalPrice: "اصلي بیه",
      currentPrice: "اوسنۍ بیه",
      totalChange: "ټول بدلون",
    },
    adminElectronics: {
      title: "د الکترونیک کتلاګ اډمین",
      description: "برانډونه، موډلونه، مشخصات او اختیارونه د پراختیاکوونکي له بدلون پرته اداره کړئ.",
      addBrand: "برانډ زیات کړئ",
      selectCategory: "کټګوري وټاکئ",
      brandName: "د برانډ نوم",
      sortOrder: "د ترتیب شمېره",
      popular: "مشهور",
      saveBrand: "برانډ خوندي کړئ",
      addModel: "موډل زیات کړئ",
      selectBrand: "برانډ وټاکئ",
      modelName: "د موډل نوم",
      releaseYear: "د خپرېدو کال",
      saveModel: "موډل خوندي کړئ",
      upsertSpec: "مشخصه درج/تازه کړئ",
      selectModel: "موډل وټاکئ",
      specKey: "د مشخصې کیلي (لکه screen_size)",
      specLabel: "د مشخصې لیبل",
      specValue: "د مشخصې ارزښت",
      specGroupOptional: "د مشخصې ګروپ (اختیاري)",
      filterable: "د فلټر وړ",
      saveSpec: "مشخصه خوندي کړئ",
      upsertOption: "اختیار درج/تازه کړئ",
      optionType: "د اختیار ډول (storage، color، ram)",
      optionValue: "د اختیار ارزښت (128GB)",
      saveOption: "اختیار خوندي کړئ",
    },
  },
};

export function getUiTranslations(locale: AppLocale): UiTranslations {
  return UI_TRANSLATIONS[locale] ?? UI_TRANSLATIONS.en;
}
