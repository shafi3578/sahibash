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
  };
  auth: {
    loginTitle: string;
    registerTitle: string;
    fullName: string;
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
    },
    auth: {
      loginTitle: "Login",
      registerTitle: "Register",
      fullName: "Full name",
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
      vehicleMake: "برند",
      vehicleSeries: "سری",
      vehicleModel: "مدل",
      vehicleType: "نوع وسیله نقلیه",
      vehicleSubtype: "زیرنوع وسیله نقلیه",
      vehicleManualBrand: "برند دستی",
      vehicleManualModel: "مدل دستی",
      vehicleYear: "سال",
      vehicleFuelType: "نوع سوخت",
      vehicleGear: "گیربکس",
      vehicleStatus: "وضعیت وسیله نقلیه",
      vehicleBodyType: "نوع بدنه",
      vehicleKm: "کارکرد (کیلومتر)",
      vehicleEnginePower: "قدرت انجین",
      vehicleEngineCapacity: "حجم انجین",
      vehicleWheelDrive: "سیستم محرک",
      vehicleColor: "رنگ",
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
      confirmRules: "I confirm this listing follows Sahibash rules.",
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
  fa: {
    header: {
      postAd: "+�+�+� +�+�+�+�+�",
      admin: "+�+���+���+�",
      myProfile: "+++�+�+�+���+� +�+�",
      logout: "+�+�+�+�",
      login: "+�+�+�+�",
      register: "+�+�+� +�+�+�",
      language: "+�+�+�+�",
    },
    footer: {
      platform: "+�+�+�+�+�+�",
      tagline: "+�+�+�+�+� +�+�+�+���+� +�+�+�+�+�+�+�+�+� +�+� +�+�+�+�+�G��+�+��� +�+�+�+� +�+�+�+�+�+�.",
    },
    auth: {
      loginTitle: "ورود",
      registerTitle: "ثبت نام",
      fullName: "نام کامل",
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
      supabaseMissing: "Supabase تنظیم نشده است. مقدار env را در .env.local اضافه کنید.",
    },
    home: {
      heroTitle: "+�+�+�+���+� +�+�+�+�+�+�G��+�+� +�+� +�+� +�+�+�+�+� +�+�+�+�+�+�+�+�+� ++��+�+� +�+��+�",
      heroSubtitle:
        "+�+���+�+� +�+�+�+�+� +�+�+���+� ��+� +�+�+� +�+�+�+�+� +��+�+�+�+�+��� +�+� +�+�+���+++� +�+�+�+�+�+� +�+�+�+���+� +� +�+�+�+�+� +�+�+�G��+�+�+�.",
      searchPlaceholder: "+�+�+�+�+� +�+� +�+�+�+� +�+�+�+�+�+� +�+�+�+�+� +�+�+�...",
      allAfghanistan: "+�+�+�+� +�+�+�+�+�+�+�+�+�",
      districtPlaceholder: "+�+�+�+�+�+�� (+�+�+���+�+���)",
      searchButton: "+�+�+�+�+�",
      postAd: "+�+�+� +�+�+�+�+�",
      browseListings: "+���+�+� +�+�+�+�+�G��+�+�",
      mainCategories: "+�+�+�+�G��+�+�+���G��+�+��� +�+�+��",
      openCategoryBrowser: "+�+�+� +�+�+�+� +�+�+�+� +�+�+�+�G��+�+�+���G��+�+�",
      moreCategories: "+�+�+�+�G��+�+�+���G��+�+��� +���+�+�+�",
      comingSoon: "+�+� +�+�+���",
      featuredListings: "+�+�+�+�+�G��+�+��� +��+�+�",
      latestListings: "+�+���+�+�+���+� +�+�+�+�+�G��+�+�",
    },
    search: {
      title: "+�+�+�+�+�� +�+�+�+�+�+�",
      subtitle: "+�+�+�+�+�+� +�+� +�+�+�+� +�+�+�+�G��+�+�+��� +� +�+�+�+�+� +�+�+� +�+�++��+� +��G��+�+�+�+�.",
      intentDetected: "+�+�+� +�+�+���+� +�+�",
      brand: "+�+�+�+�",
      model: "+�+�+�",
      related: "+�+�+�+�++",
      subcategory: "+���+�+�+�+�+�",
      searchListings: "+�+�+�+�+�� +�+�+�+�+�G��+�+�",
      district: "+�+�+�+�+�+��",
      allCategories: "+�+�+�+� +�+�+�+�G��+�+�+���G��+�+�",
      newest: "+�+���+�+�+���+�",
      relevant: "+�+�+�+�++G��+�+���+�",
      priceLowHigh: "+��+�+�: +�+� +�+� +���+�+�",
      priceHighLow: "+��+�+�: +���+�+� +�+� +�+�",
      allAdTypes: "+�+�+�+� +�+�+� +�+�+�+�+�",
      postedWithin: "Posted within",
      anyTime: "Any time",
      last24Hours: "Last 24 hours",
      last7Days: "Last 7 days",
      last30Days: "Last 30 days",
      forSale: "+�+�+��� +�+�+�+�",
      wanted: "+��+�+�+�+�+���",
      any: "+�+�+�",
      yes: "+�+��",
      no: "+�+���+�",
      applyFilters: "+�+�+�+�+� +�+�+�+�+�+�",
      clearAll: "+++�+� +�+�+�+� +�+�+�",
      showing: "+�+�+���+�",
      noResults: "+��+� +�+�+�+�+�� +�+� +���+� +�+�+�+�+�+� ++��+�+� +�+�+�. ��+� ��+� +�+� +�+�+�+� +�+� +�+�+� +�+��+�.",
      filters: "+�+�+�+�+�+�",
      close: "+�+�+�+�",
      reset: "+�+�++��+� +�+�+�+�",
      apply: "+�+�+�+�+�",
    },
    listing: {
      backToListings: "+�+�+�+�+� +�+� +�+�+�+�+�G��+�+�",
      category: "+�+�+�+�G��+�+�+���",
      wantedAd: "+�+�+�+�+� +��+�+�+�+�+���",
      suitableForStudents: "+���+� +�+�+�+� +�+�+��� +�+�+�+�+�+� +�+�+�+�+� +�+�+�.",
      posted: "+�+�+���+� +�+�+�",
      vehicleSummary: "+�+�+�+�+� +�+�+�+�",
      sellerInformation: "+�+�+�+�+�+�+� +�+�+�+�+�+�+�",
      name: "+�+�+�",
      phone: "+�+�+�+�+� +�+�+�+�",
      joined: "+�+�+��+�",
      minimumOffer: "+�+�+�+�+� ++��+�+�+�+�+�",
      callSeller: "+�+�+�+� +�+� +�+�+�+�+�+�+�",
      message: "++��+�+�",
      offer: "++��+�+�+�+�+�",
      description: "+�+�+���+�+�+�",
      video: "+��+���+�",
      openVehicleVideo: "+�+�+� +�+�+�+� +��+���+�� +�+�+�+�",
      featureChecklist: "+��+�+� +�+�+�+�+�+�+�",
      additionalDetails: "+�+�+���+�+� +�+�+�+���",
      specifications: "+�+�+�+�+�+�",
      noAdditionalDetails: "+�+�+���+�+� +�+�+�+��� +�+�+� +�+�+�+� +�+�+�.",
      autoFilledSpecifications: "+�+�+�+�+�+� +�+�+��+�G��+�+�+� +�+�+�+�+�+�",
      buyerSafetyWarning: "+�+�+�+�+� +�+�+��+��� +�+�+��� +�+���+�+�+�",
      safety1: "+�+�+� +�+� +���+�+� +�+�+�+�+� ++��+�G��+++�+�+�+�+� +�+�+�+�+���+�.",
      safety2: "+�+�+�+�+� +�+�+�+� +�+� +�+�+�+��� +�+��+�.",
      safety3: "+�+� +�+�+�+� +�+�+�+�+� +�+� +�+�+�+� +�+�+� +�+�+�+�� +�+�+�+�+�+� +�+��+�.",
      safety4: "+�+�+� +�+� +++�+�+�+�+�+� +�+�+�+���+� +�+� +�+����+� +�+��+�.",
      addToFavorites: "+�+�+�+�+�+� +�+� +�+�+�+�+�G��+�+�+���G��+�+�",
      reportListing: "+�+�+�+�+� +�+�+�+�+�",
      reportTranslationIssue: "+�+�+�+�+� +�+�+�+� +�+�+�+�+�",
      selectReportReason: "+�+��+� +�+�+�+�+� +�+� +�+�+�+�+�+� +�+��+�",
      fraudOrScam: "+�+�+�+�G��+�+�+�+�+���",
      wrongCategory: "+�+�+�+�G��+�+�+��� +�+�+�+�+�+�",
      duplicateListing: "+�+�+�+�+� +�+�+�+�+���",
      prohibitedOrUnsafeItem: "+�+�+�+� +���+�+�+�+�+� ��+� +�+�+�+�+�",
      spamOrMisleading: "+�+�+++� ��+� +�+�+�+�+�G��+�+�+�+�+�",
      other: "+�+���+�",
      optionalDetails: "+�+�+���+�+� +�+�+���+�+���",
      sendMessage: "+�+�+�+�+� ++��+�+�",
      hiAvailability: "+�+�+�+�+� +��+� +�+�+�+� +�+�+�+�+� +�+�+�+�",
      sendYourOffer: "++��+�+�+�+�+� +�+�+� +�+� +�+�+�+�+� +�+��+�",
      enterOfferedPrice: "+��+�+� ++��+�+�+�+�+��� +�+�+� +�+� +�+�+�+� +�+��+�",
      optionalNoteToSeller: "��+�+�+�+�+�+� +�+�+���+�+��� +�+�+��� +�+�+�+�+�+�+�",
      sendOffer: "+�+�+�+�+� ++��+�+�+�+�+�",
      call: "+�+�+�+�",
      close: "+�+�+�+�",
      viewOriginal: "+���+�+� +�+�+� +�+�+��",
      showTranslated: "+�+�+���+� +�+�+�+�+�",
      translationUnavailable: "+�+�+�+�+� +�+�+�+� +�+� +�+�+�+�+� +��+�+�.",
      listingNo: "+�+�+�+�+� +�+�+�+�+�",
      listingDate: "+�+�+���+� +�+�+�+�+�",
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
      vehicleMake: "برند",
      vehicleSeries: "سری",
      vehicleModel: "مدل",
      vehicleType: "نوع وسیله نقلیه",
      vehicleSubtype: "زیرنوع وسیله نقلیه",
      vehicleManualBrand: "برند دستی",
      vehicleManualModel: "مدل دستی",
      vehicleYear: "سال",
      vehicleFuelType: "نوع سوخت",
      vehicleGear: "گیربکس",
      vehicleStatus: "وضعیت وسیله نقلیه",
      vehicleBodyType: "نوع بدنه",
      vehicleKm: "کارکرد (کیلومتر)",
      vehicleEnginePower: "قدرت انجین",
      vehicleEngineCapacity: "حجم انجین",
      vehicleWheelDrive: "سیستم محرک",
      vehicleColor: "رنگ",
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
      postAd: "+�+�+� +�+�+�+�+�",
      step: "+�+�+�+�+�",
      of: "+�+�",
      category: "+�+�+�+�G��+�+�+���",
      details: "+�+�+���+�+�",
      photos: "+�+�+�G��+�+�",
      location: "+�+�+�+���+�",
      preview: "++��+�G��+�+�+���+�",
      publish: "+�+�+�",
      categoryStepTitle: "1. +�+�+�+�G��+�+�+���",
      categoryStepSubtitle: "+�+�+�+�+� +�+�+�+�G��+�+�+��� +�+�+�� +�+� +�+�+�+�+�+� +�+��+� +� +�+� +�+++� +�+�+���� +�+�+��+�.",
      backOneLevel: "��+� +�+�+�+�+� +�+�+�+�+�",
      loading: "+�+� +�+�+� +�+�+�+�+�+�+���...",
      finalCategorySelected: "+�+�+�+�G��+�+�+��� +�+�+���� +�+�+�+�+�+� +�+�",
      comingSoon: "+�+� +�+�+���",
      notifyMe: "+�+� +�+� +�+�+� +�+�+�",
      detailsStepTitle: "2. +�+�+���+�+�",
      detailsStepSubtitle: "+�+�+�+� +�+� +�+�+�+� +�+���+� +�+�+�+�G��+�+�+��� +�+�+�+�+�+��� +�+�+� +�+����+� +��G��+�+�+�.",
      categoryNotSelected: "+�+�+�+�G��+�+�+��� +�+�+�+�+�+� +�+�+�+�",
      title: "+�+�+�+�+�",
      description: "+�+�+���+�+�+�",
      price: "+��+�+�",
      currency: "+�+�+�+� +++�+�",
      contactPhone: "+�+�+�+�+� +�+�+�+�",
      contactName: "+�+�+� +�+�+�+�",
      contactPreferences: "+�+�+� +�+�+�+�",
      contactPreferencesPlaceholder: "+�+�+�+�+� +�+�+�+�+�+++� ++��+�+� +� +���+�+�",
      locationMovedNote: "+�+�+�+���+� +�+� +�+�+�+�+� +�+�+�+�+�+�+� +�+�+���+� +++���+�+� +�+�+�+�+� +�+�+� +�+�+�.",
      realEstateDetails: "+�+�+���+�+� +�+�+�+�+�",
      listingPurpose: "+�+�+� +�+�+�+�+�",
      select: "+�+�+�+�+�+� +�+��+�",
      forSale: "+�+�+��� +�+�+�+�",
      forRent: "+�+�+��� +�+�+���+�",
      gerawyRahn: "+�+�+�� / +�+�+�",
      exchange: "+�+�+���+�",
      wanted: "+��+�+�+�+�+���",
      rooms: "+�+�+�+�G��+�+�",
      bathrooms: "+�+�+�+�G��+�+�",
      propertySize: "+�+�+�+�+� +�+�+�",
      landSizeOptional: "+�+�+�+�+� +�+��+� (+�+�+���+�+���)",
      documentType: "+�+�+� +�+�+�",
      ownerAgent: "+�+�+�+� / +�+�+���+�+�+�",
      owner: "+�+�+�+�",
      agent: "+�+�+���+�+�+�",
      studentHousing: "+�+�+�+�+� +�+�+�+�+�+�",
      suitableForStudentsQuestion: "+��+� +�+�+��� +�+�+�+�+�+� +�+�+�+�+� +�+�+�+�",
      yes: "+�+��",
      no: "+�+���+�",
      genderSuitable: "+�+�+�+�+� +�+�+��� +�+�+���+�",
      distanceToUniversity: "+�+�+�+�+� +�+� +++�+�+�+�+�+� (+���+�+�+�+�+�)",
      furnished: "+�+�+�+�",
      sharedAllowed: "+�+�+�+�+�+� +�+�+�+�",
      numberOfStudentsAllowed: "+�+�+�+�+� +�+�+�+�+�+� +�+�+�+�",
      dormitoryDetails: "+�+�+���+�+� +�+�+�+�+�+�+�",
      paymentPeriod: "+�+�+�+� +++�+�+�+�+�",
      genderAllowed: "+�+�+���+� +�+�+�+�",
      roomType: "+�+�+� +�+�+�+�",
      numberOfBeds: "+�+�+�+�+� +�+�+�+�",
      mealsIncluded: "+�+�+� +�+�+�+� +�+�+�",
      water: "+�+�",
      electricity: "+�+�+�",
      internet: "+���+�+�+�+�+�",
      heating: "+�+�+�+���+�",
      airConditioning: "+�+�+��+�",
      security: "+�+�+��+�",
      rulesOptional: "+�+�+�+��+� (+�+�+���+�+���)",
      studentHousingCollectionDetails: "+�+�+���+�+� +�+�+�+�+�+� +�+�+�+�+� +�+�+�+�+�+�",
      propertyType: "+�+�+� +�+�+�",
      house: "+�+�+�+�",
      apartment: "+�+++�+�+�+�+�+�",
      room: "+�+�+�+�",
      dormitory: "+�+�+�+�+�+�+�",
      vehicleDetails: "+�+�+���+�+� +�+�+�+�",
      brand: "+�+�+�+�",
      model: "+�+�+�",
      year: "+�+�+�",
      km: "+���+�+�+�+�+�",
      fuelType: "+�+�+� +���+�",
      transmission: "+���+�+�+�+�",
      condition: "+�+�+���+�",
      plateStatus: "+�+�+���+� +�+�+�+� +++��+�",
      damagePaintReport: "+�+�+�+�+� +�+�+� / +�+���+�",
      phonesElectronicsDetails: "+�+�+���+�+� +�+�+�+���+� +� +�+�+�+�+�+�+��+�",
      storage: "+�+�+�+++�",
      ramOptional: "+�+� (+�+�+���+�+���)",
      warranty: "+�+�+�+�+�+���",
      secondHandDetails: "+�+�+���+�+� +�+�+�G��+�+�+�",
      itemType: "+�+�+� +�+�+�",
      brandOptional: "+�+�+�+� (+�+�+���+�+���)",
      additionalCategoryFields: "+���+�+�+�+��� +�+�+�+��� +�+�+�+�G��+�+�+���",
      confirmRules: "+�+����+� +��G��+�+�+� +���+� +�+�+�+�+� +�+++�+�+� +�+�+�+��+� +�+�+�+�+�+� +�+�+�.",
      photosStepTitle: "3. +�+�+�G��+�+�",
      photosRequired: "+�+�+� +�+�+��� +���+� +�+�+�+�G��+�+�+��� +�+�+�+�+�� +�+�+�.",
      photosOptional: "+�+�+� +�+�+��� +���+� +�+�+�+�G��+�+�+��� +�+�+���+�+��� +�+�+�.",
      recommended: "++��+�+�+�+�+���",
      addPhotos: "+�+�+�+�+�+� +�+�+�",
      primary: "+�+�+��",
      remove: "+�+�+�",
      addMore: "+�+�+�+�+�+� +���+�+�+�",
      whereLocated: "+���+� +�+�+�+� +�+�+� +�+�+�+���+� +�+�+�+�+�",
      chooseLocationMethod: "+�+�+� +�+�+�+�+�+� +�+�+�+���+� +�+� +�+�+�+�+�+� +�+��+�.",
      useMyLocation: "+�+�+�+�+�+�+� +�+� +�+�+�+���+� +�+�",
      detectAutomatically: "+�+� +++�+� +�+�+�+�+�+� +�+� +�+�+�+�+�+� +�+�+� +�+�+���+� +��G��+�+�+�.",
      manualLocation: "+�+�+�+���+� +�+�+���",
      chooseProvinceDistrict: "+�+�+���+� +� +�+�+�+�+�+�� +�+� +�+�+�+�+�+� +�+�+�+�+�+� +�+��+�.",
      detectingLocation: "+�+� +�+�+� +�+�+���+� +�+�+�+���+� +�+�+�+�+�+�...",
      province: "+�+�+���+�",
      district: "+�+�+�+�+�+��",
      areaNeighborhoodOptional: "+�+�+�+� / +�+�+���+� (+�+�+���+�+���)",
      locationVisibility: "+�+�+���+� +�+�+�+���+�",
      hideExactShowProvinceDistrict: "+�+�+�+���+� +�+��+� +++�+�+�+�+� +�+�++ +�+�+���+�/+�+�+�+�+�+�� +�+�+���+� +�+�+�",
      showApproximateLocation: "+�+�+���+� +�+�+�+���+� +�+�+���+���",
      showExactLocation: "+�+�+���+� +�+�+�+���+� +�+��+�",
      detectedLocation: "+�+�+�+���+� +�+�+���+�G��+�+�+�",
      latitude: "+�+�+� +�+�+�+�+���+����",
      longitude: "+++�+� +�+�+�+�+���+����",
      accuracy: "+�+�+�",
      unknown: "+�+�+�+�+�+�",
      confirmLocation: "+�+����+� +�+�+�+���+�",
      previewStepTitle: "++��+�G��+�+�+���+�",
      publishStepTitle: "+�+�+�",
      publishReady: "+�+�+�+�+� +�+�+� +�+�+�+�+� +�+�+�. +�+�+��� +�+�+�+�+� +�+�+� +�+�+�+���+� +�+�+� +�+� +�+�+��+�.",
      categoryLabel: "+�+�+�+�G��+�+�+���",
      provinceDistrict: "+�+�+���+� / +�+�+�+�+�+��",
      photosLabel: "+�+�+�G��+�+�",
      back: "+�+�+�+�+�",
      continue: "+�+�+�+�+�",
      publishing: "+�+� +�+�+� +�+�+�...",
    },
    postAdElectronics: {
      phonesElectronics: "+�+�+�+���+� +� +�+�+�+�+�+�+��+�",
      category: "+�+�+�+�G��+�+�+���",
      brandModel: "+�+�+�+� +� +�+�+�",
      details: "+�+�+���+�+�",
      photos: "+�+�+�G��+�+�",
      location: "+�+�+�+���+�",
      preview: "++��+�G��+�+�+���+�",
      chooseSubcategory: "��+� +���+�+�+�+�+� +�+�+�+���+� +� +�+�+�+�+�+�+��+� +�+�+�+�+�+� +�+��+�.",
      popularBrandsHint: "+�+�+�+�+�+��� +�+�+�+�+� +�+�+��� +�+�+� +�+���+�G��+�+� +�+� +�+�+�+��+� +�+�+�+�+�.",
      selectBrand: "+�+�+�+�+�+� +�+�+�+�",
      selectModel: "+�+�+�+�+�+� +�+�+�",
      cantFindModel: "+�+�+� +�+�+� +�+� ++��+�+� +�+��G��+�+��+�+� +�+�+��� +�+�+�+� +�+��+�.",
      manualBrand: "+�+�+�+� +�+�+���",
      manualModel: "+�+�+� +�+�+���",
      knownSpecs: "+�+�+�+�+�+� +�+�+�+�+�+�G��+�+�+�",
      storage: "+�+�+�+++�",
      color: "+�+�+�",
      batteryHealthOptional: "+�+�+�+�+� +�+�+�+��� (+�+�+���+�+���)",
      warranty: "+�+�+�+�+�+���",
      repairHistory: "+�+�+�+�+� +�+�+��+�",
      networkRegistered: "+�+�+� +�+�+�+�",
      boxIncluded: "+�+�+�+� +�+�+�+�+� +�+�+�",
      chargerIncluded: "+�+�+�+�+� +�+�+�+�+� +�+�+�",
      photosRequiredMin: "+�+�+� +�+�+�+�+�� +�+�+�. +�+�+�+�+�",
      photosOptional: "+�+�+� +�+�+���+�+��� +�+�+�.",
      areaOptional: "+�+�+�+� (+�+�+���+�+���)",
      path: "+�+���+�",
      locationLabel: "+�+�+�+���+�",
    },
  },
  ps: {
    header: {
      postAd: "+�+�+�+�+� +�+�+� +�+�+�",
      admin: "+�+�+��+�",
      myProfile: "+�+�+� +++�+�+�+���+�",
      logout: "+�+�+�",
      login: "+�+�+�+�+�",
      register: "+�+�+�+�+++�",
      language: "+�+�+�",
    },
    footer: {
      platform: "+�+�+�+�+�+�",
      tagline: "+� +�+�+�+�+�+�+�+�+� +�+�+�+�+� +� +�+�+�+�+� +�+�+�+�+�+�+�+� +�+++�+�+�.",
    },
    auth: {
      loginTitle: "ننوتل",
      registerTitle: "راجسټر",
      fullName: "بشپړ نوم",
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
      supabaseMissing: "Supabase نه دی تنظیم شوی. د env ارزښتونه په .env.local کې واچوئ.",
    },
    home: {
      heroTitle: "+++� +++�+�+� +�+�+�+�+�+�+�+�+� +��� +�+�+�+� +�+�+�+�+�� +�+�+�+�+�",
      heroSubtitle:
        "+�+�+++�+� +�+���+�+�+�+� +�+�+�+���+� +�+� +�+�+�+� +�+�+� +�+�+�+� +�+�+�+�+�+� +�+++�+�+�+�+� +�+�+���+� +�+�+� ��+� +� +�+�+���+� +�+�+�+�+� +�+�+�+�+�.",
      searchPlaceholder: "+� +�+�+��+�+� +�+�+�+�+�+� +�+�+�+� +�+� +�+��� +�+++�+�...",
      allAfghanistan: "+++�+� +�+�+�+�+�+�+�+�+�",
      districtPlaceholder: "+�+�+�+�+�+�+� (+�+�+���+�+�+�)",
      searchButton: "+�+++�+�",
      postAd: "+�+�+�+�+� +�+�+� +�+�+�",
      browseListings: "+�+�+�+�+�+�+�+� +�+�+�+�+�",
      mainCategories: "+�+�+�+� +�+++�+�+���",
      openCategoryBrowser: "+�+�+++� +�+++�+�+�+� +�+++�+� +++�+�+��+�+�",
      moreCategories: "+�+�+��� +�+++�+�+���",
      comingSoon: "+�+� +�+�+�+�",
      featuredListings: "+�+�+�+�+�+� +�+�+�+�+�+�+�+�",
      latestListings: "+�+�+�+�+�+� +�+�+�+�+�+�+�+�",
    },
    search: {
      title: "+�+�+ܦ�+�+� +�+++�+�",
      subtitle: "+�+�+++�+�+�+� +�+�+�+�+� +�+++�+�+��� +�+� +�+��+�+� +�+� +�+�+�+�+���+�+�.",
      intentDetected: "+�+�+�+� +�++��+�+�+�+� +�+�+�",
      brand: "+�+�+�+�+�",
      model: "+�+�+�+�",
      related: "+�+�+�+�+�",
      subcategory: "+�+�+�+� +�+++�+�+�+�",
      searchListings: "+�+�+�+�+�+�+�+� +�+�+++�+�",
      district: "+�+�+�+�+�+�+�",
      allCategories: "+++�+�� +�+++�+�+���",
      newest: "+�+�+�",
      relevant: "+�+� +++�+�+� +�+�+�+�+�",
      priceLowHigh: "+���+�: ++��+++� +�+� +�+�+���",
      priceHighLow: "+���+�: +�+�+�+� +�+� ++��++��",
      allAdTypes: "+� +�+�+�+�+� +++�+� +�+�+�+�+�+�",
      postedWithin: "Posted within",
      anyTime: "Any time",
      last24Hours: "Last 24 hours",
      last7Days: "Last 7 days",
      last30Days: "Last 30 days",
      forSale: "+� +++�+�+� +�+++�+�+�",
      wanted: "+�+�+���+�",
      any: "+�+� +�+�",
      yes: "+�+�",
      no: "+�+�",
      applyFilters: "+�+�+++�+�+�+� +++�+� +�+�+�",
      clearAll: "+++�+� +++�+� +�+�+�",
      showing: "+�+�+�+� +���+�+�",
      noResults: "+�+� +��� +�+�+++�+�+�+� +�+�+� +�+�+�+�+� +�+�+� +�+�+�+�+� +�+�. ��+� ��+� +�+�+� +�+�+++�+�+�+� +�+��� +�+�+�.",
      filters: "+�+�+++�+�+�+�",
      close: "+�+�+�+�+�",
      reset: "+���+� +�+�++��+�",
      apply: "+++�+� +�+�+�",
    },
    listing: {
      backToListings: "+�+�+�+�+�+�+�+� +�+� +���+�+�+�",
      category: "+�+++�+�+�+�",
      wantedAd: "+� +�+�+���+� +�+�+�+�+�",
      suitableForStudents: "+�+� +�+��� +� +�+�+�G��+�+�+�+�+�+� +�+++�+�+� +�+�+�+�+� +���.",
      posted: "+�+++�+� +�+��",
      vehicleSummary: "+� +�+�+++� +�+�+��+�",
      sellerInformation: "+� +++�+�+�+�+�+�+� +�+�+�+�+�+�+�",
      name: "+�+�+�",
      phone: "+�+��+�+�",
      joined: "+�+�+�+�",
      minimumOffer: "+�+� +++�+�+� +�+� +�+�+�+�+���+�",
      callSeller: "+++�+�+�+�+�+�+� +�+� +�+�+�",
      message: "++��+�+�+�",
      offer: "+�+�+�+�+���+�",
      description: "+�+�+���+�",
      video: "+��+��+�",
      openVehicleVideo: "+� +�+�+++� +��+��+� +++�+�+��+�+�",
      featureChecklist: "+� +�+�+�+�+�+�+� +��+�+�",
      additionalDetails: "+�+�+�+�+� +�+�+���+�+�",
      specifications: "+�+�+�+�+�+�",
      noAdditionalDetails: "+�+�+�+�+� +�+�+���+�+� +�+� +�+� +�+�+�+�+� +�+�+�.",
      autoFilledSpecifications: "+++� +�+++�+� +�+� +�+�+� +�+�+�+�+�+�",
      buyerSafetyWarning: "+� ++��+�+�+�+�+�+�+� +�+�+�+���+�+�+� +�+�+�+�+�+���",
      safety1: "+� +�+�+++� +�+� +��+�+�+� +�+�+��� ++��+��� +�+� +��+�+�.",
      safety2: "+� +�+�+++� +�+�+�+�+� +�+�+�+�+�.",
      safety3: "+�+� +�+�+�+� +�+� +++� +�+�+�+�+� +�+�+�+� +�+��� +��� +�+��+�+�.",
      safety4: "+�+� ++��+�+� +�+�+��� +� +�+�+�+���+� +�+����+� +�+�+�+�.",
      addToFavorites: "+�+�+ܦ� +�+� +�+�+�+�+� +�+�+�",
      reportListing: "+�+�+�+�+� +�+�+++�+� +�+�+�",
      reportTranslationIssue: "+� +�+�+�+��� +�+�+�+�+�+� +�+�+++�+� +�+�+�",
      selectReportReason: "+� +�+�+++�+� +�+��+� +�+++�+�+�",
      fraudOrScam: "+�+�+�+�+�",
      wrongCategory: "+�+�+�+�+� +�+++�+�+�+�",
      duplicateListing: "+�+�+�+�+�+� +�+�+�+�+�",
      prohibitedOrUnsafeItem: "+�+�+� ��+� +�+�+�+�+� +�+�+���",
      spamOrMisleading: "+�+++� ��+� +�+�+�+�+� +�+�+�+�+���",
      other: "+�+�+�",
      optionalDetails: "+�+�+���+�+�+� +�+�+���+�+�",
      sendMessage: "++��+�+�+� +�+��+�+�",
      hiAvailability: "+�+�+�+�+� +���+� +�+� +�+� +�+� +�+�+�+�",
      sendYourOffer: "+�+++� +�+�+�+�+���+� +�+��+�+�",
      enterOfferedPrice: "+�+++� +�+�+�+�+���+� +�+�� +��+�+� +�+�+�+� +�+�+�",
      optionalNoteToSeller: "+++�+�+�+�+�+�+� +�+� +�+�+���+�+�+� ��+�+�+�+�",
      sendOffer: "+�+�+�+�+���+� +�+��+�+�",
      call: "+�+�+�",
      close: "+�+�+�+�+�",
      viewOriginal: "+�+�+�+� +�+�+� +�+�+�+�+�",
      showTranslated: "+�+�+�+�+� +�+ܦ�+�",
      translationUnavailable: "+�+�+�+�+� +�+� +�+�+�+�+�+� +�+�+�+�+�+� +�+� +�+�.",
      listingNo: "+� +�+�+�+�+� +�+��+�+�",
      listingDate: "+� +�+�+�+�+� +��+++�",
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
      vehicleMake: "برانډ",
      vehicleSeries: "لړۍ",
      vehicleModel: "ماډل",
      vehicleType: "د موټر ډول",
      vehicleSubtype: "د موټر فرعي ډول",
      vehicleManualBrand: "لاسي برانډ",
      vehicleManualModel: "لاسي ماډل",
      vehicleYear: "کال",
      vehicleFuelType: "د سونګ ډول",
      vehicleGear: "ګیر",
      vehicleStatus: "د موټر حالت",
      vehicleBodyType: "د بدنې ډول",
      vehicleKm: "کیلومتر",
      vehicleEnginePower: "د انجن ځواک",
      vehicleEngineCapacity: "د انجن حجم",
      vehicleWheelDrive: "د ډرایو سیستم",
      vehicleColor: "رنګ",
      vehicleWarranty: "تضمین",
      vehicleSalvageRecord: "د تاوان سابقه",
      vehiclePlateStatus: "د پلېټ حالت",
      vehicleSellerType: "د پلورونکي ډول",
      vehicleExchange: "تبادله",
      vehicleManualEntry: "لاسي ثبت",
      vehicleClassic: "کلاسیک موټر",
      vehicleCustom: "سفارشي موټر",
    },
    postAd: {
      postAd: "+�+�+�+�+� +�+�+�",
      step: "+++�+�+�",
      of: "+�+�",
      category: "+�+++�+�+�+�",
      details: "+�+�+���+�+�",
      photos: "+�+�+�+�+�+�+�+�",
      location: "+�+���",
      preview: "+�+�+�+�+�+�",
      publish: "+�+++�+�+�",
      categoryStepTitle: "1. +�+++�+�+�+�",
      categoryStepSubtitle: "+�+�+�+��� +�+�+�+� +�+++�+�+�+� +�+++�+�+�+� +���+� +�+� +�+�+�+�+�+� +�+�� +�+�+� +�+�.",
      backOneLevel: "��+�+� +�+�+� +�+�+�+�",
      loading: "+�+�+��+�+�...",
      finalCategorySelected: "+�+�+�+�+��� +�+++�+�+�+� +�+++�+�+� +�+�+�",
      comingSoon: "+�+� +�+�+�+�",
      notifyMe: "+�+�+� +�+�+�+�+�",
      detailsStepTitle: "2. +�+�+���+�+�",
      detailsStepSubtitle: "+�+�+�+� +�+�+�+�+� +++�+�+�� +�+++�+�+��� +�+�+� +�+�+�+�+���+�+�.",
      categoryNotSelected: "+�+++�+�+�+� +�+� +�+� +++�+�+� +�+��",
      title: "+�+�+��+�",
      description: "+�+�+���+�",
      price: "+���+�",
      currency: "+�+�+�+�+�",
      contactPhone: "+� +�+���+��� +�+��+�+�",
      contactName: "+� +�+���+��� +�+�+�",
      contactPreferences: "+� +�+���+��� +�+�+�+�",
      contactPreferencesPlaceholder: "+�+�+�+� +�+�+++�+�+++� ++��+�+�+� +�+� +�+�+�",
      locationMovedNote: "+�+��� +� +++��� +�+� +�+�+��� +�+�+� +++�+�+� +�+� +�+�+�+�+�+� +�+��.",
      realEstateDetails: "+� +�+���+�+�+� +�+�+���+�+�",
      listingPurpose: "+� +�+�+�+�+� +�+�+�+�",
      select: "+�+++�+�+�",
      forSale: "+� +++�+�+� +�+++�+�+�",
      forRent: "+� +�+�+���� +�+++�+�+�",
      gerawyRahn: "+�+�+�+� / +�+�+�",
      exchange: "+�+�+�+�+�",
      wanted: "+�+�+���+�",
      rooms: "+�+�+��",
      bathrooms: "+�+�+�+�+�+�+�+�",
      propertySize: "+� +�+�+� +�+�+�+�+�+�",
      landSizeOptional: "+� +�+�+��� +�+�+�+�+�+� (+�+�+���+�+�+�)",
      documentType: "+� +�+�+� +�+�+�",
      ownerAgent: "+�+�+�+� / +�+�+�++",
      owner: "+�+�+�+�",
      agent: "+�+�+�++",
      studentHousing: "+� +�+�+�G��+�+�+�+�+�+� +�+�+�+�+�+�+���",
      suitableForStudentsQuestion: "+���+� +�+� +� +�+�+�G��+�+�+�+�+�+� +�+++�+�+� +�+�+�+�+� +���+�",
      yes: "+�+�",
      no: "+�+�",
      genderSuitable: "+�+�+�+�+� +�+�+���+�",
      distanceToUniversity: "+�+� +++�+�+�+�+�+� +�+�+++� (+���+�+�+�+�+�)",
      furnished: "+�+�+��+�+� +�+�+�+�+���",
      sharedAllowed: "+�+���+�+�+� +�+�+�+�+� +�+�+�",
      numberOfStudentsAllowed: "+� +�+�+�G��+�+�+�+�+�+� +� +�+��+� +�+�+�+�+�",
      dormitoryDetails: "+� +��+��� +�+�+���+�+�",
      paymentPeriod: "+� ++��+�+� +�+�+�+�",
      genderAllowed: "+�+�+�+�+� +�+�� +�+�+���+�",
      roomType: "+� +�+�+�� +�+�+�",
      numberOfBeds: "+� +�+�+�+�+�+�+� +�+��+�",
      mealsIncluded: "+�+�+�+�+� +�+�+�+�",
      water: "+�+�+�+�",
      electricity: "+�+���+�+�+�",
      internet: "+�+�+++�+��++",
      heating: "+�+�+�+�+�+��",
      airConditioning: "+���+�+�+�+��+�+�",
      security: "+�+�+��+�",
      rulesOptional: "+�+�+�+�+� (+�+�+���+�+�+�)",
      studentHousingCollectionDetails: "+� +�+�+�G��+�+�+�+�+�+� +�+�+�+�+�+�� +++�+�+��� +�+�+���+�+�",
      propertyType: "+� +�+�+� +�+�+�",
      house: "+�+�+�",
      apartment: "+�+++�+�+�+�+�+�",
      room: "+�+�+�+�",
      dormitory: "+��+��+�",
      vehicleDetails: "+� +�+�+++� +�+�+���+�+�",
      brand: "+�+�+�+�+�",
      model: "+�+�+�+�",
      year: "+�+�+�",
      km: "+���+�+�+�+�+�",
      fuelType: "+� +���+�+� +�+�+�",
      transmission: "+��ɦ�+�",
      condition: "+�+�+�+�",
      plateStatus: "+� +++��++ +�+�+�+�",
      damagePaintReport: "+� +�+�+� / +���+�+� +�+�+++�+�",
      phonesElectronicsDetails: "+� +�+�+�+���+� +�+� +�+�+�+�+�+�+��+� +�+�+���+�+�",
      storage: "+�+�+�+++�",
      ramOptional: "+�+�+� (+�+�+���+�+�+�)",
      warranty: "+�+�+�+�+�+�",
      secondHandDetails: "+�+�+�+� +�+�+� +�+�+���+�+�",
      itemType: "+� +�+�+�+� +�+�+�",
      brandOptional: "+�+�+�+�+� (+�+�+���+�+�+�)",
      additionalCategoryFields: "+�+�+�+�+� +�+++�+�+�+� +���+�+�+�+�+�",
      confirmRules: "+�+� +�+����+�+�+� +�� +�+� +�+�+�+�+� +� +�+�+�+�+�+� +�+� +�+�+�+�+� +�+�+� +�+� +���.",
      photosStepTitle: "3. +�+�+�+�+�+�+�+�",
      photosRequired: "+++� +��� +�+++�+�+��� +��� +�+�+�+�+�+�+�+� +�+���+� +�+�.",
      photosOptional: "+++� +��� +�+++�+�+��� +��� +�+�+�+�+�+�+�+� +�+�+���+�+�+� +�+�.",
      recommended: "+�+++�+�+�+�+�+�",
      addPhotos: "+�+�+�+�+�+�+�+� +�+�+�+�+� +�+�+�",
      primary: "+�+�+�+�",
      remove: "+�+���",
      addMore: "+�+�+� +�+�+�+�+� +�+�+�",
      whereLocated: "+�+� +�+�+��� +��+��� +�+�+�+���+� +�+�+�+�",
      chooseLocationMethod: "+� +�+��� +++�+�+�+� +++���+�+� +�+++�+�+�.",
      useMyLocation: "+�+�+� +�+��� +�+�+�+�+�+�",
      detectAutomatically: "+�+�+�+�+� +�+� +�+���+�� +++� +�+�+�+�+�+� +�+�+� +�+�+�+�+��+�+�.",
      manualLocation: "+�+�+�+� +�+���",
      chooseProvinceDistrict: "+�+�+���+� +�+� +�+�+�+�+�+�� +++�+++�+� +�+++�+�+�.",
      detectingLocation: "+�+�+�+�+� +� +�+���+�� +�+��� +�+�+�+�+��+�+�...",
      province: "+�+�+���+�",
      district: "+�+�+�+�+�+�+�",
      areaNeighborhoodOptional: "+���+�+� / +�+�+���+� (+�+�+���+�+�+�)",
      locationVisibility: "+� +�+��� +�+�+�+�+� +�+�+�",
      hideExactShowProvinceDistrict: "+�+��+� +�+��� +++++� ��+�+�+��� +�+�+���+�/+�+�+�+�+�+�+� +�+�+�+�+�",
      showApproximateLocation: "+�+�+��� +�+�+�+���+� +�+�+�+�+� +�+�+�",
      showExactLocation: "+�+��+� +�+�+�+���+� +�+�+�+�+� +�+�+�",
      detectedLocation: "+�+�+�+�+� +�+�� +�+���",
      latitude: "+�+�+� +�+�+�+�+�",
      longitude: "+++�+� +�+�+�+�+�",
      accuracy: "+�+�+�",
      unknown: "+�+�+�+�+�+�+�",
      confirmLocation: "+�+��� +�+����+� +�+�+�",
      previewStepTitle: "+�+�+�+�+�+�",
      publishStepTitle: "+�+++�+�+�",
      publishReady: "+�+�+�+�+� +�+�+�+�+� +�+�+�+� +���. +� +���+�+�+�+�� +�+++�+�+� +�+++�+�+� +���+�+�+�+�.",
      categoryLabel: "+�+++�+�+�+�",
      provinceDistrict: "+�+�+���+� / +�+�+�+�+�+��",
      photosLabel: "+�+�+�+�+�+�+�+�",
      back: "+�+�+�+�",
      continue: "+�+�+�+�",
      publishing: "+�+++���+�+�...",
    },
    postAdElectronics: {
      phonesElectronics: "+�+�+�+���+� +�+� +�+�+�+�+�+�+��+�",
      category: "+�+++�+�+�+�",
      brandModel: "+�+�+�+�+� +�+� +�+�+�+�",
      details: "+�+�+���+�+�",
      photos: "+�+�+�+�+�+�+�+�",
      location: "+�+���",
      preview: "+�+�+�+�+�+�",
      chooseSubcategory: "+� +�+�+�+���+� +�+� +�+�+�+�+�+�+��+� ��+�+� +�+�+�+� +�+++�+�+�+� +�+++�+�+�.",
      popularBrandsHint: "+�+�+�+�+� +�+�+�+�+�+�+�+� +� +�+++� +�+�+�+�+� +�+++�+�+� +�+�+�+���+�+�+� +�+�+�.",
      selectBrand: "+�+�+�+�+� +�+++�+�+�",
      selectModel: "+�+�+�+� +�+++�+�+�",
      cantFindModel: "+�+++� +�+�+�+� +�+� +�+�+�+�+� +�+�+�+� ��� +�+�+�+� +�+�+�.",
      manualBrand: "+�+�+�+� +�+�+�+�+�",
      manualModel: "+�+�+�+� +�+�+�+�",
      knownSpecs: "+�+�+�+�+� +�+�+�+�+�+�",
      storage: "+�+�+�+++�",
      color: "+�+�+�",
      batteryHealthOptional: "+� +���+++��� +�+�+�+���+� (+�+�+���+�+�+�)",
      warranty: "+�+�+�+�+�+�",
      repairHistory: "+� +�+�+��+� +�+�+���+�",
      networkRegistered: "+�+�+�+� +�+�+�",
      boxIncluded: "+�+�+� +�+�+�+�",
      chargerIncluded: "+�+�+�+�+� +�+�+�+�",
      photosRequiredMin: "+�+�+�+�+�+�+�+� +�+���+� +�+�. +�+� +�+� +�+�+�",
      photosOptional: "+�+�+�+�+�+�+�+� +�+�+���+�+�+� +�+�.",
      areaOptional: "+���+�+� (+�+�+���+�+�+�)",
      path: "+�+�+�+�",
      locationLabel: "+�+���",
    },
  },
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
      platform: "صاحباش",
      tagline: "بازار آنلاین افغانستان با اعلان های قابل اعتماد.",
    },
    auth: {
      loginTitle: "ورود",
      registerTitle: "ثبت نام",
      fullName: "نام کامل",
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
      platform: "صاحباش",
      tagline: "د افغانستان بازار د باوري اعلانونو لپاره.",
    },
    auth: {
      loginTitle: "ننوتل",
      registerTitle: "راجسټر",
      fullName: "بشپړ نوم",
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
  const overrides = CRITICAL_TRANSLATION_OVERRIDES[locale];
  const merged = overrides
    ? (mergeOverrides(safeTree, overrides) as TranslationTree)
    : (safeTree as TranslationTree);

  if (missingKeys.length > 0) {
    console.warn(`[i18n] Missing translations for locale ${locale}: ${missingKeys.join(", ")}`);
  }

  return merged;
}
