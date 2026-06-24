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
    listingNo: string;
    listingDate: string;
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
      listingNo: "Listing No",
      listingDate: "Listing Date",
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
      postAd: "ثبت اعلان",
      admin: "مدیریت",
      myProfile: "پروفایل من",
      logout: "خروج",
      login: "ورود",
      register: "ثبت نام",
      language: "زبان",
    },
    footer: {
      platform: "صاحباش",
      tagline: "بازار آنلاین افغانستان با اعلان‌های قابل اعتماد.",
    },
    home: {
      heroTitle: "بهترین معامله‌ها را در سراسر افغانستان پیدا کنید",
      heroSubtitle:
        "خرید، فروش، کرایه یا ثبت اعلان نیازمندی در وسایط، املاک، موبایل و اجناس دست‌دوم.",
      searchPlaceholder: "جستجو بر اساس عنوان، برند، مدل...",
      allAfghanistan: "تمام افغانستان",
      districtPlaceholder: "ولسوالی (اختیاری)",
      searchButton: "جستجو",
      postAd: "ثبت اعلان",
      browseListings: "دیدن اعلان‌ها",
      mainCategories: "دسته‌بندی‌های اصلی",
      openCategoryBrowser: "باز کردن تمام دسته‌بندی‌ها",
      moreCategories: "دسته‌بندی‌های بیشتر",
      comingSoon: "به زودی",
      featuredListings: "اعلان‌های ویژه",
      latestListings: "جدیدترین اعلان‌ها",
    },
    search: {
      title: "جستجوی هوشمند",
      subtitle: "فلترها بر اساس دسته‌بندی و کلمات شما تنظیم می‌شوند.",
      intentDetected: "هدف تشخیص شد",
      brand: "برند",
      model: "مدل",
      related: "مرتبط",
      subcategory: "زیردسته",
      searchListings: "جستجوی اعلان‌ها",
      district: "ولسوالی",
      allCategories: "تمام دسته‌بندی‌ها",
      newest: "جدیدترین",
      relevant: "مرتبط‌ترین",
      priceLowHigh: "قیمت: کم به زیاد",
      priceHighLow: "قیمت: زیاد به کم",
      allAdTypes: "تمام نوع اعلان",
      forSale: "برای فروش",
      wanted: "نیازمندی",
      any: "همه",
      yes: "بلی",
      no: "نخیر",
      applyFilters: "اعمال فلترها",
      clearAll: "پاک کردن همه",
      showing: "نمایش",
      noResults: "هیچ اعلانی با این فلترها پیدا نشد. یک یا دو مورد را حذف کنید.",
      filters: "فلترها",
      close: "بستن",
      reset: "تنظیم مجدد",
      apply: "اعمال",
    },
    listing: {
      backToListings: "برگشت به اعلان‌ها",
      category: "دسته‌بندی",
      wantedAd: "اعلان نیازمندی",
      suitableForStudents: "این مکان برای محصلان مناسب است.",
      posted: "تاریخ ثبت",
      vehicleSummary: "خلاصه موتر",
      sellerInformation: "معلومات فروشنده",
      name: "نام",
      phone: "شماره تماس",
      joined: "عضویت",
      minimumOffer: "حداقل پیشنهاد",
      callSeller: "تماس با فروشنده",
      message: "پیام",
      offer: "پیشنهاد",
      description: "توضیحات",
      video: "ویدیو",
      openVehicleVideo: "باز کردن ویدیوی موتر",
      featureChecklist: "لیست امکانات",
      additionalDetails: "جزئیات اضافی",
      specifications: "مشخصات",
      noAdditionalDetails: "جزئیات اضافی ثبت نشده است.",
      autoFilledSpecifications: "مشخصات تکمیل‌شده خودکار",
      buyerSafetyWarning: "هشدار امنیتی برای خریدار",
      safety1: "قبل از دیدن موتر، پیش‌پرداخت نفرستید.",
      safety2: "اسناد موتر را بررسی کنید.",
      safety3: "در صورت امکان در مکان امن عمومی ملاقات کنید.",
      safety4: "قبل از پرداخت، مالکیت را تایید کنید.",
      addToFavorites: "افزودن به علاقه‌مندی‌ها",
      reportListing: "گزارش اعلان",
      selectReportReason: "دلیل گزارش را انتخاب کنید",
      fraudOrScam: "کلاه‌برداری",
      wrongCategory: "دسته‌بندی اشتباه",
      duplicateListing: "اعلان تکراری",
      prohibitedOrUnsafeItem: "مورد غیرمجاز یا ناامن",
      spamOrMisleading: "اسپم یا گمراه‌کننده",
      other: "سایر",
      optionalDetails: "جزئیات اختیاری",
      sendMessage: "ارسال پیام",
      hiAvailability: "سلام، آیا هنوز موجود است؟",
      sendYourOffer: "پیشنهاد خود را ارسال کنید",
      enterOfferedPrice: "قیمت پیشنهادی خود را وارد کنید",
      optionalNoteToSeller: "یادداشت اختیاری برای فروشنده",
      sendOffer: "ارسال پیشنهاد",
      call: "تماس",
      close: "بستن",
      listingNo: "شماره اعلان",
      listingDate: "تاریخ اعلان",
    },
    postAd: {
      postAd: "ثبت اعلان",
      step: "مرحله",
      of: "از",
      category: "دسته‌بندی",
      details: "جزئیات",
      photos: "عکس‌ها",
      location: "موقعیت",
      preview: "پیش‌نمایش",
      publish: "نشر",
      categoryStepTitle: "1. دسته‌بندی",
      categoryStepSubtitle: "ابتدا دسته‌بندی اصلی را انتخاب کنید و تا سطح نهایی بروید.",
      backOneLevel: "یک مرحله برگشت",
      loading: "در حال بارگذاری...",
      finalCategorySelected: "دسته‌بندی نهایی انتخاب شد",
      comingSoon: "به زودی",
      notifyMe: "به من خبر بده",
      detailsStepTitle: "2. جزئیات",
      detailsStepSubtitle: "فورم بر اساس مسیر دسته‌بندی انتخابی شما تغییر می‌کند.",
      categoryNotSelected: "دسته‌بندی انتخاب نشده",
      title: "عنوان",
      description: "توضیحات",
      price: "قیمت",
      currency: "واحد پول",
      contactPhone: "شماره تماس",
      contactName: "نام تماس",
      contactPreferences: "روش تماس",
      contactPreferencesPlaceholder: "تماس، واتساپ، پیام و غیره",
      locationMovedNote: "موقعیت به مرحله جداگانه نزدیک پایان منتقل شده است.",
      realEstateDetails: "جزئیات املاک",
      listingPurpose: "هدف اعلان",
      select: "انتخاب کنید",
      forSale: "برای فروش",
      forRent: "برای کرایه",
      gerawyRahn: "گروی / رهن",
      exchange: "تبدیل",
      wanted: "نیازمندی",
      rooms: "اتاق‌ها",
      bathrooms: "حمام‌ها",
      propertySize: "متراژ ملک",
      landSizeOptional: "متراژ زمین (اختیاری)",
      documentType: "نوع سند",
      ownerAgent: "مالک / نماینده",
      owner: "مالک",
      agent: "نماینده",
      studentHousing: "اسکان محصلان",
      suitableForStudentsQuestion: "آیا برای محصلان مناسب است؟",
      yes: "بلی",
      no: "نخیر",
      genderSuitable: "مناسب برای جنسیت",
      distanceToUniversity: "فاصله تا پوهنتون (کیلومتر)",
      furnished: "مبله",
      sharedAllowed: "اشتراک مجاز",
      numberOfStudentsAllowed: "تعداد محصلان مجاز",
      dormitoryDetails: "جزئیات خوابگاه",
      paymentPeriod: "دوره پرداخت",
      genderAllowed: "جنسیت مجاز",
      roomType: "نوع اتاق",
      numberOfBeds: "تعداد بستر",
      mealsIncluded: "غذا شامل است",
      water: "آب",
      electricity: "برق",
      internet: "اینترنت",
      heating: "گرمایش",
      airConditioning: "تهویه",
      security: "امنیت",
      rulesOptional: "قوانین (اختیاری)",
      studentHousingCollectionDetails: "جزئیات مجموعه اسکان محصلان",
      propertyType: "نوع ملک",
      house: "خانه",
      apartment: "آپارتمان",
      room: "اتاق",
      dormitory: "خوابگاه",
      vehicleDetails: "جزئیات موتر",
      brand: "برند",
      model: "مدل",
      year: "سال",
      km: "کیلومتر",
      fuelType: "نوع تیل",
      transmission: "گیربکس",
      condition: "وضعیت",
      plateStatus: "وضعیت نمبر پلیت",
      damagePaintReport: "گزارش رنگ / آسیب",
      phonesElectronicsDetails: "جزئیات موبایل و الکترونیک",
      storage: "حافظه",
      ramOptional: "رم (اختیاری)",
      warranty: "گارانتی",
      secondHandDetails: "جزئیات دست‌دوم",
      itemType: "نوع جنس",
      brandOptional: "برند (اختیاری)",
      additionalCategoryFields: "فیلدهای اضافی دسته‌بندی",
      confirmRules: "تایید می‌کنم این اعلان مطابق قوانین صاحباش است.",
      photosStepTitle: "3. عکس‌ها",
      photosRequired: "عکس برای این دسته‌بندی الزامی است.",
      photosOptional: "عکس برای این دسته‌بندی اختیاری است.",
      recommended: "پیشنهادی",
      addPhotos: "افزودن عکس",
      primary: "اصلی",
      remove: "حذف",
      addMore: "افزودن بیشتر",
      whereLocated: "این مورد کجا موقعیت دارد؟",
      chooseLocationMethod: "روش افزودن موقعیت را انتخاب کنید.",
      useMyLocation: "استفاده از موقعیت من",
      detectAutomatically: "به طور خودکار از دستگاه شما تشخیص می‌شود.",
      manualLocation: "موقعیت دستی",
      chooseProvinceDistrict: "ولایت و ولسوالی را خودتان انتخاب کنید.",
      detectingLocation: "در حال تشخیص موقعیت دستگاه...",
      province: "ولایت",
      district: "ولسوالی",
      areaNeighborhoodOptional: "ساحه / ناحیه (اختیاری)",
      locationVisibility: "نمایش موقعیت",
      hideExactShowProvinceDistrict: "موقعیت دقیق پنهان، فقط ولایت/ولسوالی نمایش شود",
      showApproximateLocation: "نمایش موقعیت تقریبی",
      showExactLocation: "نمایش موقعیت دقیق",
      detectedLocation: "موقعیت تشخیص‌شده",
      latitude: "عرض جغرافیایی",
      longitude: "طول جغرافیایی",
      accuracy: "دقت",
      unknown: "نامشخص",
      confirmLocation: "تایید موقعیت",
      previewStepTitle: "پیش‌نمایش",
      publishStepTitle: "نشر",
      publishReady: "اعلان شما آماده است. برای ارسال جهت بررسی، نشر را بزنید.",
      categoryLabel: "دسته‌بندی",
      provinceDistrict: "ولایت / ولسوالی",
      photosLabel: "عکس‌ها",
      back: "برگشت",
      continue: "ادامه",
      publishing: "در حال نشر...",
    },
    postAdElectronics: {
      phonesElectronics: "موبایل و الکترونیک",
      category: "دسته‌بندی",
      brandModel: "برند و مدل",
      details: "جزئیات",
      photos: "عکس‌ها",
      location: "موقعیت",
      preview: "پیش‌نمایش",
      chooseSubcategory: "یک زیردسته موبایل و الکترونیک انتخاب کنید.",
      popularBrandsHint: "برندهای محبوب برای ثبت سریع‌تر در اولویت هستند.",
      selectBrand: "انتخاب برند",
      selectModel: "انتخاب مدل",
      cantFindModel: "مدل خود را پیدا نمی‌کنید؟ دستی وارد کنید.",
      manualBrand: "برند دستی",
      manualModel: "مدل دستی",
      knownSpecs: "مشخصات شناخته‌شده",
      storage: "حافظه",
      color: "رنگ",
      batteryHealthOptional: "سلامت باتری (اختیاری)",
      warranty: "گارانتی",
      repairHistory: "سابقه ترمیم",
      networkRegistered: "ثبت شبکه",
      boxIncluded: "باکس موجود است",
      chargerIncluded: "شارژر موجود است",
      photosRequiredMin: "عکس الزامی است. حداقل",
      photosOptional: "عکس اختیاری است.",
      areaOptional: "ساحه (اختیاری)",
      path: "مسیر",
      locationLabel: "موقعیت",
    },
  },
  ps: {
    header: {
      postAd: "اعلان ثبت کړئ",
      admin: "اډمین",
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
    home: {
      heroTitle: "په ټوله افغانستان کې غوره معاملې ومومئ",
      heroSubtitle:
        "موټر، جایداد، موبایل او دوهم لاس توکي واخلئ، وپلورئ، کرایه کړئ یا د اړتیا اعلان ورکړئ.",
      searchPlaceholder: "د سرلیک، برانډ، ماډل له مخې لټون...",
      allAfghanistan: "ټول افغانستان",
      districtPlaceholder: "ولسوالي (اختیاري)",
      searchButton: "لټون",
      postAd: "اعلان ثبت کړئ",
      browseListings: "اعلانونه وګورئ",
      mainCategories: "اصلي کټګورۍ",
      openCategoryBrowser: "بشپړ کټګوري لټون پرانیزئ",
      moreCategories: "نورې کټګورۍ",
      comingSoon: "ژر راځي",
      featuredListings: "ځانګړي اعلانونه",
      latestListings: "وروستي اعلانونه",
    },
    search: {
      title: "هوښیار لټون",
      subtitle: "فلټرونه ستاسو کټګورۍ او کلیمو ته برابرېږي.",
      intentDetected: "موخه وپېژندل شوه",
      brand: "برانډ",
      model: "ماډل",
      related: "اړوند",
      subcategory: "فرعي کټګوري",
      searchListings: "اعلانونه ولټوئ",
      district: "ولسوالي",
      allCategories: "ټولې کټګورۍ",
      newest: "نوي",
      relevant: "تر ټولو اړوند",
      priceLowHigh: "بیه: ټیټه تر لوړې",
      priceHighLow: "بیه: لوړه تر ټیټې",
      allAdTypes: "د اعلان ټول ډولونه",
      forSale: "د پلور لپاره",
      wanted: "اړتیا",
      any: "هر څه",
      yes: "هو",
      no: "نه",
      applyFilters: "فلټرونه پلي کړئ",
      clearAll: "ټول پاک کړئ",
      showing: "ښودل کېږي",
      noResults: "له دې فلټرونو سره اعلان ونه موندل شو. یو یا دوه فلټرونه لرې کړئ.",
      filters: "فلټرونه",
      close: "بندول",
      reset: "بیا تنظیم",
      apply: "پلي کول",
    },
    listing: {
      backToListings: "اعلانونو ته بېرته",
      category: "کټګوري",
      wantedAd: "د اړتیا اعلان",
      suitableForStudents: "دا ځای د زده‌کوونکو لپاره مناسب دی.",
      posted: "خپور شوی",
      vehicleSummary: "د موټر لنډیز",
      sellerInformation: "د پلورونکي معلومات",
      name: "نوم",
      phone: "شمېره",
      joined: "ګډون",
      minimumOffer: "تر ټولو لږ وړاندیز",
      callSeller: "پلورونکي ته زنګ",
      message: "پیغام",
      offer: "وړاندیز",
      description: "تشریح",
      video: "ویډیو",
      openVehicleVideo: "د موټر ویډیو پرانیزئ",
      featureChecklist: "د ځانګړنو لېست",
      additionalDetails: "اضافي جزئیات",
      specifications: "مشخصات",
      noAdditionalDetails: "اضافي جزئیات نه دي ورکړل شوي.",
      autoFilledSpecifications: "په خپله ډک شوي مشخصات",
      buyerSafetyWarning: "د پېرودونکي خوندیتوب خبرداری",
      safety1: "د موټر له لیدلو مخکې پیسې مه لېږئ.",
      safety2: "د موټر اسناد وګورئ.",
      safety3: "که ممکن وي په خوندي عامه ځای کې ووینئ.",
      safety4: "له پیسو مخکې د مالکیت تایید وکړئ.",
      addToFavorites: "خوښې ته اضافه کړئ",
      reportListing: "اعلان راپور کړئ",
      selectReportReason: "د راپور دلیل وټاکئ",
      fraudOrScam: "درغلي",
      wrongCategory: "ناسمه کټګوري",
      duplicateListing: "تکراري اعلان",
      prohibitedOrUnsafeItem: "منع یا ناامن توکی",
      spamOrMisleading: "سپم یا ګمراه کوونکی",
      other: "نور",
      optionalDetails: "اختیاري جزئیات",
      sendMessage: "پیغام ولېږئ",
      hiAvailability: "سلام، ایا دا لا هم شته؟",
      sendYourOffer: "خپل وړاندیز ولېږئ",
      enterOfferedPrice: "خپل وړاندیز شوی قیمت دننه کړئ",
      optionalNoteToSeller: "پلورونکي ته اختیاري یادښت",
      sendOffer: "وړاندیز ولېږئ",
      call: "زنګ",
      close: "بندول",
      listingNo: "د اعلان شمېره",
      listingDate: "د اعلان نېټه",
    },
    postAd: {
      postAd: "اعلان ثبت",
      step: "پړاو",
      of: "له",
      category: "کټګوري",
      details: "جزئیات",
      photos: "انځورونه",
      location: "ځای",
      preview: "مخکتنه",
      publish: "خپرول",
      categoryStepTitle: "1. کټګوري",
      categoryStepSubtitle: "لومړی اصلي کټګوري وټاکئ، بیا تر وروستي کچې لاړ شئ.",
      backOneLevel: "یوه کچه شاته",
      loading: "لوډېږي...",
      finalCategorySelected: "وروستۍ کټګوري وټاکل شوه",
      comingSoon: "ژر راځي",
      notifyMe: "خبر راکړئ",
      detailsStepTitle: "2. جزئیات",
      detailsStepSubtitle: "فورم ستاسو ټاکلې کټګورۍ سره برابرېږي.",
      categoryNotSelected: "کټګوري نه ده ټاکل شوې",
      title: "سرلیک",
      description: "تشریح",
      price: "بیه",
      currency: "کرنسي",
      contactPhone: "د اړیکې شمېره",
      contactName: "د اړیکې نوم",
      contactPreferences: "د اړیکې لاره",
      contactPreferencesPlaceholder: "زنګ، واټساپ، پیغام او نور",
      locationMovedNote: "ځای د پای ته نږدې جلا پړاو ته انتقال شوی.",
      realEstateDetails: "د جایداد جزئیات",
      listingPurpose: "د اعلان موخه",
      select: "وټاکئ",
      forSale: "د پلور لپاره",
      forRent: "د کرایې لپاره",
      gerawyRahn: "ګروي / رهن",
      exchange: "بدلون",
      wanted: "اړتیا",
      rooms: "خونې",
      bathrooms: "تشنابونه",
      propertySize: "د ملک اندازه",
      landSizeOptional: "د ځمکې اندازه (اختیاري)",
      documentType: "د سند ډول",
      ownerAgent: "مالک / اجنټ",
      owner: "مالک",
      agent: "اجنټ",
      studentHousing: "د زده‌کوونکو هستوګنځی",
      suitableForStudentsQuestion: "ایا دا د زده‌کوونکو لپاره مناسب دی؟",
      yes: "هو",
      no: "نه",
      genderSuitable: "مناسب جنسیت",
      distanceToUniversity: "تر پوهنتون واټن (کیلومتر)",
      furnished: "فرنیچر لرونکی",
      sharedAllowed: "شریکول اجازه لري",
      numberOfStudentsAllowed: "د زده‌کوونکو د شمېر اجازه",
      dormitoryDetails: "د لیلیې جزئیات",
      paymentPeriod: "د پیسو موده",
      genderAllowed: "اجازه شوی جنسیت",
      roomType: "د خونې ډول",
      numberOfBeds: "د بسترونو شمېر",
      mealsIncluded: "خواړه شامل",
      water: "اوبه",
      electricity: "برېښنا",
      internet: "انټرنېټ",
      heating: "ګرموالی",
      airConditioning: "ایرکنډیشن",
      security: "امنیت",
      rulesOptional: "قواعد (اختیاري)",
      studentHousingCollectionDetails: "د زده‌کوونکو هستوګنې ټولګې جزئیات",
      propertyType: "د ملک ډول",
      house: "کور",
      apartment: "اپارتمان",
      room: "خونه",
      dormitory: "لیلیه",
      vehicleDetails: "د موټر جزئیات",
      brand: "برانډ",
      model: "ماډل",
      year: "کال",
      km: "کیلومتر",
      fuelType: "د تېلو ډول",
      transmission: "ګېیر",
      condition: "حالت",
      plateStatus: "د پلیټ حالت",
      damagePaintReport: "د رنګ / زیان راپور",
      phonesElectronicsDetails: "د موبایل او الکترونیک جزئیات",
      storage: "حافظه",
      ramOptional: "رام (اختیاري)",
      warranty: "ګارنتي",
      secondHandDetails: "دوهم لاس جزئیات",
      itemType: "د توکي ډول",
      brandOptional: "برانډ (اختیاري)",
      additionalCategoryFields: "اضافي کټګوري فیلډونه",
      confirmRules: "زه تاییدوم چې دا اعلان د صاحباش له اصولو سره سم دی.",
      photosStepTitle: "3. انځورونه",
      photosRequired: "په دې کټګورۍ کې انځورونه اړین دي.",
      photosOptional: "په دې کټګورۍ کې انځورونه اختیاري دي.",
      recommended: "سپارښتنه",
      addPhotos: "انځورونه اضافه کړئ",
      primary: "اصلي",
      remove: "لرې",
      addMore: "نور اضافه کړئ",
      whereLocated: "دا توکی چیرې موقعیت لري؟",
      chooseLocationMethod: "د ځای ټاکلو طریقه وټاکئ.",
      useMyLocation: "زما ځای وکاروه",
      detectAutomatically: "ستاسو له وسیلې په اتومات ډول معلومېږي.",
      manualLocation: "لاسي ځای",
      chooseProvinceDistrict: "ولایت او ولسوالۍ پخپله وټاکئ.",
      detectingLocation: "ستاسو د وسیلې ځای معلومېږي...",
      province: "ولایت",
      district: "ولسوالي",
      areaNeighborhoodOptional: "سیمه / ناحیه (اختیاري)",
      locationVisibility: "د ځای ښکاره کول",
      hideExactShowProvinceDistrict: "دقیق ځای پټ، یوازې ولایت/ولسوالي ښکاره",
      showApproximateLocation: "نږدې موقعیت ښکاره کړئ",
      showExactLocation: "دقیق موقعیت ښکاره کړئ",
      detectedLocation: "معلوم شوی ځای",
      latitude: "عرض البلد",
      longitude: "طول البلد",
      accuracy: "دقت",
      unknown: "نامعلوم",
      confirmLocation: "ځای تایید کړئ",
      previewStepTitle: "مخکتنه",
      publishStepTitle: "خپرول",
      publishReady: "ستاسو اعلان چمتو دی. د بیاکتنې لپاره خپرول کېکاږئ.",
      categoryLabel: "کټګوري",
      provinceDistrict: "ولایت / ولسوالۍ",
      photosLabel: "انځورونه",
      back: "شاته",
      continue: "دوام",
      publishing: "خپرېږي...",
    },
    postAdElectronics: {
      phonesElectronics: "موبایل او الکترونیک",
      category: "کټګوري",
      brandModel: "برانډ او ماډل",
      details: "جزئیات",
      photos: "انځورونه",
      location: "ځای",
      preview: "مخکتنه",
      chooseSubcategory: "د موبایل او الکترونیک یوه فرعي کټګوري وټاکئ.",
      popularBrandsHint: "مشهور برانډونه د چټک اعلان لپاره لومړیتوب لري.",
      selectBrand: "برانډ وټاکئ",
      selectModel: "ماډل وټاکئ",
      cantFindModel: "خپل ماډل نه مومئ؟ لاسي یې داخل کړئ.",
      manualBrand: "لاسي برانډ",
      manualModel: "لاسي ماډل",
      knownSpecs: "معلوم مشخصات",
      storage: "حافظه",
      color: "رنګ",
      batteryHealthOptional: "د بیټرۍ روغتیا (اختیاري)",
      warranty: "ګارنتي",
      repairHistory: "د ترمیم تاریخ",
      networkRegistered: "شبکه ثبت",
      boxIncluded: "بکس شامل",
      chargerIncluded: "چارجر شامل",
      photosRequiredMin: "انځورونه اړین دي. لږ تر لږه",
      photosOptional: "انځورونه اختیاري دي.",
      areaOptional: "سیمه (اختیاري)",
      path: "لاره",
      locationLabel: "ځای",
    },
  },
};
