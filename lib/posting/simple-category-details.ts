import {
  ELECTRONICS_LEAF_CONFIGS,
  detectElectronicsLeafKey,
  type ElectronicsLeafKey,
} from "@/data/categories";

function mapElectronicsLeafToSimpleKind(leaf: ElectronicsLeafKey | null): SimpleCategoryKind | null {
  switch (leaf) {
    case "electronics_mobile_phones":
    case "electronics_mobile_accessories":
      return "mobilePhone";
    case "electronics_tablets":
      return "tablet";
    case "electronics_smart_watches":
      return "smartWatch";
    default:
      return null;
  }
}

export type SimpleCategoryKind =
  | "car"
  | "motorcycle"
  | "mobilePhone"
  | "tablet"
  | "smartWatch"
  | "phoneAccessory"
  | "house"
  | "apartment"
  | "room"
  | "land"
  | "shop"
  | "office"
  | "warehouse"
  | ElectronicsLeafKey
  | "fallback";
export type SimpleLocale = "en" | "fa" | "ps";

export type SimpleOption = {
  value: string;
  label: Record<SimpleLocale, string>;
};

export type SimpleField = {
  key: string;
  label: Record<SimpleLocale, string>;
  type: "text" | "number" | "date" | "select" | "multiselect" | "textarea";
  required?: boolean;
  allowCustom?: boolean;
  unit?: string;
  min?: number;
  max?: number;
  options?: SimpleOption[];
  dependsOn?: string;
};

export type SimpleCard = {
  key: string;
  label: Record<SimpleLocale, string>;
  unit?: string;
};

export type SimpleRow = {
  key: string;
  label: Record<SimpleLocale, string>;
};

export type SimpleCategoryConfig = {
  kind: SimpleCategoryKind;
  title: Record<SimpleLocale, string>;
  emptyMaintenance: Record<SimpleLocale, string>;
  maintenanceTitle: Record<SimpleLocale, string>;
  featureTitle: Record<SimpleLocale, string>;
  fields: SimpleField[];
  topCards: SimpleCard[];
  rows: SimpleRow[];
  featureOptions: SimpleOption[];
  makeModels: Record<string, string[]>;
};

const TEXT = {
  car: { en: "Vehicle Details", fa: "جزئیات وسیله", ps: "تفصیلات وسیله" },
  motorcycle: { en: "Motorcycle Details", fa: "جزئیات موترسایکل", ps: "د موټرسایکل تفصیلات" },
  mobilePhone: { en: "Phone Details", fa: "جزئیات موبایل", ps: "د موبایل تفصیلات" },
  tablet: { en: "Tablet Details", fa: "جزئیات تبلت", ps: "د ټابلیټ تفصیلات" },
  smartWatch: { en: "Smart Watch Details", fa: "جزئیات ساعت هوشمند", ps: "د هوښیار ساعت تفصیلات" },
  phoneAccessory: { en: "Phone Details", fa: "جزئیات موبایل", ps: "د موبایل تفصیلات" },
  property: { en: "Property Details", fa: "جزئیات ملکیت", ps: "د ملکیت تفصیلات" },
} as const;

const CAR_MAKES_MODELS: Record<string, string[]> = {
  Toyota: ["Corolla", "Camry", "Prius", "Aqua", "Yaris", "Vitz", "Land Cruiser", "Land Cruiser Prado", "Hilux", "Fortuner", "RAV4", "Harrier", "Other"],
  Honda: ["Civic", "Accord", "Fit", "City", "CR-V", "HR-V", "Other"],
  Nissan: ["Sunny", "Sentra", "Sylphy", "Note", "X-Trail", "Patrol", "Other"],
  Hyundai: ["Tucson", "Santa Fe", "Elantra", "Sonata", "Accent", "Other"],
  Kia: ["Sportage", "Sorento", "Picanto", "Rio", "Cerato", "Other"],
  Suzuki: ["Alto", "Swift", "Wagon R", "Cultus", "Bolan", "Other"],
  Mitsubishi: ["Pajero", "Outlander", "Lancer", "Other"],
  Mazda: ["Mazda 3", "Mazda 6", "CX-5", "CX-9", "Other"],
  Subaru: ["Forester", "Impreza", "Outback", "Other"],
  Lexus: ["RX", "LX", "NX", "ES", "Other"],
  "Mercedes-Benz": ["C-Class", "E-Class", "S-Class", "GLE", "G-Class", "Other"],
  BMW: ["3 Series", "5 Series", "X3", "X5", "Other"],
  Audi: ["A4", "A6", "Q5", "Q7", "Other"],
  Volkswagen: ["Golf", "Passat", "Jetta", "Tiguan", "Other"],
  Ford: ["Ranger", "Explorer", "Focus", "Other"],
  Chevrolet: ["Cruze", "Malibu", "Tahoe", "Other"],
  Jeep: ["Wrangler", "Cherokee", "Grand Cherokee", "Other"],
  Isuzu: ["D-Max", "Elf", "Other"],
  Hino: ["Dutro", "Ranger", "Other"],
  Peugeot: ["206", "405", "508", "Other"],
  Renault: ["Logan", "Duster", "Other"],
  Changan: ["Alsvin", "CS35", "CS75", "Other"],
  Geely: ["Emgrand", "Coolray", "Atlas", "Other"],
  BYD: ["F3", "Qin", "Song", "Other"],
  Haval: ["H2", "H6", "Jolion", "Other"],
  "Great Wall": ["Wingle", "Poer", "Other"],
  MG: ["MG 3", "MG 5", "ZS", "HS", "Other"],
  Other: ["Other"],
};

const MOTORCYCLE_MAKES_MODELS: Record<string, string[]> = {
  Honda: ["CD 70", "CG 125", "CB 125F", "CB 150F", "Dream", "Wave", "Other"],
  Yamaha: ["YBR 125", "YB 125Z", "R15", "FZ", "Other"],
  Suzuki: ["GD 110", "GS 150", "GR 150", "Hayate", "Other"],
  Bajaj: ["Boxer BM 150", "Pulsar 150", "Pulsar 180", "Other"],
  TVS: ["Apache RTR 160", "Apache RTR 200", "Jupiter", "Other"],
  Hero: ["Splendor", "CD Deluxe", "Passion", "Other"],
  United: ["US 70", "US 100", "US 125", "Other"],
  "Road Prince": ["RP 70", "RP 125", "Other"],
  "Super Power": ["SP 70", "SP 125", "Other"],
  Lifan: ["LF 70", "LF 125", "LF 150", "Other"],
  Zongshen: ["ZS 70", "ZS 125", "Other"],
  Kawasaki: ["Ninja", "KLX", "Other"],
  KTM: ["Duke 125", "Duke 200", "RC", "Other"],
  BMW: ["G 310", "GS", "Other"],
  Ducati: ["Monster", "Scrambler", "Panigale", "Other"],
  Other: ["Other"],
};

const PHONE_BRANDS_MODELS: Record<string, string[]> = {
  Apple: ["iPhone 11", "iPhone 12", "iPhone 13", "iPhone 14", "iPhone 15", "iPhone 16", "iPad", "Apple Watch", "Other"],
  Samsung: ["Galaxy A15", "Galaxy A25", "Galaxy A55", "Galaxy S23", "Galaxy S24", "Galaxy Z Flip", "Other"],
  Huawei: ["P30", "P40", "Mate 40", "Nova 9", "Other"],
  Xiaomi: ["Mi 11", "Mi 12", "Mi 13", "Redmi Note 12", "Redmi Note 13", "Other"],
  Oppo: ["A54", "Reno 8", "Reno 10", "Other"],
  Vivo: ["Y21", "Y33s", "V23", "Other"],
  Realme: ["C35", "C55", "GT", "Other"],
  Tecno: ["Spark 10", "Camon 20", "Pova", "Other"],
  Infinix: ["Hot 30", "Note 40", "Zero 30", "Other"],
  Nokia: ["Nokia 105", "Nokia C20", "Nokia G22", "Other"],
  OnePlus: ["Nord", "OnePlus 11", "OnePlus 12", "Other"],
  "Google Pixel": ["Pixel 6", "Pixel 7", "Pixel 8", "Other"],
  Motorola: ["Moto G", "Moto Edge", "Other"],
  Sony: ["Xperia 10", "Other"],
  Itel: ["A60", "P37", "Other"],
  Other: ["Other"],
};

function l(text: Record<SimpleLocale, string>, locale: SimpleLocale) {
  return text[locale] ?? text.en;
}

function optionValues(values: string[]) {
  return values.map((value) => ({ value, label: { en: value, fa: value, ps: value } }));
}

const carFeatureOptions = optionValues([
  "Full Option",
  "LCD & Sound System",
  "AC & Heater Active",
  "Air Bags Active",
  "New Tires & Wheels",
  "Company Color",
  "Leather Seat",
  "Finger Start",
  "ABS",
]);

const motorcycleFeatureOptions = optionValues([
  "Electric Start",
  "Kick Start",
  "Disc Brake",
  "ABS",
  "LED Lights",
  "New Tires",
  "Alarm",
  "Side Box",
  "Helmet Included",
  "Phone Holder",
]);

const phoneFeatureOptions = optionValues([
  "Original Charger",
  "Box Available",
  "Cable",
  "Handsfree",
  "Cover",
  "Screen Protector",
  "Fingerprint",
  "Face ID",
  "Dual SIM",
  "Fast Charging",
  "No Repair",
  "Original Screen",
]);

const propertyFeatureOptions = optionValues([
  "Balcony",
  "Yard",
  "Garden",
  "Elevator",
  "Security",
  "Generator",
  "Solar",
  "Internet",
  "Separate Entrance",
  "Near Main Road",
  "Near School",
  "Near Mosque",
]);

const CAR_CONFIG: SimpleCategoryConfig = {
  kind: "car",
  title: TEXT.car,
  emptyMaintenance: { en: "No maintenance history available", fa: "تاریخچه سرویس موجود نیست", ps: "د ترمیم تاریخچه نشته" },
  maintenanceTitle: { en: "Maintenance History", fa: "تاریخچه سرویس", ps: "د ترمیم تاریخچه" },
  featureTitle: { en: "Features", fa: "ویژگی‌ها", ps: "خصوصیتونه" },
  makeModels: CAR_MAKES_MODELS,
  featureOptions: carFeatureOptions,
  topCards: [
    { key: "mileageKm", label: { en: "Mileage", fa: "کارکرد", ps: "کارکرد" }, unit: "Km" },
    { key: "firstRegistrationDate", label: { en: "First Registration", fa: "اولین ثبت", ps: "لومړی ثبت" } },
    { key: "transmission", label: { en: "Transmission", fa: "گیربکس", ps: "ګیربکس" } },
    { key: "fuelType", label: { en: "Fuel Type", fa: "نوع سوخت", ps: "د سونګ ډول" } },
  ],
  rows: [
    { key: "color", label: { en: "Color", fa: "رنگ", ps: "رنګ" } },
    { key: "licensePlate", label: { en: "License Plate", fa: "نمبر پلیت", ps: "د پلیت نمبر" } },
    { key: "licensePlateType", label: { en: "License Plate Type", fa: "نوع پلیت نمبر", ps: "د پلیت نمبر ډول" } },
    { key: "engineCylinders", label: { en: "Engine Size (Cylinders)", fa: "اندازه ماشین (سیلندر)", ps: "د انجن اندازه (سلنډرونه)" } },
    { key: "fuelType", label: { en: "Fuel Type", fa: "نوع سوخت", ps: "د سونګ ډول" } },
    { key: "type", label: { en: "Type", fa: "نوعیت", ps: "ډول" } },
    { key: "make", label: { en: "Make", fa: "برند", ps: "برنډ" } },
    { key: "model", label: { en: "Model", fa: "مدل", ps: "ماډل" } },
    { key: "transmission", label: { en: "Transmission", fa: "گیربکس", ps: "ګیربکس" } },
    { key: "year", label: { en: "Year", fa: "سال", ps: "کال" } },
    { key: "location", label: { en: "Location", fa: "موقعیت", ps: "ځای" } },
  ],
  fields: [
    { key: "mileageKm", label: { en: "Mileage", fa: "کارکرد", ps: "کارکرد" }, type: "number", required: true, min: 0, unit: "Km" },
    { key: "firstRegistrationDate", label: { en: "First Registration", fa: "اولین ثبت", ps: "لومړی ثبت" }, type: "date" },
    { key: "transmission", label: { en: "Transmission", fa: "گیربکس", ps: "ګیربکس" }, type: "select", required: true, options: optionValues(["Manual / Gear", "Automatic", "CVT"]) },
    { key: "fuelType", label: { en: "Fuel Type", fa: "نوع سوخت", ps: "د سونګ ډول" }, type: "select", required: true, options: optionValues(["Petrol", "Diesel", "Hybrid", "Electric", "CNG/LPG", "Other"]) },
    { key: "color", label: { en: "Color", fa: "رنگ", ps: "رنګ" }, type: "select", options: optionValues(["White", "Black", "Silver", "Gray", "Blue", "Red", "Green", "Yellow", "Gold", "Brown", "Beige", "Other"]) },
    { key: "licensePlate", label: { en: "License Plate", fa: "نمبر پلیت", ps: "د پلیت نمبر" }, type: "text" },
    { key: "licensePlateType", label: { en: "License Plate Type", fa: "نوع پلیت نمبر", ps: "د پلیت نمبر ډول" }, type: "select", options: optionValues(["Positive +", "Negative -", "No Plate", "Temporary", "Government", "Company", "Customs", "Other"]) },
    { key: "engineCylinders", label: { en: "Engine Size (Cylinders)", fa: "اندازه ماشین (سیلندر)", ps: "د انجن اندازه (سلنډرونه)" }, type: "select", options: optionValues(["3", "4", "5", "6", "8", "10", "12", "Other"]) },
    { key: "type", label: { en: "Type", fa: "نوعیت", ps: "ډول" }, type: "select", options: optionValues(["Sedan", "Hatchback", "SUV", "Crossover", "Pickup", "Van", "Minibus", "Bus", "Truck", "Wagon", "Coupe", "Luxury", "Other"]) },
    { key: "make", label: { en: "Make", fa: "برند", ps: "برنډ" }, type: "select", required: true, options: optionValues(Object.keys(CAR_MAKES_MODELS)) },
    { key: "model", label: { en: "Model", fa: "مدل", ps: "ماډل" }, type: "select", required: true, dependsOn: "make" },
    { key: "year", label: { en: "Year", fa: "سال", ps: "کال" }, type: "number", required: true, min: 1950, max: new Date().getFullYear() + 1 },
    { key: "location", label: { en: "Location", fa: "موقعیت", ps: "ځای" }, type: "text" },
    { key: "features", label: { en: "Features", fa: "ویژگی‌ها", ps: "خصوصیتونه" }, type: "multiselect", options: carFeatureOptions },
    { key: "maintenanceHistory", label: { en: "Maintenance History", fa: "تاریخچه سرویس", ps: "د ترمیم تاریخچه" }, type: "textarea" },
  ],
};

const MOTORCYCLE_CONFIG: SimpleCategoryConfig = {
  kind: "motorcycle",
  title: TEXT.motorcycle,
  emptyMaintenance: { en: "No maintenance history available", fa: "تاریخچه سرویس موجود نیست", ps: "د ترمیم تاریخچه نشته" },
  maintenanceTitle: { en: "Maintenance History", fa: "تاریخچه سرویس", ps: "د ترمیم تاریخچه" },
  featureTitle: { en: "Features", fa: "ویژگی‌ها", ps: "خصوصیتونه" },
  makeModels: MOTORCYCLE_MAKES_MODELS,
  featureOptions: motorcycleFeatureOptions,
  topCards: [
    { key: "mileageKm", label: { en: "Mileage", fa: "کارکرد", ps: "کارکرد" }, unit: "Km" },
    { key: "firstRegistrationDate", label: { en: "First Registration", fa: "اولین ثبت", ps: "لومړی ثبت" } },
    { key: "gearbox", label: { en: "Gearbox", fa: "گیربکس", ps: "ګیربکس" } },
    { key: "fuelType", label: { en: "Fuel Type", fa: "نوع سوخت", ps: "د سونګ ډول" } },
  ],
  rows: [
    { key: "color", label: { en: "Color", fa: "رنگ", ps: "رنګ" } },
    { key: "plateNumber", label: { en: "Plate Number", fa: "نمبر پلیت", ps: "د پلیت نمبر" } },
    { key: "plateType", label: { en: "Plate Type", fa: "نوع پلیت نمبر", ps: "د پلیت نمبر ډول" } },
    { key: "engineCc", label: { en: "Engine Size (CC)", fa: "اندازه ماشین (سی‌سی)", ps: "د انجن اندازه (سي سي)" } },
    { key: "fuelType", label: { en: "Fuel Type", fa: "نوع سوخت", ps: "د سونګ ډول" } },
    { key: "type", label: { en: "Type", fa: "نوعیت", ps: "ډول" } },
    { key: "make", label: { en: "Make", fa: "برند", ps: "برنډ" } },
    { key: "model", label: { en: "Model", fa: "مدل", ps: "ماډل" } },
    { key: "gearbox", label: { en: "Gearbox", fa: "گیربکس", ps: "ګیربکس" } },
    { key: "year", label: { en: "Year", fa: "سال", ps: "کال" } },
    { key: "location", label: { en: "Location", fa: "موقعیت", ps: "ځای" } },
  ],
  fields: [
    { key: "mileageKm", label: { en: "Mileage", fa: "کارکرد", ps: "کارکرد" }, type: "number", required: true, min: 0, unit: "Km" },
    { key: "firstRegistrationDate", label: { en: "First Registration", fa: "اولین ثبت", ps: "لومړی ثبت" }, type: "date" },
    { key: "gearbox", label: { en: "Gearbox", fa: "گیربکس", ps: "ګیربکس" }, type: "select", required: true, options: optionValues(["Manual", "Automatic", "CVT"]) },
    { key: "fuelType", label: { en: "Fuel Type", fa: "نوع سوخت", ps: "د سونګ ډول" }, type: "select", required: true, options: optionValues(["Petrol", "Electric", "Other"]) },
    { key: "color", label: { en: "Color", fa: "رنگ", ps: "رنګ" }, type: "select", options: optionValues(["White", "Black", "Silver", "Gray", "Blue", "Red", "Green", "Yellow", "Other"]) },
    { key: "plateNumber", label: { en: "Plate Number", fa: "نمبر پلیت", ps: "د پلیت نمبر" }, type: "text" },
    { key: "plateType", label: { en: "Plate Type", fa: "نوع پلیت نمبر", ps: "د پلیت نمبر ډول" }, type: "select", options: optionValues(["Positive +", "Negative -", "No Plate", "Temporary", "Government", "Company", "Customs", "Other"]) },
    { key: "engineCc", label: { en: "Engine Size (CC)", fa: "اندازه ماشین (سی‌سی)", ps: "د انجن اندازه (سي سي)" }, type: "select", options: optionValues(["50", "70", "100", "110", "125", "150", "160", "180", "200", "250", "300", "400", "500", "600", "1000", "Other"]) },
    { key: "type", label: { en: "Type", fa: "نوعیت", ps: "ډول" }, type: "select", options: optionValues(["Standard", "Sport", "Cruiser", "Scooter", "Off-road", "Three Wheeler / Rickshaw", "Electric Bike", "Other"]) },
    { key: "make", label: { en: "Make", fa: "برند", ps: "برنډ" }, type: "select", required: true, options: optionValues(Object.keys(MOTORCYCLE_MAKES_MODELS)) },
    { key: "model", label: { en: "Model", fa: "مدل", ps: "ماډل" }, type: "select", required: true, dependsOn: "make" },
    { key: "year", label: { en: "Year", fa: "سال", ps: "کال" }, type: "number", required: true, min: 1950, max: new Date().getFullYear() + 1 },
    { key: "location", label: { en: "Location", fa: "موقعیت", ps: "ځای" }, type: "text" },
    { key: "features", label: { en: "Features", fa: "ویژگی‌ها", ps: "خصوصیتونه" }, type: "multiselect", options: motorcycleFeatureOptions },
    { key: "maintenanceHistory", label: { en: "Maintenance History", fa: "تاریخچه سرویس", ps: "د ترمیم تاریخچه" }, type: "textarea" },
  ],
};

const MOBILE_PHONE_CONFIG: SimpleCategoryConfig = {
  kind: "mobilePhone",
  title: TEXT.mobilePhone,
  emptyMaintenance: { en: "No maintenance history available", fa: "تاریخچه سرویس موجود نیست", ps: "د ترمیم تاریخچه نشته" },
  maintenanceTitle: { en: "Maintenance History", fa: "تاریخچه سرویس", ps: "د ترمیم تاریخچه" },
  featureTitle: { en: "Features", fa: "ویژگی‌ها", ps: "خصوصیتونه" },
  makeModels: PHONE_BRANDS_MODELS,
  featureOptions: phoneFeatureOptions,
  topCards: [
    { key: "brandModel", label: { en: "Brand / Model", fa: "برند / مدل", ps: "برنډ / ماډل" } },
    { key: "storageGb", label: { en: "Storage", fa: "ذخیره", ps: "زېرمه" } },
    { key: "condition", label: { en: "Condition", fa: "حالت", ps: "حالت" } },
    { key: "batteryHealth", label: { en: "Battery", fa: "بیټرۍ", ps: "بیټرۍ" } },
  ],
  rows: [
    { key: "brand", label: { en: "Brand", fa: "برند", ps: "برنډ" } },
    { key: "model", label: { en: "Model", fa: "مدل", ps: "ماډل" } },
    { key: "storageGb", label: { en: "Storage", fa: "ذخیره", ps: "زېرمه" } },
    { key: "ramGb", label: { en: "RAM", fa: "رام", ps: "رام" } },
    { key: "color", label: { en: "Color", fa: "رنگ", ps: "رنګ" } },
    { key: "simType", label: { en: "SIM", fa: "سیم", ps: "سم" } },
    { key: "networkStatus", label: { en: "Network", fa: "شبکه", ps: "شبکه" } },
    { key: "batteryHealth", label: { en: "Battery Health", fa: "صحت باتری", ps: "د بیټرۍ حالت" } },
    { key: "warranty", label: { en: "Warranty", fa: "ضمانت", ps: "ضمانت" } },
    { key: "accessories", label: { en: "Accessories", fa: "لوازم جانبی", ps: "لوازم" } },
    { key: "location", label: { en: "Location", fa: "موقعیت", ps: "ځای" } },
  ],
  fields: [
    { key: "brand", label: { en: "Brand", fa: "برند", ps: "برنډ" }, type: "select", required: true, options: optionValues(Object.keys(PHONE_BRANDS_MODELS)), allowCustom: true },
    { key: "model", label: { en: "Model", fa: "مدل", ps: "ماډل" }, type: "text", required: true, dependsOn: "brand", allowCustom: true },
    { key: "storageGb", label: { en: "Storage", fa: "ذخیره", ps: "زېرمه" }, type: "select", options: optionValues(["8 GB", "16 GB", "32 GB", "64 GB", "128 GB", "256 GB", "512 GB", "1 TB", "Other"]) },
    { key: "ramGb", label: { en: "RAM", fa: "رام", ps: "رام" }, type: "select", options: optionValues(["1 GB", "2 GB", "3 GB", "4 GB", "6 GB", "8 GB", "12 GB", "16 GB", "Other"]) },
    { key: "condition", label: { en: "Condition", fa: "حالت", ps: "حالت" }, type: "select", required: true, options: optionValues(["New", "Like New", "Used", "Damaged", "For Parts"]) },
    { key: "color", label: { en: "Color", fa: "رنگ", ps: "رنګ" }, type: "select", options: optionValues(["White", "Black", "Silver", "Gray", "Blue", "Red", "Green", "Other"]) },
    { key: "simType", label: { en: "SIM", fa: "سیم", ps: "سم" }, type: "select", options: optionValues(["Single SIM", "Dual SIM", "eSIM", "SIM + eSIM", "Other"]) },
    { key: "networkStatus", label: { en: "Network", fa: "شبکه", ps: "شبکه" }, type: "select", options: optionValues(["Unlocked", "Locked", "PTA Registered", "Non-PTA", "Unknown"]) },
    { key: "batteryHealth", label: { en: "Battery", fa: "بیټرۍ", ps: "بیټرۍ" }, type: "number", min: 0, max: 100 },
    { key: "warranty", label: { en: "Warranty", fa: "گارانتی", ps: "وارنټي" }, type: "text" },
    { key: "accessories", label: { en: "Accessories", fa: "لوازم", ps: "لوازمات" }, type: "multiselect", options: phoneFeatureOptions },
    { key: "features", label: { en: "Features", fa: "ویژگی‌ها", ps: "خصوصیتونه" }, type: "multiselect", options: phoneFeatureOptions },
    { key: "location", label: { en: "Location", fa: "موقعیت", ps: "ځای" }, type: "text" },
  ],
};

const TABLET_CONFIG: SimpleCategoryConfig = {
  kind: "tablet",
  title: TEXT.tablet,
  emptyMaintenance: { en: "No maintenance history available", fa: "تاریخچه سرویس موجود نیست", ps: "د ترمیم تاریخچه نشته" },
  maintenanceTitle: { en: "Maintenance History", fa: "تاریخچه سرویس", ps: "د ترمیم تاریخچه" },
  featureTitle: { en: "Features", fa: "ویژگی‌ها", ps: "خصوصیتونه" },
  makeModels: PHONE_BRANDS_MODELS,
  featureOptions: phoneFeatureOptions,
  topCards: [
    { key: "brandModel", label: { en: "Brand / Model", fa: "برند / مدل", ps: "برنډ / ماډل" } },
    { key: "storageGb", label: { en: "Storage", fa: "حافظه", ps: "حافظه" } },
    { key: "screenSize", label: { en: "Screen Size", fa: "اندازه صفحه", ps: "د پردې اندازه" } },
    { key: "condition", label: { en: "Condition", fa: "حالت", ps: "حالت" } },
  ],
  rows: [
    { key: "brand", label: { en: "Brand", fa: "برند", ps: "برنډ" } },
    { key: "model", label: { en: "Model", fa: "مدل", ps: "ماډل" } },
    { key: "storageGb", label: { en: "Storage", fa: "حافظه", ps: "حافظه" } },
    { key: "ramGb", label: { en: "RAM", fa: "رم", ps: "رم" } },
    { key: "screenSize", label: { en: "Screen Size", fa: "اندازه صفحه", ps: "د پردې اندازه" } },
    { key: "connectivity", label: { en: "Connectivity", fa: "اتصال", ps: "اتصال" } },
    { key: "color", label: { en: "Color", fa: "رنگ", ps: "رنګ" } },
    { key: "condition", label: { en: "Condition", fa: "حالت", ps: "حالت" } },
    { key: "batteryHealth", label: { en: "Battery Health", fa: "صحت باتری", ps: "د بیټرۍ حالت" } },
    { key: "warranty", label: { en: "Warranty", fa: "ضمانت", ps: "ضمانت" } },
    { key: "accessories", label: { en: "Accessories", fa: "لوازم جانبی", ps: "لوازم" } },
    { key: "location", label: { en: "Location", fa: "موقعیت", ps: "ځای" } },
  ],
  fields: [
    { key: "brand", label: { en: "Brand", fa: "برند", ps: "برنډ" }, type: "select", required: true, options: optionValues(Object.keys(PHONE_BRANDS_MODELS)), allowCustom: true },
    { key: "model", label: { en: "Model", fa: "مدل", ps: "ماډل" }, type: "text", required: true, allowCustom: true },
    { key: "storageGb", label: { en: "Storage", fa: "حافظه", ps: "حافظه" }, type: "select", options: optionValues(["16 GB", "32 GB", "64 GB", "128 GB", "256 GB", "512 GB", "1 TB", "Other"]) },
    { key: "ramGb", label: { en: "RAM", fa: "رم", ps: "رم" }, type: "select", options: optionValues(["2 GB", "3 GB", "4 GB", "6 GB", "8 GB", "12 GB", "16 GB", "Other"]) },
    { key: "screenSize", label: { en: "Screen Size", fa: "اندازه صفحه", ps: "د پردې اندازه" }, type: "text" },
    { key: "connectivity", label: { en: "Connectivity", fa: "اتصال", ps: "اتصال" }, type: "select", options: optionValues(["Wi-Fi", "SIM / Cellular", "Wi-Fi + SIM", "Other"]) },
    { key: "color", label: { en: "Color", fa: "رنگ", ps: "رنګ" }, type: "select", options: optionValues(["White", "Black", "Silver", "Gray", "Blue", "Red", "Green", "Other"]) },
    { key: "condition", label: { en: "Condition", fa: "حالت", ps: "حالت" }, type: "select", required: true, options: optionValues(["New", "Like New", "Used", "Damaged", "For Parts"]) },
    { key: "batteryHealth", label: { en: "Battery Health", fa: "صحت باتری", ps: "د بیټرۍ حالت" }, type: "number", min: 0, max: 100 },
    { key: "warranty", label: { en: "Warranty", fa: "ضمانت", ps: "ضمانت" }, type: "text" },
    { key: "accessories", label: { en: "Accessories", fa: "لوازم جانبی", ps: "لوازم" }, type: "multiselect", options: phoneFeatureOptions },
    { key: "features", label: { en: "Features", fa: "ویژگی‌ها", ps: "خصوصیتونه" }, type: "multiselect", options: phoneFeatureOptions },
    { key: "location", label: { en: "Location", fa: "موقعیت", ps: "ځای" }, type: "text" },
  ],
};

const SMART_WATCH_CONFIG: SimpleCategoryConfig = {
  kind: "smartWatch",
  title: TEXT.smartWatch,
  emptyMaintenance: { en: "No maintenance history available", fa: "تاریخچه سرویس موجود نیست", ps: "د ترمیم تاریخچه نشته" },
  maintenanceTitle: { en: "Maintenance History", fa: "تاریخچه سرویس", ps: "د ترمیم تاریخچه" },
  featureTitle: { en: "Features", fa: "ویژگی‌ها", ps: "خصوصیتونه" },
  makeModels: PHONE_BRANDS_MODELS,
  featureOptions: optionValues(["Original Charger", "Box Available", "Strap Included", "Waterproof", "GPS", "SIM Support", "Heart Rate Sensor", "Original"]),
  topCards: [
    { key: "brandModel", label: { en: "Brand / Model", fa: "برند / مدل", ps: "برنډ / ماډل" } },
    { key: "condition", label: { en: "Condition", fa: "حالت", ps: "حالت" } },
    { key: "connectivity", label: { en: "Connectivity", fa: "اتصال", ps: "اتصال" } },
    { key: "warranty", label: { en: "Warranty", fa: "ضمانت", ps: "ضمانت" } },
  ],
  rows: [
    { key: "brand", label: { en: "Brand", fa: "برند", ps: "برنډ" } },
    { key: "model", label: { en: "Model", fa: "مدل", ps: "ماډل" } },
    { key: "size", label: { en: "Size", fa: "اندازه", ps: "اندازه" } },
    { key: "color", label: { en: "Color", fa: "رنگ", ps: "رنګ" } },
    { key: "connectivity", label: { en: "Connectivity", fa: "اتصال", ps: "اتصال" } },
    { key: "condition", label: { en: "Condition", fa: "حالت", ps: "حالت" } },
    { key: "batteryHealth", label: { en: "Battery Health", fa: "صحت باتری", ps: "د بیټرۍ حالت" } },
    { key: "warranty", label: { en: "Warranty", fa: "ضمانت", ps: "ضمانت" } },
    { key: "accessories", label: { en: "Accessories", fa: "لوازم جانبی", ps: "لوازم" } },
    { key: "location", label: { en: "Location", fa: "موقعیت", ps: "ځای" } },
  ],
  fields: [
    { key: "brand", label: { en: "Brand", fa: "برند", ps: "برنډ" }, type: "select", required: true, options: optionValues(Object.keys(PHONE_BRANDS_MODELS)), allowCustom: true },
    { key: "model", label: { en: "Model", fa: "مدل", ps: "ماډل" }, type: "text", required: true, allowCustom: true },
    { key: "size", label: { en: "Size", fa: "اندازه", ps: "اندازه" }, type: "text" },
    { key: "color", label: { en: "Color", fa: "رنگ", ps: "رنګ" }, type: "select", options: optionValues(["Black", "Silver", "Gold", "Blue", "Red", "Other"]) },
    { key: "connectivity", label: { en: "Connectivity", fa: "اتصال", ps: "اتصال" }, type: "select", options: optionValues(["Bluetooth", "SIM / Cellular", "GPS", "Bluetooth + GPS", "Other"]) },
    { key: "condition", label: { en: "Condition", fa: "حالت", ps: "حالت" }, type: "select", required: true, options: optionValues(["New", "Like New", "Used", "Damaged", "For Parts"]) },
    { key: "batteryHealth", label: { en: "Battery Health", fa: "صحت باتری", ps: "د بیټرۍ حالت" }, type: "number", min: 0, max: 100 },
    { key: "warranty", label: { en: "Warranty", fa: "ضمانت", ps: "ضمانت" }, type: "text" },
    { key: "accessories", label: { en: "Accessories", fa: "لوازم جانبی", ps: "لوازم" }, type: "multiselect", options: optionValues(["Original Charger", "Box Available", "Strap Included", "Waterproof", "GPS", "SIM Support", "Heart Rate Sensor", "Original"]) },
    { key: "features", label: { en: "Features", fa: "ویژگی‌ها", ps: "خصوصیتونه" }, type: "multiselect", options: optionValues(["Original Charger", "Box Available", "Strap Included", "Waterproof", "GPS", "SIM Support", "Heart Rate Sensor", "Original"]) },
    { key: "location", label: { en: "Location", fa: "موقعیت", ps: "ځای" }, type: "text" },
  ],
};

const PHONE_ACCESSORY_CONFIG: SimpleCategoryConfig = {
  kind: "phoneAccessory",
  title: TEXT.phoneAccessory,
  emptyMaintenance: { en: "No maintenance history available", fa: "تاریخچه سرویس موجود نیست", ps: "د ترمیم تاریخچه نشته" },
  maintenanceTitle: { en: "Maintenance History", fa: "تاریخچه سرویس", ps: "د ترمیم تاریخچه" },
  featureTitle: { en: "Features", fa: "ویژگی‌ها", ps: "خصوصیتونه" },
  makeModels: PHONE_BRANDS_MODELS,
  featureOptions: optionValues(["Original", "Warranty", "Box Available"]),
  topCards: [
    { key: "accessoryType", label: { en: "Accessory Type", fa: "نوع لوازم جانبی", ps: "د لوازمو ډول" } },
    { key: "brand", label: { en: "Brand", fa: "برند", ps: "برنډ" } },
    { key: "condition", label: { en: "Condition", fa: "حالت", ps: "حالت" } },
    { key: "compatibleWith", label: { en: "Compatible With", fa: "سازگار با", ps: "سره سازگار" } },
  ],
  rows: [
    { key: "accessoryType", label: { en: "Accessory Type", fa: "نوع لوازم جانبی", ps: "د لوازمو ډول" } },
    { key: "brand", label: { en: "Brand", fa: "برند", ps: "برنډ" } },
    { key: "model", label: { en: "Model", fa: "مدل", ps: "ماډل" } },
    { key: "compatibleBrand", label: { en: "Compatible Brand", fa: "برند سازگار", ps: "موافق برنډ" } },
    { key: "compatibleModel", label: { en: "Compatible Model", fa: "مدل سازگار", ps: "موافق ماډل" } },
    { key: "condition", label: { en: "Condition", fa: "حالت", ps: "حالت" } },
    { key: "color", label: { en: "Color", fa: "رنگ", ps: "رنګ" } },
    { key: "original", label: { en: "Original", fa: "اصلی", ps: "اصلي" } },
    { key: "warranty", label: { en: "Warranty", fa: "ضمانت", ps: "ضمانت" } },
    { key: "location", label: { en: "Location", fa: "موقعیت", ps: "ځای" } },
  ],
  fields: [
    { key: "accessoryType", label: { en: "Accessory Type", fa: "نوع لوازم جانبی", ps: "د لوازمو ډول" }, type: "select", required: true, options: optionValues(["Charger", "Cable", "Handsfree", "AirPods / Earbuds", "Cover / Case", "Screen Protector", "Battery", "Power Bank", "Memory Card", "Other"]) },
    { key: "brand", label: { en: "Brand", fa: "برند", ps: "برنډ" }, type: "text" },
    { key: "model", label: { en: "Model", fa: "مدل", ps: "ماډل" }, type: "text" },
    { key: "compatibleBrand", label: { en: "Compatible Brand", fa: "برند سازگار", ps: "موافق برنډ" }, type: "text" },
    { key: "compatibleModel", label: { en: "Compatible Model", fa: "مدل سازگار", ps: "موافق ماډل" }, type: "text" },
    { key: "condition", label: { en: "Condition", fa: "حالت", ps: "حالت" }, type: "select", options: optionValues(["New", "Like New", "Used", "Damaged", "For Parts"]) },
    { key: "color", label: { en: "Color", fa: "رنگ", ps: "رنګ" }, type: "select", options: optionValues(["White", "Black", "Silver", "Gray", "Blue", "Red", "Green", "Other"]) },
    { key: "original", label: { en: "Original", fa: "اصلی", ps: "اصلي" }, type: "select", options: optionValues(["Yes", "No"]) },
    { key: "warranty", label: { en: "Warranty", fa: "ضمانت", ps: "ضمانت" }, type: "text" },
    { key: "location", label: { en: "Location", fa: "موقعیت", ps: "ځای" }, type: "text" },
  ],
};

function buildPropertyConfig(kind: "house" | "apartment" | "room" | "land" | "shop" | "office" | "warehouse"): SimpleCategoryConfig {
  const base: Omit<SimpleCategoryConfig, "kind" | "title" | "topCards" | "rows" | "fields"> = {
    emptyMaintenance: { en: "No maintenance history available", fa: "تاریخچه سرویس موجود نیست", ps: "د ترمیم تاریخچه نشته" },
    maintenanceTitle: { en: "Maintenance History", fa: "تاریخچه سرویس", ps: "د ترمیم تاریخچه" },
    featureTitle: { en: "Features", fa: "ویژگی‌ها", ps: "خصوصیتونه" },
    makeModels: {},
    featureOptions: propertyFeatureOptions,
  };

  const commonFields: SimpleField[] = [
    { key: "purpose", label: { en: "Purpose", fa: "هدف", ps: "هدف" }, type: "select", required: true, options: optionValues(["For Sale", "For Rent", "Mortgage", "Lease"]) },
    { key: "areaSize", label: { en: "Area", fa: "مساحت", ps: "مساحت" }, type: "number", required: true, min: 0 },
    { key: "areaUnit", label: { en: "Area Unit", fa: "واحد مساحت", ps: "د مساحت واحد" }, type: "select", required: true, options: optionValues(["sqm", "jerib", "biswa", "marla"]) },
    { key: "electricity", label: { en: "Electricity", fa: "برق", ps: "برېښنا" }, type: "select", options: optionValues(["Available", "Not Available", "Solar", "Generator"]) },
    { key: "water", label: { en: "Water", fa: "آب", ps: "اوبه" }, type: "select", options: optionValues(["Available", "Well", "Tanker", "Not Available"]) },
    { key: "documentType", label: { en: "Document Type", fa: "نوع سند", ps: "د سند ډول" }, type: "select", options: optionValues(["Title Deed", "Qabala", "Customary Document", "No Document", "Other"]) },
    { key: "features", label: { en: "Features", fa: "ویژگی‌ها", ps: "خصوصیتونه" }, type: "multiselect", options: propertyFeatureOptions },
    { key: "location", label: { en: "Location", fa: "موقعیت", ps: "ځای" }, type: "text" },
  ];

  if (kind === "land") {
    return {
      ...base,
      kind,
      title: TEXT.property,
      topCards: [
        { key: "areaSize", label: { en: "Area", fa: "مساحت", ps: "مساحت" } },
        { key: "purpose", label: { en: "Purpose", fa: "هدف", ps: "هدف" } },
        { key: "landType", label: { en: "Land Type", fa: "نوع زمین", ps: "د ځمکې ډول" } },
        { key: "documentType", label: { en: "Document Type", fa: "نوع سند", ps: "د سند ډول" } },
      ],
      rows: [
        { key: "propertyType", label: { en: "Property Type", fa: "نوع ملکیت", ps: "د ملکیت ډول" } },
        { key: "purpose", label: { en: "Purpose", fa: "هدف", ps: "هدف" } },
        { key: "areaSize", label: { en: "Area", fa: "مساحت", ps: "مساحت" } },
        { key: "landType", label: { en: "Land Type", fa: "نوع زمین", ps: "د ځمکې ډول" } },
        { key: "roadAccess", label: { en: "Road Access", fa: "راه دسترسی", ps: "د لارې لاسرسی" } },
        { key: "electricity", label: { en: "Electricity", fa: "برق", ps: "برېښنا" } },
        { key: "water", label: { en: "Water", fa: "آب", ps: "اوبه" } },
        { key: "documentType", label: { en: "Document Type", fa: "نوع سند", ps: "د سند ډول" } },
        { key: "location", label: { en: "Location", fa: "موقعیت", ps: "ځای" } },
      ],
      fields: [
        ...commonFields,
        { key: "landType", label: { en: "Land Type", fa: "نوع زمین", ps: "د ځمکې ډول" }, type: "select", options: optionValues(["Residential", "Commercial", "Agricultural", "Industrial", "Other"]) },
        { key: "roadAccess", label: { en: "Road Access", fa: "راه دسترسی", ps: "د لارې لاسرسی" }, type: "select", options: optionValues(["Main Road", "Side Road", "No Road Access", "Other"]) },
      ],
    };
  }

  const rowsByKind: Record<string, SimpleRow[]> = {
    house: [
      { key: "propertyType", label: { en: "Property Type", fa: "نوع ملکیت", ps: "د ملکیت ډول" } },
      { key: "purpose", label: { en: "Purpose", fa: "هدف", ps: "هدف" } },
      { key: "areaSize", label: { en: "Area", fa: "مساحت", ps: "مساحت" } },
      { key: "rooms", label: { en: "Rooms", fa: "اتاق‌ها", ps: "کوټې" } },
      { key: "bathrooms", label: { en: "Bathrooms", fa: "تشناب", ps: "تشنابونه" } },
      { key: "floors", label: { en: "Floors", fa: "منزل‌ها", ps: "منزلونه" } },
      { key: "furnished", label: { en: "Furnished", fa: "فرنیچر دارد", ps: "فرنیچر لري" } },
      { key: "parking", label: { en: "Parking", fa: "پارکینگ", ps: "پارکینګ" } },
      { key: "electricity", label: { en: "Electricity", fa: "برق", ps: "برېښنا" } },
      { key: "water", label: { en: "Water", fa: "آب", ps: "اوبه" } },
      { key: "documentType", label: { en: "Document Type", fa: "نوع سند", ps: "د سند ډول" } },
      { key: "location", label: { en: "Location", fa: "موقعیت", ps: "ځای" } },
    ],
    apartment: [
      { key: "propertyType", label: { en: "Property Type", fa: "نوع ملکیت", ps: "د ملکیت ډول" } },
      { key: "purpose", label: { en: "Purpose", fa: "هدف", ps: "هدف" } },
      { key: "areaSize", label: { en: "Area", fa: "مساحت", ps: "مساحت" } },
      { key: "bedrooms", label: { en: "Bedrooms", fa: "اتاق خواب", ps: "د خوب کوټې" } },
      { key: "bathrooms", label: { en: "Bathrooms", fa: "تشناب", ps: "تشنابونه" } },
      { key: "floor", label: { en: "Floor", fa: "منزل", ps: "منزل" } },
      { key: "totalFloors", label: { en: "Total Floors", fa: "مجموع منزل‌ها", ps: "ټول منزلونه" } },
      { key: "furnished", label: { en: "Furnished", fa: "فرنیچر دارد", ps: "فرنیچر لري" } },
      { key: "parking", label: { en: "Parking", fa: "پارکینگ", ps: "پارکینګ" } },
      { key: "elevator", label: { en: "Elevator", fa: "لیفت", ps: "لفټ" } },
      { key: "electricity", label: { en: "Electricity", fa: "برق", ps: "برېښنا" } },
      { key: "water", label: { en: "Water", fa: "آب", ps: "اوبه" } },
      { key: "documentType", label: { en: "Document Type", fa: "نوع سند", ps: "د سند ډول" } },
      { key: "location", label: { en: "Location", fa: "موقعیت", ps: "ځای" } },
    ],
    room: [
      { key: "propertyType", label: { en: "Property Type", fa: "نوع ملکیت", ps: "د ملکیت ډول" } },
      { key: "purpose", label: { en: "Purpose", fa: "هدف", ps: "هدف" } },
      { key: "areaSize", label: { en: "Area", fa: "مساحت", ps: "مساحت" } },
      { key: "rooms", label: { en: "Rooms", fa: "اتاق‌ها", ps: "کوټې" } },
      { key: "bathroom", label: { en: "Bathroom", fa: "تشناب", ps: "تشناب" } },
      { key: "furnished", label: { en: "Furnished", fa: "فرنیچر دارد", ps: "فرنیچر لري" } },
      { key: "sharedPrivate", label: { en: "Shared / Private", fa: "اشتراکی / شخصی", ps: "شریک / شخصي" } },
      { key: "electricity", label: { en: "Electricity", fa: "برق", ps: "برېښنا" } },
      { key: "water", label: { en: "Water", fa: "آب", ps: "اوبه" } },
      { key: "location", label: { en: "Location", fa: "موقعیت", ps: "ځای" } },
    ],
    shop: [
      { key: "propertyType", label: { en: "Property Type", fa: "نوع ملکیت", ps: "د ملکیت ډول" } },
      { key: "purpose", label: { en: "Purpose", fa: "هدف", ps: "هدف" } },
      { key: "areaSize", label: { en: "Area", fa: "مساحت", ps: "مساحت" } },
      { key: "floor", label: { en: "Floor", fa: "منزل", ps: "منزل" } },
      { key: "electricity", label: { en: "Electricity", fa: "برق", ps: "برېښنا" } },
      { key: "water", label: { en: "Water", fa: "آب", ps: "اوبه" } },
      { key: "parking", label: { en: "Parking", fa: "پارکینگ", ps: "پارکینګ" } },
      { key: "documentType", label: { en: "Document Type", fa: "نوع سند", ps: "د سند ډول" } },
      { key: "location", label: { en: "Location", fa: "موقعیت", ps: "ځای" } },
    ],
    office: [
      { key: "propertyType", label: { en: "Property Type", fa: "نوع ملکیت", ps: "د ملکیت ډول" } },
      { key: "purpose", label: { en: "Purpose", fa: "هدف", ps: "هدف" } },
      { key: "areaSize", label: { en: "Area", fa: "مساحت", ps: "مساحت" } },
      { key: "rooms", label: { en: "Rooms", fa: "اتاق‌ها", ps: "کوټې" } },
      { key: "bathrooms", label: { en: "Bathrooms", fa: "تشناب", ps: "تشنابونه" } },
      { key: "floor", label: { en: "Floor", fa: "منزل", ps: "منزل" } },
      { key: "furnished", label: { en: "Furnished", fa: "فرنیچر دارد", ps: "فرنیچر لري" } },
      { key: "parking", label: { en: "Parking", fa: "پارکینگ", ps: "پارکینګ" } },
      { key: "electricity", label: { en: "Electricity", fa: "برق", ps: "برېښنا" } },
      { key: "water", label: { en: "Water", fa: "آب", ps: "اوبه" } },
      { key: "internet", label: { en: "Internet", fa: "انترنت", ps: "انټرنېټ" } },
      { key: "documentType", label: { en: "Document Type", fa: "نوع سند", ps: "د سند ډول" } },
      { key: "location", label: { en: "Location", fa: "موقعیت", ps: "ځای" } },
    ],
    warehouse: [
      { key: "propertyType", label: { en: "Property Type", fa: "نوع ملکیت", ps: "د ملکیت ډول" } },
      { key: "purpose", label: { en: "Purpose", fa: "هدف", ps: "هدف" } },
      { key: "areaSize", label: { en: "Area", fa: "مساحت", ps: "مساحت" } },
      { key: "height", label: { en: "Height", fa: "ارتفاع", ps: "لوړوالی" } },
      { key: "truckAccess", label: { en: "Truck Access", fa: "دسترسی موتر باربری", ps: "د ټرک لاسرسی" } },
      { key: "parking", label: { en: "Parking", fa: "پارکینگ", ps: "پارکینګ" } },
      { key: "electricity", label: { en: "Electricity", fa: "برق", ps: "برېښنا" } },
      { key: "water", label: { en: "Water", fa: "آب", ps: "اوبه" } },
      { key: "documentType", label: { en: "Document Type", fa: "نوع سند", ps: "د سند ډول" } },
      { key: "location", label: { en: "Location", fa: "موقعیت", ps: "ځای" } },
    ],
  };

  const fieldsByKind: Record<string, SimpleField[]> = {
    house: [
      ...commonFields,
      { key: "rooms", label: { en: "Rooms", fa: "اتاق‌ها", ps: "کوټې" }, type: "number", min: 0 },
      { key: "bathrooms", label: { en: "Bathrooms", fa: "تشناب", ps: "تشنابونه" }, type: "number", min: 0 },
      { key: "floors", label: { en: "Floors", fa: "منزل‌ها", ps: "منزلونه" }, type: "number", min: 0 },
      { key: "furnished", label: { en: "Furnished", fa: "فرنیچر دارد", ps: "فرنیچر لري" }, type: "select", options: optionValues(["Yes", "No", "Semi Furnished"]) },
      { key: "parking", label: { en: "Parking", fa: "پارکینگ", ps: "پارکینګ" }, type: "select", options: optionValues(["Yes", "No"]) },
    ],
    apartment: [
      ...commonFields,
      { key: "bedrooms", label: { en: "Bedrooms", fa: "اتاق خواب", ps: "د خوب کوټې" }, type: "number", min: 0 },
      { key: "bathrooms", label: { en: "Bathrooms", fa: "تشناب", ps: "تشنابونه" }, type: "number", min: 0 },
      { key: "floor", label: { en: "Floor", fa: "منزل", ps: "منزل" }, type: "number", min: 0 },
      { key: "totalFloors", label: { en: "Total Floors", fa: "مجموع منزل‌ها", ps: "ټول منزلونه" }, type: "number", min: 0 },
      { key: "furnished", label: { en: "Furnished", fa: "فرنیچر دارد", ps: "فرنیچر لري" }, type: "select", options: optionValues(["Yes", "No", "Semi Furnished"]) },
      { key: "parking", label: { en: "Parking", fa: "پارکینگ", ps: "پارکینګ" }, type: "select", options: optionValues(["Yes", "No"]) },
      { key: "elevator", label: { en: "Elevator", fa: "لیفت", ps: "لفټ" }, type: "select", options: optionValues(["Yes", "No"]) },
    ],
    room: [
      ...commonFields.filter((f) => !["documentType"].includes(f.key)),
      { key: "rooms", label: { en: "Rooms", fa: "اتاق‌ها", ps: "کوټې" }, type: "number", min: 0 },
      { key: "bathroom", label: { en: "Bathroom", fa: "تشناب", ps: "تشناب" }, type: "select", options: optionValues(["Yes", "No"]) },
      { key: "furnished", label: { en: "Furnished", fa: "فرنیچر دارد", ps: "فرنیچر لري" }, type: "select", options: optionValues(["Yes", "No", "Semi Furnished"]) },
      { key: "sharedPrivate", label: { en: "Shared / Private", fa: "اشتراکی / شخصی", ps: "شریک / شخصي" }, type: "select", options: optionValues(["Private", "Shared"]) },
    ],
    shop: [
      ...commonFields,
      { key: "floor", label: { en: "Floor", fa: "منزل", ps: "منزل" }, type: "number", min: 0 },
      { key: "parking", label: { en: "Parking", fa: "پارکینگ", ps: "پارکینګ" }, type: "select", options: optionValues(["Yes", "No"]) },
    ],
    office: [
      ...commonFields,
      { key: "rooms", label: { en: "Rooms", fa: "اتاق‌ها", ps: "کوټې" }, type: "number", min: 0 },
      { key: "bathrooms", label: { en: "Bathrooms", fa: "تشناب", ps: "تشنابونه" }, type: "number", min: 0 },
      { key: "floor", label: { en: "Floor", fa: "منزل", ps: "منزل" }, type: "number", min: 0 },
      { key: "furnished", label: { en: "Furnished", fa: "فرنیچر دارد", ps: "فرنیچر لري" }, type: "select", options: optionValues(["Yes", "No", "Semi Furnished"]) },
      { key: "parking", label: { en: "Parking", fa: "پارکینگ", ps: "پارکینګ" }, type: "select", options: optionValues(["Yes", "No"]) },
      { key: "internet", label: { en: "Internet", fa: "انترنت", ps: "انټرنېټ" }, type: "select", options: optionValues(["Available", "Not Available"]) },
    ],
    warehouse: [
      ...commonFields,
      { key: "height", label: { en: "Height", fa: "ارتفاع", ps: "لوړوالی" }, type: "text" },
      { key: "truckAccess", label: { en: "Truck Access", fa: "دسترسی موتر باربری", ps: "د ټرک لاسرسی" }, type: "select", options: optionValues(["Yes", "No"]) },
      { key: "parking", label: { en: "Parking", fa: "پارکینگ", ps: "پارکینګ" }, type: "select", options: optionValues(["Yes", "No"]) },
    ],
  };

  const topCardsByKind: Record<string, SimpleCard[]> = {
    house: [
      { key: "areaSize", label: { en: "Area", fa: "مساحت", ps: "مساحت" } },
      { key: "rooms", label: { en: "Rooms", fa: "اتاق‌ها", ps: "کوټې" } },
      { key: "purpose", label: { en: "Purpose", fa: "هدف", ps: "هدف" } },
      { key: "propertyType", label: { en: "Property Type", fa: "نوع ملکیت", ps: "د ملکیت ډول" } },
    ],
    apartment: [
      { key: "areaSize", label: { en: "Area", fa: "مساحت", ps: "مساحت" } },
      { key: "bedrooms", label: { en: "Bedrooms", fa: "اتاق خواب", ps: "د خوب کوټې" } },
      { key: "floor", label: { en: "Floor", fa: "منزل", ps: "منزل" } },
      { key: "purpose", label: { en: "Purpose", fa: "هدف", ps: "هدف" } },
    ],
    room: [
      { key: "areaSize", label: { en: "Area", fa: "مساحت", ps: "مساحت" } },
      { key: "rooms", label: { en: "Rooms", fa: "اتاق‌ها", ps: "کوټې" } },
      { key: "furnished", label: { en: "Furnished", fa: "فرنیچر دارد", ps: "فرنیچر لري" } },
      { key: "purpose", label: { en: "Purpose", fa: "هدف", ps: "هدف" } },
    ],
    shop: [
      { key: "areaSize", label: { en: "Area", fa: "مساحت", ps: "مساحت" } },
      { key: "purpose", label: { en: "Purpose", fa: "هدف", ps: "هدف" } },
      { key: "floor", label: { en: "Floor", fa: "منزل", ps: "منزل" } },
      { key: "documentType", label: { en: "Document Type", fa: "نوع سند", ps: "د سند ډول" } },
    ],
    office: [
      { key: "areaSize", label: { en: "Area", fa: "مساحت", ps: "مساحت" } },
      { key: "rooms", label: { en: "Rooms", fa: "اتاق‌ها", ps: "کوټې" } },
      { key: "floor", label: { en: "Floor", fa: "منزل", ps: "منزل" } },
      { key: "purpose", label: { en: "Purpose", fa: "هدف", ps: "هدف" } },
    ],
    warehouse: [
      { key: "areaSize", label: { en: "Area", fa: "مساحت", ps: "مساحت" } },
      { key: "purpose", label: { en: "Purpose", fa: "هدف", ps: "هدف" } },
      { key: "truckAccess", label: { en: "Truck Access", fa: "دسترسی موتر باربری", ps: "د ټرک لاسرسی" } },
      { key: "electricity", label: { en: "Electricity", fa: "برق", ps: "برېښنا" } },
    ],
  };

  return {
    ...base,
    kind,
    title: TEXT.property,
    topCards: topCardsByKind[kind],
    rows: rowsByKind[kind],
    fields: fieldsByKind[kind],
  };
}

const FALLBACK_CONFIG: SimpleCategoryConfig = {
  kind: "fallback",
  title: { en: "Details", fa: "جزئیات", ps: "تفصیلات" },
  emptyMaintenance: { en: "No maintenance history available", fa: "تاریخچه سرویس موجود نیست", ps: "د ترمیم تاریخچه نشته" },
  maintenanceTitle: { en: "Maintenance History", fa: "تاریخچه سرویس", ps: "د ترمیم تاریخچه" },
  featureTitle: { en: "Features", fa: "ویژگی‌ها", ps: "خصوصیتونه" },
  makeModels: {},
  featureOptions: [],
  topCards: [
    { key: "type", label: { en: "Type", fa: "نوعیت", ps: "ډول" } },
    { key: "brand", label: { en: "Brand", fa: "برند", ps: "برنډ" } },
    { key: "condition", label: { en: "Condition", fa: "حالت", ps: "حالت" } },
    { key: "location", label: { en: "Location", fa: "موقعیت", ps: "ځای" } },
  ],
  rows: [
    { key: "type", label: { en: "Type", fa: "نوعیت", ps: "ډول" } },
    { key: "brand", label: { en: "Brand", fa: "برند", ps: "برنډ" } },
    { key: "model", label: { en: "Model", fa: "مدل", ps: "ماډل" } },
    { key: "condition", label: { en: "Condition", fa: "حالت", ps: "حالت" } },
    { key: "color", label: { en: "Color", fa: "رنگ", ps: "رنګ" } },
    { key: "location", label: { en: "Location", fa: "موقعیت", ps: "ځای" } },
  ],
  fields: [
    { key: "type", label: { en: "Type", fa: "نوعیت", ps: "ډول" }, type: "text" },
    { key: "brand", label: { en: "Brand", fa: "برند", ps: "برنډ" }, type: "text" },
    { key: "model", label: { en: "Model", fa: "مدل", ps: "ماډل" }, type: "text" },
    { key: "condition", label: { en: "Condition", fa: "حالت", ps: "حالت" }, type: "select", options: optionValues(["New", "Like New", "Used", "Damaged", "For Parts"]) },
    { key: "color", label: { en: "Color", fa: "رنگ", ps: "رنګ" }, type: "text" },
    { key: "location", label: { en: "Location", fa: "موقعیت", ps: "ځای" }, type: "text" },
  ],
};

const CONFIGS: Record<SimpleCategoryKind, SimpleCategoryConfig> = {
  car: CAR_CONFIG,
  motorcycle: MOTORCYCLE_CONFIG,
  mobilePhone: MOBILE_PHONE_CONFIG,
  tablet: TABLET_CONFIG,
  smartWatch: SMART_WATCH_CONFIG,
  phoneAccessory: PHONE_ACCESSORY_CONFIG,
  house: buildPropertyConfig("house"),
  apartment: buildPropertyConfig("apartment"),
  room: buildPropertyConfig("room"),
  land: buildPropertyConfig("land"),
  shop: buildPropertyConfig("shop"),
  office: buildPropertyConfig("office"),
  warehouse: buildPropertyConfig("warehouse"),
  ...(ELECTRONICS_LEAF_CONFIGS as Record<ElectronicsLeafKey, SimpleCategoryConfig>),
  fallback: FALLBACK_CONFIG,
};

function normalizeCategoryPath(value: string | undefined) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\\s+/g, "-")
    .replace(/_+/g, "-");
}

export function getSimpleCategoryKind(path: string | undefined, rootSlug?: string | null): SimpleCategoryKind | null {
  const normalizedPath = normalizeCategoryPath(path);
  const normalizedRoot = normalizeCategoryPath(rootSlug ?? undefined);

  const isElectronicsRoot =
    normalizedRoot === "mobile-phones-tablets"
    || normalizedRoot === "electronics-computers"
    || normalizedRoot === "phones-electronics"
    || normalizedPath.startsWith("mobile-phones-tablets")
    || normalizedPath.startsWith("electronics-computers")
    || normalizedPath.startsWith("phones-electronics");

  if (isElectronicsRoot) {
    const electronicsLeaf = detectElectronicsLeafKey(normalizedPath);
    const simpleKind = mapElectronicsLeafToSimpleKind(electronicsLeaf);
    if (simpleKind) {
      return simpleKind;
    }
  }

  if (normalizedRoot === "real-estate" || normalizedPath.startsWith("real-estate")) {
    if (/\bland\b/.test(normalizedPath)) return "land";
    if (/\bapartment/.test(normalizedPath)) return "apartment";
    if (/\broom/.test(normalizedPath) || /student|dormitory|hostel/.test(normalizedPath)) return "room";
    if (/\bshop/.test(normalizedPath)) return "shop";
    if (/\boffice/.test(normalizedPath)) return "office";
    if (/\bwarehouse/.test(normalizedPath)) return "warehouse";
    return "house";
  }

  if (normalizedRoot === "mobile-phones-tablets" || normalizedPath.includes("mobile") || normalizedPath.includes("phone") || normalizedPath.includes("tablet") || normalizedPath.includes("watch")) {
    if (/accessories|accessory/.test(normalizedPath)) return "phoneAccessory";
    if (/smart-?watch|watch/.test(normalizedPath)) return "smartWatch";
    if (/tablet/.test(normalizedPath)) return "tablet";
    return "mobilePhone";
  }

  if (normalizedRoot === "vehicles" || normalizedPath.startsWith("vehicles")) {
    if (normalizedPath.includes("bicycle") || normalizedPath.includes("bicycles")) {
      return "fallback";
    }
    if (/motorcycle|motorbike|scooter|rickshaw/.test(normalizedPath)) {
      return "motorcycle";
    }
    return "car";
  }

  return "fallback";
}

export function getSimpleCategoryConfig(kind: SimpleCategoryKind | null | undefined) {
  return kind ? CONFIGS[kind] : null;
}

export function shouldUseSimpleCategoryFallback(
  config: SimpleCategoryConfig | null | undefined,
  usesPublishedSchema: boolean
) {
  return Boolean(config) && !usesPublishedSchema;
}

export function getSimpleCategoryFieldKeys(kind: SimpleCategoryKind | null | undefined) {
  const config = getSimpleCategoryConfig(kind);
  if (!config) return [];
  return config.fields.flatMap((field) => {
    if (field.allowCustom) {
      return [field.key, `${field.key}Custom`];
    }
    return [field.key];
  });
}

export function getAllSimpleCategoryFieldKeys() {
  const all = new Set<string>();
  for (const key of Object.keys(CONFIGS) as SimpleCategoryKind[]) {
    for (const fieldKey of getSimpleCategoryFieldKeys(key)) {
      all.add(fieldKey);
    }
  }
  return [...all];
}

export function getSimpleCategoryOptions(kind: SimpleCategoryKind, fieldKey: string) {
  const config = CONFIGS[kind];
  const field = config.fields.find((item) => item.key === fieldKey);
  return field?.options ?? [];
}

export function getSimpleCategoryModelOptions(kind: SimpleCategoryKind, make: string) {
  const config = CONFIGS[kind];
  return config.makeModels[make] ?? [];
}

export function labelFor(locale: SimpleLocale, label: Record<SimpleLocale, string>) {
  return l(label, locale);
}

export function optionLabel(locale: SimpleLocale, option: SimpleOption) {
  return l(option.label, locale);
}
