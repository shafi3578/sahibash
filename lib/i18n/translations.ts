export const SUPPORTED_LOCALES = ["en", "fa", "ps"] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

type TranslationTree = {
  header: {
    postAd: string;
    admin: string;
    myProfile: string;
    logout: string;
    login: string;
    register: string;
    language: string;
  };
  footer: {
    platform: string;
    tagline: string;
    quickLinks: string;
  };
  auth: {
    loginTitle: string;
    registerTitle: string;
    fullName: string;
    mobilePhone: string;
    email: string;
    password: string;
    signIn: string;
    createAccount: string;
    noAccount: string;
    alreadyHaveAccount: string;
    createOne: string;
    forgotPassword: string;
    resetIt: string;
    showPassword: string;
    hidePassword: string;
    signingIn: string;
    creatingAccount: string;
    supabaseMissing: string;
  };
  home: {
    heroTitle: string;
    heroSubtitle: string;
    searchPlaceholder: string;
    allAfghanistan: string;
    districtPlaceholder: string;
    searchButton: string;
    postAd: string;
    browseListings: string;
    mainCategories: string;
    openCategoryBrowser: string;
    moreCategories: string;
    comingSoon: string;
    featuredListings: string;
    latestListings: string;
  };
  search: {
    title: string;
    subtitle: string;
    intentDetected: string;
    brand: string;
    model: string;
    related: string;
    subcategory: string;
    searchListings: string;
    district: string;
    allCategories: string;
    newest: string;
    relevant: string;
    priceLowHigh: string;
    priceHighLow: string;
    allAdTypes: string;
    postedWithin: string;
    anyTime: string;
    last24Hours: string;
    last7Days: string;
    last30Days: string;
    forSale: string;
    wanted: string;
    any: string;
    yes: string;
    no: string;
    applyFilters: string;
    clearAll: string;
    showing: string;
    noResults: string;
    filters: string;
    close: string;
    reset: string;
    apply: string;
  };
  listing: {
    backToListings: string;
    category: string;
    wantedAd: string;
    suitableForStudents: string;
    posted: string;
    vehicleSummary: string;
    sellerInformation: string;
    name: string;
    phone: string;
    joined: string;
    minimumOffer: string;
    callSeller: string;
    message: string;
    offer: string;
    description: string;
    video: string;
    openVehicleVideo: string;
    featureChecklist: string;
    additionalDetails: string;
    specifications: string;
    noAdditionalDetails: string;
    autoFilledSpecifications: string;
    buyerSafetyWarning: string;
    safety1: string;
    safety2: string;
    safety3: string;
    safety4: string;
    addToFavorites: string;
      reportListing: string;
      reportTranslationIssue: string;
    selectReportReason: string;
    fraudOrScam: string;
    wrongCategory: string;
    duplicateListing: string;
    prohibitedOrUnsafeItem: string;
    spamOrMisleading: string;
    other: string;
    optionalDetails: string;
    sendMessage: string;
    hiAvailability: string;
    sendYourOffer: string;
    enterOfferedPrice: string;
    optionalNoteToSeller: string;
    sendOffer: string;
    call: string;
    close: string;
    viewOriginal: string;
    showTranslated: string;
    translationUnavailable: string;
    listingNo: string;
    listingDate: string;
    sellerFallback: string;
    notProvided: string;
    originalLanguage: string;
    messageInvalid: string;
    messageError: string;
    offerSent: string;
    offerTooLow: string;
    overview: string;
    condition: string;
    location: string;
    vehicleMake: string;
    vehicleSeries: string;
    vehicleModel: string;
    vehicleType: string;
    vehicleSubtype: string;
    vehicleManualBrand: string;
    vehicleManualModel: string;
    vehicleYear: string;
    vehicleFuelType: string;
    vehicleGear: string;
    vehicleStatus: string;
    vehicleBodyType: string;
    vehicleKm: string;
    vehicleEnginePower: string;
    vehicleEngineCapacity: string;
    vehicleWheelDrive: string;
    vehicleColor: string;
    vehicleFirstRegistration: string;
    vehiclePlateNumber: string;
    vehiclePlateType: string;
    vehicleEngineSize: string;
    vehicleWarranty: string;
    vehicleSalvageRecord: string;
    vehiclePlateStatus: string;
    vehicleSellerType: string;
    vehicleExchange: string;
    vehicleManualEntry: string;
    vehicleClassic: string;
    vehicleCustom: string;
  };
  postAd: {
    postAd: string;
    step: string;
    of: string;
    category: string;
    details: string;
    photos: string;
    location: string;
    preview: string;
    publish: string;
    categoryStepTitle: string;
    categoryStepSubtitle: string;
    backOneLevel: string;
    loading: string;
    finalCategorySelected: string;
    comingSoon: string;
    notifyMe: string;
    detailsStepTitle: string;
    detailsStepSubtitle: string;
    categoryNotSelected: string;
    title: string;
    description: string;
    price: string;
    currency: string;
    contactPhone: string;
    contactName: string;
    contactPreferences: string;
    contactPreferencesPlaceholder: string;
    locationMovedNote: string;
    realEstateDetails: string;
    listingPurpose: string;
    select: string;
    forSale: string;
    forRent: string;
    gerawyRahn: string;
    exchange: string;
    wanted: string;
    rooms: string;
    bathrooms: string;
    propertySize: string;
    landSizeOptional: string;
    documentType: string;
    ownerAgent: string;
    owner: string;
    agent: string;
    studentHousing: string;
    suitableForStudentsQuestion: string;
    yes: string;
    no: string;
    genderSuitable: string;
    distanceToUniversity: string;
    furnished: string;
    sharedAllowed: string;
    numberOfStudentsAllowed: string;
    dormitoryDetails: string;
    paymentPeriod: string;
    genderAllowed: string;
    roomType: string;
    numberOfBeds: string;
    mealsIncluded: string;
    water: string;
    electricity: string;
    internet: string;
    heating: string;
    airConditioning: string;
    security: string;
    rulesOptional: string;
    studentHousingCollectionDetails: string;
    propertyType: string;
    house: string;
    apartment: string;
    room: string;
    dormitory: string;
    vehicleDetails: string;
    brand: string;
    model: string;
    year: string;
    km: string;
    fuelType: string;
    transmission: string;
    condition: string;
    plateStatus: string;
    damagePaintReport: string;
    phonesElectronicsDetails: string;
    storage: string;
    ramOptional: string;
    warranty: string;
    secondHandDetails: string;
    itemType: string;
    brandOptional: string;
    additionalCategoryFields: string;
    confirmRules: string;
    photosStepTitle: string;
    photosRequired: string;
    photosOptional: string;
    recommended: string;
    addPhotos: string;
    primary: string;
    remove: string;
    addMore: string;
    whereLocated: string;
    chooseLocationMethod: string;
    useMyLocation: string;
    detectAutomatically: string;
    manualLocation: string;
    chooseProvinceDistrict: string;
    detectingLocation: string;
    province: string;
    district: string;
    areaNeighborhoodOptional: string;
    locationVisibility: string;
    hideExactShowProvinceDistrict: string;
    showApproximateLocation: string;
    showExactLocation: string;
    detectedLocation: string;
    latitude: string;
    longitude: string;
    accuracy: string;
    unknown: string;
    confirmLocation: string;
    previewStepTitle: string;
    publishStepTitle: string;
    publishReady: string;
    categoryLabel: string;
    provinceDistrict: string;
    photosLabel: string;
    back: string;
    continue: string;
    publishing: string;
  };
  postAdElectronics: {
    phonesElectronics: string;
    category: string;
    brandModel: string;
    details: string;
    photos: string;
    location: string;
    preview: string;
    chooseSubcategory: string;
    popularBrandsHint: string;
    selectBrand: string;
    selectModel: string;
    cantFindModel: string;
    manualBrand: string;
    manualModel: string;
    knownSpecs: string;
    storage: string;
    color: string;
    batteryHealthOptional: string;
    warranty: string;
    repairHistory: string;
    networkRegistered: string;
    boxIncluded: string;
    chargerIncluded: string;
    photosRequiredMin: string;
    photosOptional: string;
    areaOptional: string;
    path: string;
    locationLabel: string;
  };
};

export const TRANSLATIONS: Record<AppLocale, TranslationTree> = {
  en: {
    header: {
      postAd: "Post an Ad",
      admin: "Admin",
      myProfile: "My Profile",
      logout: "Logout",
      login: "Login",
      register: "Register",
      language: "Language",
    },
    footer: {
      platform: "Sahibash",
      tagline: "Afghanistan marketplace for trusted listings.",
      quickLinks: "Quick links",
    },
    auth: {
      loginTitle: "Login",
      registerTitle: "Register",
      fullName: "Full name",
      mobilePhone: "Mobile phone",
      email: "Email",
      password: "Password",
      signIn: "Sign in",
      createAccount: "Create account",
      noAccount: "No account yet?",
      alreadyHaveAccount: "Already have an account?",
      createOne: "Create one",
      forgotPassword: "Forgot password?",
      resetIt: "Reset it",
      showPassword: "Show",
      hidePassword: "Hide",
      signingIn: "Signing in...",
      creatingAccount: "Creating account...",
      supabaseMissing: "Supabase is not configured yet. Add env values in .env.local.",
    },
    home: {
      heroTitle: "Find Better Deals Across Afghanistan",
      heroSubtitle:
        "Buy, sell, rent, or post wanted ads in Vehicles, Real Estate, Phones, and Second-Hand items.",
      searchPlaceholder: "Search by title, brand, model...",
      allAfghanistan: "All Afghanistan",
      districtPlaceholder: "District (optional)",
      searchButton: "Search",
      postAd: "Post an Ad",
      browseListings: "Browse Listings",
      mainCategories: "Main Categories",
      openCategoryBrowser: "Open Full Category Browser",
      moreCategories: "More Categories",
      comingSoon: "Coming Soon",
      featuredListings: "Featured Listings",
      latestListings: "Latest Listings",
    },
    search: {
      title: "Smart Search",
      subtitle: "Dynamic filters adjust to your category and keywords.",
      intentDetected: "Intent detected",
      brand: "brand",
      model: "model",
      related: "Related",
      subcategory: "Subcategory",
      searchListings: "Search listings",
      district: "District",
      allCategories: "All categories",
      newest: "Newest",
      relevant: "Relevant",
      priceLowHigh: "Price: low to high",
      priceHighLow: "Price: high to low",
      allAdTypes: "All ad types",
      postedWithin: "Posted within",
      anyTime: "Any time",
      last24Hours: "Last 24 hours",
      last7Days: "Last 7 days",
      last30Days: "Last 30 days",
      forSale: "For Sale",
      wanted: "Wanted",
      any: "Any",
      yes: "Yes",
      no: "No",
      applyFilters: "Apply Filters",
      clearAll: "Clear All",
      showing: "Showing",
      noResults: "No listings matched these filters. Try removing one or two chips.",
      filters: "Filters",
      close: "Close",
      reset: "Reset",
      apply: "Apply",
    },
    listing: {
      backToListings: "Back to Listings",
      category: "Category",
      wantedAd: "Wanted Ad",
      suitableForStudents: "This place is suitable for students.",
      posted: "Posted",
      vehicleSummary: "Vehicle Summary",
      sellerInformation: "Seller Information",
      name: "Name",
      phone: "Phone",
      joined: "Joined",
      minimumOffer: "Minimum offer",
      callSeller: "Call Seller",
      message: "Message",
      offer: "Offer",
      description: "Description",
      video: "Video",
      openVehicleVideo: "Open vehicle video",
      featureChecklist: "Feature Checklist",
      additionalDetails: "Additional Details",
      specifications: "Specifications",
      noAdditionalDetails: "No additional details were provided.",
      autoFilledSpecifications: "Auto-Filled Specifications",
      buyerSafetyWarning: "Buyer Safety Warning",
      safety1: "Do not send advance payment before seeing the vehicle.",
      safety2: "Check the vehicle documents.",
      safety3: "Meet in a safe public place if possible.",
      safety4: "Verify ownership before payment.",
      addToFavorites: "Add to Favorites",
      reportListing: "Report Listing",
      reportTranslationIssue: "Report translation issue",
      selectReportReason: "Select report reason",
      fraudOrScam: "Fraud or scam",
      wrongCategory: "Wrong category",
      duplicateListing: "Duplicate listing",
      prohibitedOrUnsafeItem: "Prohibited or unsafe item",
      spamOrMisleading: "Spam or misleading",
      other: "Other",
      optionalDetails: "Optional details",
      sendMessage: "Send a Message",
      hiAvailability: "Hi, is this still available?",
      sendYourOffer: "Send Your Offer",
      enterOfferedPrice: "Enter your offered price",
      optionalNoteToSeller: "Optional note to seller",
      sendOffer: "Send Offer",
      call: "Call",
      close: "Close",
      viewOriginal: "View original",
      showTranslated: "Show translated",
      translationUnavailable: "Translation is not available yet.",
      listingNo: "Listing No",
      listingDate: "Listing Date",
      sellerFallback: "Seller",
      notProvided: "Not provided",
      originalLanguage: "Original language",
      messageInvalid: "Please write a message before sending.",
      messageError: "Unable to send message right now. Please try again.",
      offerSent: "Your offer has been sent. Please wait for seller approval.",
      offerTooLow: "Your offer is below the minimum offer for this listing.",
      overview: "Overview",
      condition: "Condition",
      location: "Location",
      vehicleMake: "Make",
      vehicleSeries: "Series",
      vehicleModel: "Model",
      vehicleType: "Vehicle Type",
      vehicleSubtype: "Vehicle Subtype",
      vehicleManualBrand: "Manual Make",
      vehicleManualModel: "Manual Model",
      vehicleYear: "Year",
      vehicleFuelType: "Fuel Type",
      vehicleGear: "Transmission",
      vehicleStatus: "Vehicle Status",
      vehicleBodyType: "Body Type",
      vehicleKm: "Mileage (km)",
      vehicleEnginePower: "Engine Power",
      vehicleEngineCapacity: "Engine Capacity",
      vehicleWheelDrive: "Drivetrain",
      vehicleColor: "Color",
      vehicleFirstRegistration: "First Registration",
      vehiclePlateNumber: "License Plate",
      vehiclePlateType: "License Plate Type",
      vehicleEngineSize: "Engine Size (Cylinders)",
      vehicleWarranty: "Warranty",
      vehicleSalvageRecord: "Salvage Record",
      vehiclePlateStatus: "Plate Status",
      vehicleSellerType: "Seller Type",
      vehicleExchange: "Exchange",
      vehicleManualEntry: "Manual Entry",
      vehicleClassic: "Classic Vehicle",
      vehicleCustom: "Custom Vehicle",
    },
    postAd: {
      postAd: "Post Ad",
      step: "Step",
      of: "of",
      category: "Category",
      details: "Details",
      photos: "Photos",
      location: "Location",
      preview: "Preview",
      publish: "Publish",
      categoryStepTitle: "1. Category",
      categoryStepSubtitle: "Select main category first, then go deeper until final category.",
      backOneLevel: "Back One Level",
      loading: "Loading...",
      finalCategorySelected: "Final category selected",
      comingSoon: "Coming Soon",
      notifyMe: "Notify Me",
      detailsStepTitle: "2. Details",
      detailsStepSubtitle: "Form adapts to your selected category path.",
      categoryNotSelected: "Category not selected",
      title: "Title",
      description: "Description",
      price: "Price",
      currency: "Currency",
      contactPhone: "Contact Phone",
      contactName: "Contact Name",
      contactPreferences: "Contact Preferences",
      contactPreferencesPlaceholder: "Call, WhatsApp, message, etc.",
      locationMovedNote: "Location has moved to a dedicated step near the end.",
      realEstateDetails: "Real Estate Details",
      listingPurpose: "Listing Purpose",
      select: "Select",
      forSale: "For Sale",
      forRent: "For Rent",
      gerawyRahn: "Gerawy / Rahn",
      exchange: "Exchange",
      wanted: "Wanted",
      rooms: "Rooms",
      bathrooms: "Bathrooms",
      propertySize: "Property Size",
      landSizeOptional: "Land Size (optional)",
      documentType: "Document Type",
      ownerAgent: "Owner / Agent",
      owner: "Owner",
      agent: "Agent",
      studentHousing: "Student Housing",
      suitableForStudentsQuestion: "Is this suitable for students?",
      yes: "Yes",
      no: "No",
      genderSuitable: "Gender Suitable",
      distanceToUniversity: "Distance to University (km)",
      furnished: "Furnished",
      sharedAllowed: "Shared Allowed",
      numberOfStudentsAllowed: "Number of Students Allowed",
      dormitoryDetails: "Dormitory Details",
      paymentPeriod: "Payment Period",
      genderAllowed: "Gender Allowed",
      roomType: "Room Type",
      numberOfBeds: "Number of Beds",
      mealsIncluded: "Meals Included",
      water: "Water",
      electricity: "Electricity",
      internet: "Internet",
      heating: "Heating",
      airConditioning: "Air Conditioning",
      security: "Security",
      rulesOptional: "Rules (optional)",
      studentHousingCollectionDetails: "Student Housing Collection Details",
      propertyType: "Property Type",
      house: "House",
      apartment: "Apartment",
      room: "Room",
      dormitory: "Dormitory",
      vehicleDetails: "Vehicle Details",
      brand: "Brand",
      model: "Model",
      year: "Year",
      km: "KM",
      fuelType: "Fuel Type",
      transmission: "Transmission",
      condition: "Condition",
      plateStatus: "Plate Status",
      damagePaintReport: "Damage / Paint Report",
      phonesElectronicsDetails: "Phones & Electronics Details",
      storage: "Storage",
      ramOptional: "RAM (optional)",
      warranty: "Warranty",
      secondHandDetails: "Second Hand Details",
      itemType: "Item Type",
      brandOptional: "Brand (optional)",
      additionalCategoryFields: "Additional Category Fields",
      confirmRules: "I confirm this listing follows Afghan rules.",
      photosStepTitle: "3. Photos",
      photosRequired: "Photos are required for this category.",
      photosOptional: "Photos are optional for this category.",
      recommended: "Recommended",
      addPhotos: "Add photos",
      primary: "Primary",
      remove: "Remove",
      addMore: "Add more",
      whereLocated: "Where is this item located?",
      chooseLocationMethod: "Choose how you want to add your location.",
      useMyLocation: "Use My Location",
      detectAutomatically: "Detect automatically from your device.",
      manualLocation: "Manual Location",
      chooseProvinceDistrict: "Choose province and district yourself.",
      detectingLocation: "Detecting your device location...",
      province: "Province",
      district: "District",
      areaNeighborhoodOptional: "Area / Neighborhood (optional)",
      locationVisibility: "Location Visibility",
      hideExactShowProvinceDistrict: "Hide exact location, show only province/district",
      showApproximateLocation: "Show approximate location",
      showExactLocation: "Show exact location",
      detectedLocation: "Detected Location",
      latitude: "Latitude",
      longitude: "Longitude",
      accuracy: "Accuracy",
      unknown: "Unknown",
      confirmLocation: "Confirm Location",
      previewStepTitle: "Preview",
      publishStepTitle: "Publish",
      publishReady: "Your ad is ready. Click publish to submit it for review.",
      categoryLabel: "Category",
      provinceDistrict: "Province / District",
      photosLabel: "Photos",
      back: "Back",
      continue: "Continue",
      publishing: "Publishing...",
    },
    postAdElectronics: {
      phonesElectronics: "Phones & Electronics",
      category: "Category",
      brandModel: "Brand & Model",
      details: "Details",
      photos: "Photos",
      location: "Location",
      preview: "Preview",
      chooseSubcategory: "Choose a Phones & Electronics subcategory.",
      popularBrandsHint: "Popular brands are prioritized for faster posting.",
      selectBrand: "Select brand",
      selectModel: "Select model",
      cantFindModel: "Can't find your model? Add manually.",
      manualBrand: "Manual Brand",
      manualModel: "Manual Model",
      knownSpecs: "Known Specs",
      storage: "Storage",
      color: "Color",
      batteryHealthOptional: "Battery Health (optional)",
      warranty: "Warranty",
      repairHistory: "Repair History",
      networkRegistered: "Network Registered",
      boxIncluded: "Box Included",
      chargerIncluded: "Charger Included",
      photosRequiredMin: "Photos required. Minimum",
      photosOptional: "Photos optional.",
      areaOptional: "Area (optional)",
      path: "Path",
      locationLabel: "Location",
    },
  },

  fa: {} as TranslationTree,
  ps: {} as TranslationTree,
};

const BROKEN_TRANSLATION_PATTERN = /\uFFFD|\+\uFFFD|\+�/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isUsableTranslation(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && !BROKEN_TRANSLATION_PATTERN.test(value);
}

function mergeWithEnglishFallback(
  base: Record<string, unknown>,
  candidate: Record<string, unknown>,
  locale: AppLocale,
  path: string,
  missingKeys: string[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, baseValue] of Object.entries(base)) {
    const keyPath = path ? `${path}.${key}` : key;
    const candidateValue = candidate[key];
    if (typeof baseValue === "string") {
      if (isUsableTranslation(candidateValue)) {
        result[key] = candidateValue;
        continue;
      }

      missingKeys.push(keyPath);
      if (locale !== "en" && process.env.NODE_ENV !== "production") {
        result[key] = `[missing: ${keyPath}]`;
      } else {
        result[key] = baseValue;
      }
      continue;
    }
    if (isRecord(baseValue)) {
      const nestedCandidate = isRecord(candidateValue) ? candidateValue : {};
      result[key] = mergeWithEnglishFallback(baseValue, nestedCandidate, locale, keyPath, missingKeys);
      continue;
    }
    result[key] = baseValue;
  }
  return result;
}

const CRITICAL_TRANSLATION_OVERRIDES: Partial<Record<AppLocale, Record<string, unknown>>> = {
  fa: {
    header: {
      postAd: "ثبت اعلان",
      admin: "ادمین",
      myProfile: "پروفایل من",
      logout: "خروج",
      login: "ورود",
      register: "ثبت نام",
      language: "زبان",
    },
    footer: {
      platform: "افغان",
      tagline: "بازار آنلاین افغانستان با اعلان های قابل اعتماد.",
      quickLinks: "پیوندهای سریع",
    },
    auth: {
      loginTitle: "ورود",
      registerTitle: "ثبت نام",
      fullName: "نام کامل",
      mobilePhone: "شماره موبایل",
      email: "ایمیل",
      password: "رمز عبور",
      signIn: "ورود",
      createAccount: "ایجاد حساب",
      noAccount: "حساب ندارید؟",
      alreadyHaveAccount: "از قبل حساب دارید؟",
      createOne: "ایجاد کنید",
      forgotPassword: "رمز عبور را فراموش کرده اید؟",
      resetIt: "بازنشانی کنید",
      showPassword: "نمایش",
      hidePassword: "پنهان",
      signingIn: "در حال ورود...",
      creatingAccount: "در حال ایجاد حساب...",
    },
    home: {
      heroTitle: "بهترین معامله ها را در سراسر افغانستان پیدا کنید",
      heroSubtitle: "خرید، فروش، کرایه یا ثبت اعلان نیازمندی در وسایط، املاک، موبایل و اجناس دست دوم.",
      searchPlaceholder: "جستجو براساس عنوان، برند یا مدل...",
      allAfghanistan: "تمام افغانستان",
      districtPlaceholder: "ولسوالی (اختیاری)",
      searchButton: "جستجو",
      postAd: "ثبت اعلان",
      browseListings: "مشاهده اعلان ها",
      mainCategories: "دسته بندی های اصلی",
      openCategoryBrowser: "مرور تمام دسته بندی ها",
      moreCategories: "دسته بندی های بیشتر",
      comingSoon: "به زودی",
      featuredListings: "اعلان های ویژه",
      latestListings: "جدیدترین اعلان ها",
    },
    search: {
      title: "جستجوی هوشمند",
      subtitle: "فیلترها براساس دسته بندی و کلمات شما به صورت پویا تغییر می کنند.",
      searchListings: "جستجو در اعلان ها",
      district: "ولسوالی",
      allCategories: "همه دسته بندی ها",
      newest: "جدیدترین",
      relevant: "مرتبط ترین",
      priceLowHigh: "قیمت: کم به زیاد",
      priceHighLow: "قیمت: زیاد به کم",
      allAdTypes: "همه نوع اعلان",
      postedWithin: "زمان انتشار",
      anyTime: "هر زمان",
      last24Hours: "۲۴ ساعت اخیر",
      last7Days: "۷ روز اخیر",
      last30Days: "۳۰ روز اخیر",
      forSale: "برای فروش",
      wanted: "نیازمندی",
      applyFilters: "اعمال فیلترها",
      clearAll: "پاک کردن همه",
      filters: "فیلترها",
      close: "بستن",
      reset: "بازنشانی",
      apply: "اعمال",
    },
    listing: {
      backToListings: "بازگشت به اعلان‌ها", category: "دسته‌بندی", wantedAd: "اعلان درخواستی",
      suitableForStudents: "این مکان برای دانشجویان مناسب است.", posted: "تاریخ نشر",
      vehicleSummary: "خلاصه وسیله نقلیه", sellerInformation: "اطلاعات فروشنده", name: "نام", phone: "تلفن",
      joined: "تاریخ عضویت", minimumOffer: "حداقل پیشنهاد", callSeller: "تماس با فروشنده", message: "پیام", offer: "پیشنهاد",
      description: "توضیحات", video: "ویدیو", openVehicleVideo: "باز کردن ویدیوی وسیله", featureChecklist: "فهرست امکانات",
      additionalDetails: "جزئیات بیشتر", specifications: "مشخصات", noAdditionalDetails: "جزئیات بیشتری ارائه نشده است.",
      autoFilledSpecifications: "مشخصات تکمیل‌شده خودکار", buyerSafetyWarning: "هشدار ایمنی خریدار",
      safety1: "پیش از دیدن وسیله نقلیه پیش‌پرداخت نفرستید.", safety2: "اسناد وسیله نقلیه را بررسی کنید.",
      safety3: "در صورت امکان در مکان عمومی امن ملاقات کنید.", safety4: "پیش از پرداخت مالکیت را تأیید کنید.",
      addToFavorites: "افزودن به علاقه‌مندی‌ها", reportListing: "گزارش اعلان", reportTranslationIssue: "گزارش مشکل ترجمه",
      selectReportReason: "دلیل گزارش را انتخاب کنید", fraudOrScam: "تقلب یا کلاهبرداری", wrongCategory: "دسته‌بندی نادرست",
      duplicateListing: "اعلان تکراری", prohibitedOrUnsafeItem: "مورد ممنوع یا ناامن", spamOrMisleading: "هرزنامه یا گمراه‌کننده",
      other: "سایر", optionalDetails: "جزئیات اختیاری", sendMessage: "ارسال پیام", hiAvailability: "سلام، آیا هنوز موجود است؟",
      sendYourOffer: "ارسال پیشنهاد", enterOfferedPrice: "قیمت پیشنهادی را وارد کنید", optionalNoteToSeller: "یادداشت اختیاری به فروشنده",
      sendOffer: "ارسال پیشنهاد", call: "تماس", close: "بستن", viewOriginal: "مشاهده متن اصلی", showTranslated: "نمایش ترجمه",
      translationUnavailable: "ترجمه هنوز در دسترس نیست.", listingNo: "شماره اعلان", listingDate: "تاریخ اعلان",
      sellerFallback: "فروشنده", notProvided: "ارائه نشده", originalLanguage: "زبان اصلی", messageInvalid: "لطفاً پیش از ارسال پیام بنویسید.",
      messageError: "اکنون ارسال پیام ممکن نیست. دوباره تلاش کنید.", offerSent: "پیشنهاد شما ارسال شد. منتظر تأیید فروشنده بمانید.",
      offerTooLow: "پیشنهاد شما کمتر از حداقل قیمت این اعلان است.", overview: "نمای کلی", condition: "وضعیت", location: "موقعیت",
    },
    postAd: {
      postAd: "ثبت اعلان",
      step: "مرحله",
      of: "از",
      category: "دسته بندی",
      details: "جزئیات",
      photos: "عکس ها",
      location: "موقعیت",
      preview: "پیش نمایش",
      publish: "انتشار",
      categoryStepTitle: "1. دسته بندی",
      categoryStepSubtitle: "ابتدا دسته اصلی را انتخاب کنید و تا دسته نهایی ادامه دهید.",
      backOneLevel: "یک مرحله عقب",
      loading: "در حال بارگذاری...",
      finalCategorySelected: "دسته نهایی انتخاب شد",
      comingSoon: "به زودی",
      notifyMe: "خبرم کنید",
      continue: "ادامه",
    },
  },
  ps: {
    header: {
      postAd: "اعلان ثبت کړئ",
      admin: "ادمین",
      myProfile: "زما پروفایل",
      logout: "وتل",
      login: "ننوتل",
      register: "راجسټر",
      language: "ژبه",
    },
    footer: {
      platform: "افغان",
      tagline: "د افغانستان بازار د باوري اعلانونو لپاره.",
      quickLinks: "چټک تړونونه",
    },
    auth: {
      loginTitle: "ننوتل",
      registerTitle: "راجسټر",
      fullName: "بشپړ نوم",
      mobilePhone: "د موبایل شمېره",
      email: "ایمیل",
      password: "پاسورډ",
      signIn: "ننوتل",
      createAccount: "حساب جوړ کړئ",
      noAccount: "حساب نه لرئ؟",
      alreadyHaveAccount: "حساب لرئ؟",
      createOne: "یو جوړ کړئ",
      forgotPassword: "پاسورډ مو هېر شوی؟",
      resetIt: "بیا تنظیم یې کړئ",
      showPassword: "وښیه",
      hidePassword: "پټ",
      signingIn: "ننوتل روان دي...",
      creatingAccount: "حساب جوړېږي...",
    },
    home: {
      heroTitle: "په افغانستان کې غوره معاملې پیدا کړئ",
      heroSubtitle: "د موټرو، املاکو، موبایل او دوهم لاس توکو لپاره واخلئ، وپلورئ، کرایه کړئ یا اعلان ثبت کړئ.",
      searchPlaceholder: "د سرلیک، برانډ او ماډل له مخې لټون...",
      allAfghanistan: "ټول افغانستان",
      districtPlaceholder: "ولسوالي (اختیاري)",
      searchButton: "لټون",
      postAd: "اعلان ثبت کړئ",
      browseListings: "اعلانونه وګورئ",
      mainCategories: "اصلي کټګورۍ",
      openCategoryBrowser: "ټولې کټګورۍ وګورئ",
      moreCategories: "نورې کټګورۍ",
      comingSoon: "ژر راځي",
      featuredListings: "ځانګړي اعلانونه",
      latestListings: "نوي اعلانونه",
    },
    search: {
      title: "هوښیار لټون",
      subtitle: "فلټرونه ستاسو د کټګورۍ او کلیمو له مخې بدلېږي.",
      searchListings: "اعلانونه ولټوئ",
      district: "ولسوالي",
      allCategories: "ټولې کټګورۍ",
      newest: "تر ټولو نوي",
      relevant: "اړوند",
      priceLowHigh: "بیه: له ټیټې تر لوړې",
      priceHighLow: "بیه: له لوړې تر ټیټې",
      allAdTypes: "ټول اعلان ډولونه",
      postedWithin: "د خپرېدو موده",
      anyTime: "هر وخت",
      last24Hours: "وروستۍ ۲۴ ساعته",
      last7Days: "وروستۍ ۷ ورځې",
      last30Days: "وروستۍ ۳۰ ورځې",
      forSale: "د پلور لپاره",
      wanted: "غوښتل شوی",
      applyFilters: "فلټرونه پلي کړئ",
      clearAll: "ټول پاک کړئ",
      filters: "فلټرونه",
      close: "بندول",
      reset: "بیا تنظیم",
      apply: "پلي کول",
    },
    listing: {
      backToListings: "اعلانونو ته بېرته", category: "کټګوري", wantedAd: "غوښتنیز اعلان",
      suitableForStudents: "دا ځای د محصلینو لپاره مناسب دی.", posted: "د خپرېدو نېټه",
      vehicleSummary: "د موټر لنډیز", sellerInformation: "د پلورونکي معلومات", name: "نوم", phone: "تلیفون",
      joined: "د غړیتوب نېټه", minimumOffer: "لږترلږه وړاندیز", callSeller: "پلورونکي ته زنګ", message: "پیغام", offer: "وړاندیز",
      description: "تشریح", video: "ویډیو", openVehicleVideo: "د موټر ویډیو پرانیستل", featureChecklist: "د ځانګړنو لست",
      additionalDetails: "نور جزییات", specifications: "مشخصات", noAdditionalDetails: "نور جزییات نه دي ورکړل شوي.",
      autoFilledSpecifications: "په اوتومات ډول بشپړ شوي مشخصات", buyerSafetyWarning: "د پېرودونکي د خوندیتوب خبرتیا",
      safety1: "د موټر له لیدلو مخکې پیسې مه لېږئ.", safety2: "د موټر اسناد وګورئ.",
      safety3: "که ممکن وي په خوندي عامه ځای کې ووینئ.", safety4: "له پیسو مخکې مالکیت تایید کړئ.",
      addToFavorites: "خوښو ته زیاتول", reportListing: "اعلان راپورول", reportTranslationIssue: "د ژباړې ستونزه راپورول",
      selectReportReason: "د راپور دلیل وټاکئ", fraudOrScam: "درغلي یا فریب", wrongCategory: "ناسمه کټګوري",
      duplicateListing: "تکراري اعلان", prohibitedOrUnsafeItem: "منع یا ناامنه توکی", spamOrMisleading: "سپیم یا ګمراه کوونکی",
      other: "نور", optionalDetails: "اختیاري جزییات", sendMessage: "پیغام لېږل", hiAvailability: "سلام، دا لا شته؟",
      sendYourOffer: "خپل وړاندیز ولېږئ", enterOfferedPrice: "وړاندیز شوې بیه دننه کړئ", optionalNoteToSeller: "پلورونکي ته اختیاري یادښت",
      sendOffer: "وړاندیز لېږل", call: "زنګ", close: "تړل", viewOriginal: "اصلي متن کتل", showTranslated: "ژباړه ښودل",
      translationUnavailable: "ژباړه لا نه ده چمتو.", listingNo: "د اعلان شمېره", listingDate: "د اعلان نېټه",
      sellerFallback: "پلورونکی", notProvided: "نه دی ورکړل شوی", originalLanguage: "اصلي ژبه", messageInvalid: "له لېږلو مخکې پیغام ولیکئ.",
      messageError: "اوس پیغام نشي لېږل کېدای. بیا هڅه وکړئ.", offerSent: "ستاسو وړاندیز ولېږل شو. د پلورونکي تایید ته انتظار وکړئ.",
      offerTooLow: "ستاسو وړاندیز د دې اعلان له لږترلږه بیې کم دی.", overview: "لنډیز", condition: "حالت", location: "ځای",
    },
    postAd: {
      postAd: "اعلان ثبت کړئ",
      step: "پړاو",
      of: "له",
      category: "کټګوري",
      details: "جزئیات",
      photos: "انځورونه",
      location: "ځای",
      preview: "مخکتنه",
      publish: "خپرول",
      categoryStepTitle: "1. کټګوري",
      categoryStepSubtitle: "لومړی اصلي کټګوري وټاکئ، بیا تر وروستۍ کټګورۍ پورې لاړ شئ.",
      backOneLevel: "یوه کچه شاته",
      loading: "بارېږي...",
      finalCategorySelected: "وروستۍ کټګوري وټاکل شوه",
      comingSoon: "ژر راځي",
      notifyMe: "خبر راکړئ",
      continue: "دوام",
    },
  },
};

const COMPLETE_TRANSLATION_OVERRIDES: Partial<Record<AppLocale, Record<string, unknown>>> = {
  fa: {
    auth: {
      supabaseMissing: "تنظیمات Supabase هنوز پیکربندی نشده است. مقادیر محیطی را در فایل .env.local اضافه کنید.",
    },
    search: {
      intentDetected: "هدف جستجو تشخیص شد",
      brand: "برند",
      model: "مدل",
      related: "مرتبط",
      subcategory: "زیرمجموعه",
      any: "همه",
      yes: "بلی",
      no: "نخیر",
      showing: "نمایش",
      noResults: "هیچ اعلانی با این فیلترها پیدا نشد. یک یا دو فیلتر را بردارید.",
    },
    listing: {
      vehicleMake: "برند",
      vehicleSeries: "سری",
      vehicleModel: "مدل",
      vehicleType: "نوع وسیله نقلیه",
      vehicleSubtype: "زیرنوع وسیله نقلیه",
      vehicleManualBrand: "برند واردشده",
      vehicleManualModel: "مدل واردشده",
      vehicleYear: "سال ساخت",
      vehicleFuelType: "نوع سوخت",
      vehicleGear: "گیربکس",
      vehicleStatus: "وضعیت وسیله نقلیه",
      vehicleBodyType: "نوع بدنه",
      vehicleKm: "کارکرد (کیلومتر)",
      vehicleEnginePower: "قدرت انجین",
      vehicleEngineCapacity: "حجم انجین",
      vehicleWheelDrive: "سیستم محرک",
      vehicleColor: "رنگ",
      vehicleFirstRegistration: "اولین ثبت",
      vehiclePlateNumber: "شماره پلیت",
      vehiclePlateType: "نوع پلیت",
      vehicleEngineSize: "اندازه انجین (تعداد سلندر)",
      vehicleWarranty: "تضمین",
      vehicleSalvageRecord: "سابقه خسارت",
      vehiclePlateStatus: "وضعیت پلیت",
      vehicleSellerType: "نوع فروشنده",
      vehicleExchange: "معاوضه",
      vehicleManualEntry: "ورود دستی",
      vehicleClassic: "وسیله نقلیه کلاسیک",
      vehicleCustom: "وسیله نقلیه سفارشی",
    },
    postAd: {
      detailsStepTitle: "۲. جزئیات",
      detailsStepSubtitle: "فورم بر اساس مسیر دسته‌بندی انتخاب‌شده تنظیم می‌شود.",
      categoryNotSelected: "دسته‌بندی انتخاب نشده است",
      title: "عنوان",
      description: "توضیحات",
      price: "قیمت",
      currency: "واحد پول",
      contactPhone: "شماره تماس",
      contactName: "نام تماس",
      contactPreferences: "روش‌های تماس",
      contactPreferencesPlaceholder: "تماس، واتس‌اپ، پیام و غیره",
      locationMovedNote: "موقعیت در یک مرحله جداگانه در بخش پایانی ثبت می‌شود.",
      realEstateDetails: "جزئیات ملک",
      listingPurpose: "هدف اعلان",
      select: "انتخاب کنید",
      forSale: "برای فروش",
      forRent: "برای کرایه",
      gerawyRahn: "گروی / رهن",
      exchange: "معاوضه",
      wanted: "درخواستی",
      rooms: "اتاق‌ها",
      bathrooms: "حمام‌ها",
      propertySize: "مساحت ملک",
      landSizeOptional: "مساحت زمین (اختیاری)",
      documentType: "نوع سند",
      ownerAgent: "مالک / نماینده",
      owner: "مالک",
      agent: "نماینده",
      studentHousing: "مسکن محصلان",
      suitableForStudentsQuestion: "آیا این مکان برای محصلان مناسب است؟",
      yes: "بلی",
      no: "نخیر",
      genderSuitable: "جنسیت مناسب",
      distanceToUniversity: "فاصله تا دانشگاه (کیلومتر)",
      furnished: "مبله",
      sharedAllowed: "اقامت مشترک مجاز است",
      numberOfStudentsAllowed: "تعداد محصلان مجاز",
      dormitoryDetails: "جزئیات لیلیه",
      paymentPeriod: "دوره پرداخت",
      genderAllowed: "جنسیت مجاز",
      roomType: "نوع اتاق",
      numberOfBeds: "تعداد بستر",
      mealsIncluded: "غذا شامل است",
      water: "آب",
      electricity: "برق",
      internet: "انترنت",
      heating: "گرمایش",
      airConditioning: "تهویه هوا",
      security: "امنیت",
      rulesOptional: "مقررات (اختیاری)",
      studentHousingCollectionDetails: "جزئیات مجموعه مسکن محصلان",
      propertyType: "نوع ملک",
      house: "خانه",
      apartment: "آپارتمان",
      room: "اتاق",
      dormitory: "لیلیه",
      vehicleDetails: "جزئیات وسیله نقلیه",
      brand: "برند",
      model: "مدل",
      year: "سال ساخت",
      km: "کیلومتر کارکرد",
      fuelType: "نوع سوخت",
      transmission: "گیربکس",
      condition: "وضعیت",
      plateStatus: "وضعیت پلیت",
      damagePaintReport: "گزارش آسیب / رنگ",
      phonesElectronicsDetails: "جزئیات موبایل و الکترونیک",
      storage: "حافظه",
      ramOptional: "رم (اختیاری)",
      warranty: "تضمین",
      secondHandDetails: "جزئیات جنس دست دوم",
      itemType: "نوع جنس",
      brandOptional: "برند (اختیاری)",
      additionalCategoryFields: "مشخصات بیشتر دسته‌بندی",
      confirmRules: "تأیید می‌کنم که این اعلان با قوانین افغانستان مطابقت دارد.",
      photosStepTitle: "۳. عکس‌ها",
      photosRequired: "برای این دسته‌بندی افزودن عکس الزامی است.",
      photosOptional: "برای این دسته‌بندی افزودن عکس اختیاری است.",
      recommended: "پیشنهادشده",
      addPhotos: "افزودن عکس",
      primary: "اصلی",
      remove: "حذف",
      addMore: "افزودن بیشتر",
      whereLocated: "این مورد در کجا قرار دارد؟",
      chooseLocationMethod: "روش افزودن موقعیت را انتخاب کنید.",
      useMyLocation: "استفاده از موقعیت من",
      detectAutomatically: "تشخیص خودکار از دستگاه شما",
      manualLocation: "انتخاب دستی موقعیت",
      chooseProvinceDistrict: "ولایت و ولسوالی را خودتان انتخاب کنید.",
      detectingLocation: "در حال تشخیص موقعیت دستگاه...",
      province: "ولایت",
      district: "ولسوالی",
      areaNeighborhoodOptional: "ناحیه / محله (اختیاری)",
      locationVisibility: "نمایش موقعیت",
      hideExactShowProvinceDistrict: "موقعیت دقیق پنهان؛ فقط ولایت و ولسوالی نمایش داده شود",
      showApproximateLocation: "موقعیت تقریبی نمایش داده شود",
      showExactLocation: "موقعیت دقیق نمایش داده شود",
      detectedLocation: "موقعیت تشخیص‌شده",
      latitude: "عرض جغرافیایی",
      longitude: "طول جغرافیایی",
      accuracy: "دقت",
      unknown: "نامعلوم",
      confirmLocation: "تأیید موقعیت",
      previewStepTitle: "پیش‌نمایش",
      publishStepTitle: "انتشار",
      publishReady: "اعلان شما آماده است. برای ارسال جهت بررسی، انتشار را بزنید.",
      categoryLabel: "دسته‌بندی",
      provinceDistrict: "ولایت / ولسوالی",
      photosLabel: "عکس‌ها",
      back: "برگشت",
      publishing: "در حال انتشار...",
    },
    postAdElectronics: {
      phonesElectronics: "موبایل و الکترونیک",
      category: "دسته‌بندی",
      brandModel: "برند و مدل",
      details: "جزئیات",
      photos: "عکس‌ها",
      location: "موقعیت",
      preview: "پیش‌نمایش",
      chooseSubcategory: "یک زیرمجموعه موبایل و الکترونیک را انتخاب کنید.",
      popularBrandsHint: "برندهای مشهور برای ثبت سریع‌تر در اولویت هستند.",
      selectBrand: "انتخاب برند",
      selectModel: "انتخاب مدل",
      cantFindModel: "مدل خود را پیدا نکردید؟ دستی اضافه کنید.",
      manualBrand: "برند دستی",
      manualModel: "مدل دستی",
      knownSpecs: "مشخصات شناخته‌شده",
      storage: "حافظه",
      color: "رنگ",
      batteryHealthOptional: "سلامت باتری (اختیاری)",
      warranty: "تضمین",
      repairHistory: "سابقه ترمیم",
      networkRegistered: "ثبت‌شده در شبکه",
      boxIncluded: "بکس شامل است",
      chargerIncluded: "چارجر شامل است",
      photosRequiredMin: "عکس الزامی است. حداقل",
      photosOptional: "عکس اختیاری است.",
      areaOptional: "ناحیه (اختیاری)",
      path: "مسیر",
      locationLabel: "موقعیت",
    },
  },
  ps: {
    auth: {
      supabaseMissing: "Supabase لا نه دی تنظیم شوی. د چاپېریال ارزښتونه په .env.local کې ورزیات کړئ.",
    },
    search: {
      intentDetected: "د لټون موخه وپېژندل شوه",
      brand: "برانډ",
      model: "موډل",
      related: "اړوند",
      subcategory: "فرعي کټګوري",
      any: "هر یو",
      yes: "هو",
      no: "نه",
      showing: "ښودل کېږي",
      noResults: "له دې فلټرونو سره کوم اعلان ونه موندل شو. یو یا دوه فلټرونه لرې کړئ.",
    },
    listing: {
      vehicleMake: "برانډ",
      vehicleSeries: "لړۍ",
      vehicleModel: "موډل",
      vehicleType: "د موټر ډول",
      vehicleSubtype: "د موټر فرعي ډول",
      vehicleManualBrand: "لاسي برانډ",
      vehicleManualModel: "لاسي موډل",
      vehicleYear: "د جوړېدو کال",
      vehicleFuelType: "د سون توکو ډول",
      vehicleGear: "ګیربکس",
      vehicleStatus: "د موټر حالت",
      vehicleBodyType: "د بدنې ډول",
      vehicleKm: "کارېدنه (کیلومتر)",
      vehicleEnginePower: "د انجن ځواک",
      vehicleEngineCapacity: "د انجن ظرفیت",
      vehicleWheelDrive: "د څرخونو محرک",
      vehicleColor: "رنګ",
      vehicleFirstRegistration: "لومړنی ثبت",
      vehiclePlateNumber: "د پلېټ شمېره",
      vehiclePlateType: "د پلېټ ډول",
      vehicleEngineSize: "د انجن اندازه (سلنډرونه)",
      vehicleWarranty: "تضمین",
      vehicleSalvageRecord: "د زیان سابقه",
      vehiclePlateStatus: "د پلېټ حالت",
      vehicleSellerType: "د پلورونکي ډول",
      vehicleExchange: "تبادله",
      vehicleManualEntry: "لاسي داخلول",
      vehicleClassic: "کلاسیک موټر",
      vehicleCustom: "ځانګړی جوړ شوی موټر",
    },
    postAd: {
      detailsStepTitle: "۲. جزئیات",
      detailsStepSubtitle: "فورمه ستاسو د ټاکل شوې کټګورۍ له لارې سره سمون خوري.",
      categoryNotSelected: "کټګوري نه ده ټاکل شوې",
      title: "سرلیک",
      description: "تشریح",
      price: "بیه",
      currency: "اسعار",
      contactPhone: "د اړیکې شمېره",
      contactName: "د اړیکې نوم",
      contactPreferences: "د اړیکې لارې",
      contactPreferencesPlaceholder: "زنګ، واټس‌اپ، پیغام او نور",
      locationMovedNote: "موقعیت د پای خواته په جلا پړاو کې ثبتېږي.",
      realEstateDetails: "د ملکیت جزئیات",
      listingPurpose: "د اعلان موخه",
      select: "وټاکئ",
      forSale: "د پلور لپاره",
      forRent: "د کرایې لپاره",
      gerawyRahn: "ګروۍ / رهن",
      exchange: "تبادله",
      wanted: "غوښتل شوی",
      rooms: "کوټې",
      bathrooms: "تشنابونه",
      propertySize: "د ملکیت مساحت",
      landSizeOptional: "د ځمکې مساحت (اختیاري)",
      documentType: "د سند ډول",
      ownerAgent: "مالک / استازی",
      owner: "مالک",
      agent: "استازی",
      studentHousing: "د محصلینو استوګنځای",
      suitableForStudentsQuestion: "ایا دا ځای د محصلینو لپاره مناسب دی؟",
      yes: "هو",
      no: "نه",
      genderSuitable: "مناسب جنسیت",
      distanceToUniversity: "له پوهنتون څخه واټن (کیلومتر)",
      furnished: "له فرنیچر سره",
      sharedAllowed: "ګډ اوسېدل اجازه لري",
      numberOfStudentsAllowed: "د منل کېدونکو محصلینو شمېر",
      dormitoryDetails: "د لیلیې جزئیات",
      paymentPeriod: "د پیسو موده",
      genderAllowed: "اجازه لرونکی جنسیت",
      roomType: "د کوټې ډول",
      numberOfBeds: "د بسترونو شمېر",
      mealsIncluded: "خواړه شامل دي",
      water: "اوبه",
      electricity: "برېښنا",
      internet: "انټرنېټ",
      heating: "تودوخه",
      airConditioning: "هوا سړوونکی",
      security: "امنیت",
      rulesOptional: "مقررات (اختیاري)",
      studentHousingCollectionDetails: "د محصلینو د استوګنځای جزئیات",
      propertyType: "د ملکیت ډول",
      house: "کور",
      apartment: "اپارتمان",
      room: "کوټه",
      dormitory: "لیلیه",
      vehicleDetails: "د موټر جزئیات",
      brand: "برانډ",
      model: "موډل",
      year: "د جوړېدو کال",
      km: "کارېدنه په کیلومتر",
      fuelType: "د سون توکو ډول",
      transmission: "ګیربکس",
      condition: "حالت",
      plateStatus: "د پلېټ حالت",
      damagePaintReport: "د زیان / رنګ راپور",
      phonesElectronicsDetails: "د موبایل او الکترونیک جزئیات",
      storage: "زېرمه",
      ramOptional: "رېم (اختیاري)",
      warranty: "تضمین",
      secondHandDetails: "د دوهم لاس توکي جزئیات",
      itemType: "د توکي ډول",
      brandOptional: "برانډ (اختیاري)",
      additionalCategoryFields: "د کټګورۍ نورې ځانګړنې",
      confirmRules: "تأییدوم چې دا اعلان د افغانستان له قوانینو سره سم دی.",
      photosStepTitle: "۳. انځورونه",
      photosRequired: "د دې کټګورۍ لپاره انځورونه اړین دي.",
      photosOptional: "د دې کټګورۍ لپاره انځورونه اختیاري دي.",
      recommended: "سپارښتنه شوې",
      addPhotos: "انځورونه زیات کړئ",
      primary: "اصلي",
      remove: "لرې کول",
      addMore: "نور زیات کړئ",
      whereLocated: "دا توکی چېرته دی؟",
      chooseLocationMethod: "د موقعیت د زیاتولو لاره وټاکئ.",
      useMyLocation: "زما موقعیت وکاروئ",
      detectAutomatically: "ستاسو له وسیلې څخه یې په اتومات ډول ومومئ",
      manualLocation: "لاسي موقعیت",
      chooseProvinceDistrict: "ولایت او ولسوالي خپله وټاکئ.",
      detectingLocation: "د وسیلې موقعیت موندل کېږي...",
      province: "ولایت",
      district: "ولسوالي",
      areaNeighborhoodOptional: "سیمه / ګاونډ (اختیاري)",
      locationVisibility: "د موقعیت ښودنه",
      hideExactShowProvinceDistrict: "کره موقعیت پټ؛ یوازې ولایت او ولسوالي وښودل شي",
      showApproximateLocation: "نږدې موقعیت وښودل شي",
      showExactLocation: "کره موقعیت وښودل شي",
      detectedLocation: "موندل شوی موقعیت",
      latitude: "عرض البلد",
      longitude: "طول البلد",
      accuracy: "دقت",
      unknown: "نامعلوم",
      confirmLocation: "موقعیت تأیید کړئ",
      previewStepTitle: "مخکتنه",
      publishStepTitle: "خپرول",
      publishReady: "ستاسو اعلان چمتو دی. د بیاکتنې لپاره د لېږلو په موخه خپرول ووهئ.",
      categoryLabel: "کټګوري",
      provinceDistrict: "ولایت / ولسوالي",
      photosLabel: "انځورونه",
      back: "شاته",
      publishing: "خپرېږي...",
    },
    postAdElectronics: {
      phonesElectronics: "موبایل او الکترونیک",
      category: "کټګوري",
      brandModel: "برانډ او موډل",
      details: "جزئیات",
      photos: "انځورونه",
      location: "موقعیت",
      preview: "مخکتنه",
      chooseSubcategory: "د موبایل او الکترونیک یوه فرعي کټګوري وټاکئ.",
      popularBrandsHint: "مشهور برانډونه د چټک اعلان لپاره لومړیتوب لري.",
      selectBrand: "برانډ وټاکئ",
      selectModel: "موډل وټاکئ",
      cantFindModel: "خپل موډل نه مومئ؟ په لاسي ډول یې زیات کړئ.",
      manualBrand: "لاسي برانډ",
      manualModel: "لاسي موډل",
      knownSpecs: "معلومې ځانګړنې",
      storage: "زېرمه",
      color: "رنګ",
      batteryHealthOptional: "د بټرۍ روغتیا (اختیاري)",
      warranty: "تضمین",
      repairHistory: "د ترمیم سابقه",
      networkRegistered: "په شبکه کې ثبت شوی",
      boxIncluded: "بکس ورسره دی",
      chargerIncluded: "چارجر ورسره دی",
      photosRequiredMin: "انځورونه اړین دي. لږ تر لږه",
      photosOptional: "انځورونه اختیاري دي.",
      areaOptional: "سیمه (اختیاري)",
      path: "لاره",
      locationLabel: "موقعیت",
    },
  },
};

// Ensure the canonical TRANSLATIONS tree does not contain corrupted literal
// blocks by rebuilding the `fa` and `ps` locale trees from the English base
// combined with the verified critical overrides. This keeps source-of-truth
// readable while preserving the project's English-first fallback behavior.
try {
  // Defensive: only run when TRANSLATIONS.en is present and overrides exist
  if (TRANSLATIONS.en) {
    TRANSLATIONS.fa = mergeOverrides(
      mergeOverrides(TRANSLATIONS.en as unknown as Record<string, unknown>, CRITICAL_TRANSLATION_OVERRIDES.fa || {}),
      COMPLETE_TRANSLATION_OVERRIDES.fa || {},
    ) as TranslationTree;
    TRANSLATIONS.ps = mergeOverrides(
      mergeOverrides(TRANSLATIONS.en as unknown as Record<string, unknown>, CRITICAL_TRANSLATION_OVERRIDES.ps || {}),
      COMPLETE_TRANSLATION_OVERRIDES.ps || {},
    ) as TranslationTree;
  }
} catch (err) {
  // Fail-safe: do not throw during module load — fall back to whatever is present
  // and let existing runtime warnings surface for diagnosis.
  console.error('[i18n] failed to rebuild fa/ps locales from overrides:', err && String(err));
}

function mergeOverrides(base: Record<string, unknown>, overrides: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    if (isRecord(value) && isRecord(result[key])) {
      result[key] = mergeOverrides(result[key] as Record<string, unknown>, value);
      continue;
    }
    result[key] = value;
  }
  return result;
}

export function getSafeTranslations(locale: AppLocale): TranslationTree {
  if (locale === "en") {
    return TRANSLATIONS.en;
  }
  const missingKeys: string[] = [];
  const safeTree = mergeWithEnglishFallback(
    TRANSLATIONS.en as Record<string, unknown>,
    TRANSLATIONS[locale] as Record<string, unknown>,
    locale,
    "",
    missingKeys
  );
  const criticalOverrides = CRITICAL_TRANSLATION_OVERRIDES[locale] || {};
  const completeOverrides = COMPLETE_TRANSLATION_OVERRIDES[locale] || {};
  const merged = mergeOverrides(
    mergeOverrides(safeTree, criticalOverrides),
    completeOverrides,
  ) as TranslationTree;

  if (missingKeys.length > 0) {
    console.warn(`[i18n] Missing translations for locale ${locale}: ${missingKeys.join(", ")}`);
  }

  return merged;
}
