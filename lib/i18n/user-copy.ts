import type { AppLocale } from "@/lib/i18n/translations";

export const USER_COPY = {
  en: {
    accountSecurity: "Account Security",
    accountSecurityDescription: "Manage your password and account security preferences.",
    resetPasswordHelp: "Use the secure password-reset flow to choose a new password.",
    resetPassword: "Reset Password",
    statuses: { draft: "Draft", pending: "Under review", approved: "Active", rejected: "Rejected", sold: "Sold", expired: "Expired", archived: "Archived", suspended: "Suspended", deleted: "Deleted" },
    errors: {
      invalidCredentials: "The email address or password is incorrect.",
      emailNotConfirmed: "Verify your email address before signing in.",
      emailAlreadyRegistered: "An account already exists for this email address.",
      weakPassword: "Choose a stronger password with at least six characters.",
      rateLimited: "Too many attempts. Please wait and try again.",
      genericAuth: "We could not complete the request. Please try again.",
      generic: "Something went wrong. Please try again.",
    },
    notFoundTitle: "Page not found",
    notFoundDescription: "The page may have moved, expired, or no longer exists.",
    errorTitle: "Something went wrong",
    errorDescription: "We could not load this page. Your account and saved information are safe.",
    tryAgain: "Try again",
    backHome: "Back to home",
    info: {
      privacy: { title: "Privacy", intro: "Your privacy matters to Sahibash.", body: "We use account, listing, location, and communication information only to operate and protect the marketplace. Precise location is shown only when you choose to share it. Never publish passwords, verification codes, or sensitive identity documents in a listing or message." },
      terms: { title: "Terms of Use", intro: "Use Sahibash honestly, safely, and lawfully.", body: "Post only genuine listings you are authorized to offer. Describe items accurately, respect other users, and do not post prohibited, fraudulent, discriminatory, or dangerous content. Sahibash may review, restrict, or remove content that violates marketplace rules." },
      safety: { title: "Marketplace Safety", intro: "Check before you pay, meet, or share information.", body: "Inspect items in person when practical, meet in a safe public place, verify ownership and documents, and use trusted payment methods. Never send verification codes or advance payments to an unknown person. Report suspicious listings or messages." },
      contact: { title: "Contact Sahibash", intro: "We are here to help with marketplace and account concerns.", body: "Use the contact information in the site footer for support. Include the listing ID when reporting a listing, but never send your password or verification code." },
    },
  },
  fa: {
    accountSecurity: "امنیت حساب",
    accountSecurityDescription: "رمز و تنظیمات امنیتی حساب خود را مدیریت کنید.",
    resetPasswordHelp: "برای تعیین رمز جدید از روند امن بازنشانی رمز استفاده کنید.",
    resetPassword: "بازنشانی رمز",
    statuses: { draft: "پیش‌نویس", pending: "زیر بررسی", approved: "فعال", rejected: "ردشده", sold: "فروخته‌شده", expired: "منقضی", archived: "آرشیف‌شده", suspended: "تعلیق‌شده", deleted: "حذف‌شده" },
    errors: {
      invalidCredentials: "ایمیل یا رمز نادرست است.",
      emailNotConfirmed: "پیش از ورود، ایمیل خود را تأیید کنید.",
      emailAlreadyRegistered: "با این ایمیل از قبل حسابی ساخته شده است.",
      weakPassword: "رمز قوی‌تر با حداقل شش حرف انتخاب کنید.",
      rateLimited: "تلاش‌ها بیش از حد بود. کمی صبر کرده دوباره کوشش کنید.",
      genericAuth: "درخواست انجام نشد. لطفاً دوباره کوشش کنید.",
      generic: "مشکلی رخ داد. لطفاً دوباره کوشش کنید.",
    },
    notFoundTitle: "صفحه پیدا نشد",
    notFoundDescription: "ممکن است صفحه انتقال یافته، منقضی شده یا دیگر موجود نباشد.",
    errorTitle: "مشکلی رخ داد",
    errorDescription: "این صفحه بار نشد. حساب و معلومات ذخیره‌شده شما محفوظ است.",
    tryAgain: "دوباره کوشش کنید",
    backHome: "بازگشت به صفحه اصلی",
    info: {
      privacy: { title: "حریم خصوصی", intro: "حریم خصوصی شما برای صاحباش مهم است.", body: "معلومات حساب، اعلان، موقعیت و ارتباطات تنها برای فعالیت و امنیت بازار استفاده می‌شود. موقعیت دقیق فقط زمانی نمایش داده می‌شود که خودتان آن را شریک سازید. رمز، کود تأیید یا اسناد حساس هویتی را در اعلان یا پیام نشر نکنید." },
      terms: { title: "شرایط استفاده", intro: "از صاحباش صادقانه، مصئون و قانونی استفاده کنید.", body: "تنها اعلان واقعی را که اجازه عرضه آن را دارید نشر کنید. جنس را درست معرفی کنید، به کاربران احترام بگذارید و محتوای ممنوع، فریب‌کارانه، تبعیض‌آمیز یا خطرناک نشر نکنید. صاحباش می‌تواند محتوای خلاف مقررات بازار را بررسی، محدود یا حذف کند." },
      safety: { title: "مصئونیت در بازار", intro: "پیش از پرداخت، ملاقات یا شریک‌ساختن معلومات بررسی کنید.", body: "در صورت امکان جنس را حضوری ببینید، در محل عمومی و مصئون ملاقات کنید، مالکیت و اسناد را بررسی نمایید و از روش پرداخت قابل اعتماد استفاده کنید. کود تأیید یا پول پیشکی را به شخص ناشناس نفرستید. اعلان یا پیام مشکوک را گزارش دهید." },
      contact: { title: "تماس با صاحباش", intro: "برای مشکلات بازار و حساب آماده کمک هستیم.", body: "برای پشتیبانی از معلومات تماس پایین سایت استفاده کنید. هنگام گزارش اعلان، شناسه اعلان را بنویسید؛ اما هرگز رمز یا کود تأیید خود را نفرستید." },
    },
  },
  ps: {
    accountSecurity: "د حساب امنیت",
    accountSecurityDescription: "خپل پټنوم او د حساب امنیتي امستنې اداره کړئ.",
    resetPasswordHelp: "د نوي پټنوم ټاکلو لپاره خوندي د پټنوم بیاټاکلو بهیر وکاروئ.",
    resetPassword: "پټنوم بیا وټاکئ",
    statuses: { draft: "مسوده", pending: "تر کتنې لاندې", approved: "فعال", rejected: "رد شوی", sold: "پلورل شوی", expired: "پای ته رسېدلی", archived: "آرشیف شوی", suspended: "ځنډول شوی", deleted: "ړنګ شوی" },
    errors: {
      invalidCredentials: "برېښنالیک یا پټنوم سم نه دی.",
      emailNotConfirmed: "له ننوتلو مخکې خپل برېښنالیک تایید کړئ.",
      emailAlreadyRegistered: "په دې برېښنالیک مخکې حساب جوړ شوی دی.",
      weakPassword: "لږ تر لږه شپږ توري لرونکی پیاوړی پټنوم وټاکئ.",
      rateLimited: "هڅې ډېرې شوې. لږ تم شئ او بیا هڅه وکړئ.",
      genericAuth: "غوښتنه بشپړه نه شوه. مهرباني وکړئ بیا هڅه وکړئ.",
      generic: "ستونزه رامنځته شوه. مهرباني وکړئ بیا هڅه وکړئ.",
    },
    notFoundTitle: "پاڼه ونه موندل شوه",
    notFoundDescription: "کېدای شي پاڼه لېږدول شوې، پای ته رسېدلې یا نوره شتون ونه لري.",
    errorTitle: "ستونزه رامنځته شوه",
    errorDescription: "دا پاڼه پورته نه شوه. ستاسو حساب او ساتل شوي معلومات خوندي دي.",
    tryAgain: "بیا هڅه وکړئ",
    backHome: "کور ته ستانه شئ",
    info: {
      privacy: { title: "محرمیت", intro: "ستاسو محرمیت صاحباش ته مهم دی.", body: "د حساب، اعلان، ځای او اړیکو معلومات یوازې د بازار د چلولو او ساتنې لپاره کارول کېږي. کره ځای یوازې هغه وخت ښودل کېږي چې تاسو یې شریکول وغواړئ. پټنوم، تایید کوډ یا حساس پېژندپاڼې په اعلان یا پیغام کې مه خپروئ." },
      terms: { title: "د کارولو شرطونه", intro: "صاحباش په رښتینولۍ، خوندي او قانوني ډول وکاروئ.", body: "یوازې هغه رښتیني اعلانونه خپاره کړئ چې د وړاندې کولو اجازه یې لرئ. توکي سم تشریح کړئ، نورو کاروونکو ته درناوی وکړئ او منع، درغلیز، تبعیضي یا خطرناک منځپانګه مه خپروئ. صاحباش کولای شي د بازار له اصولو سرغړوونکې منځپانګه وڅېړي، محدوده یا ړنګه کړي." },
      safety: { title: "د بازار خوندیتوب", intro: "له پیسو، لیدنې یا معلوماتو شریکولو مخکې پلټنه وکړئ.", body: "که شونې وي توکي مخامخ وګورئ، په خوندي عامه ځای کې ووینئ، مالکیت او اسناد تایید کړئ او باوري د پیسو لېږد وکاروئ. نااشنا کس ته تایید کوډ یا مخکې پیسې مه لېږئ. شکمن اعلان یا پیغام راپور کړئ." },
      contact: { title: "له صاحباش سره اړیکه", intro: "د بازار او حساب په ستونزو کې مرستې ته چمتو یو.", body: "د ملاتړ لپاره د سایټ په پای کې د اړیکې معلومات وکاروئ. د اعلان د راپور پر مهال د اعلان پېژند ورسره ولیکئ، خو خپل پټنوم یا تایید کوډ هېڅکله مه لېږئ." },
    },
  },
} as const satisfies Record<AppLocale, Record<string, unknown>>;

export type UserInfoPage = keyof typeof USER_COPY.en.info;

export function localizeAuthError(message: string, locale: AppLocale) {
  const normalized = message.toLowerCase();
  const copy = USER_COPY[locale].errors;
  if (normalized.includes("invalid login credentials")) return copy.invalidCredentials;
  if (normalized.includes("email not confirmed")) return copy.emailNotConfirmed;
  if (normalized.includes("already registered") || normalized.includes("user already")) return copy.emailAlreadyRegistered;
  if (normalized.includes("password") && (normalized.includes("weak") || normalized.includes("least"))) return copy.weakPassword;
  if (normalized.includes("rate") || normalized.includes("too many")) return copy.rateLimited;
  return copy.genericAuth;
}

export function localizeActionMessage(message: string, locale: AppLocale) {
  const normalized = message.toLowerCase();
  const copy = USER_COPY[locale];
  if (normalized.includes("valid email")) return locale === "fa" ? "لطفاً یک ایمیل معتبر وارد کنید." : locale === "ps" ? "مهرباني وکړئ سم برېښنالیک دننه کړئ." : "Please enter a valid email address.";
  if (normalized.includes("already on the waitlist")) return locale === "fa" ? "شما از قبل در فهرست انتظار هستید." : locale === "ps" ? "تاسو له مخکې د انتظار په لست کې یاست." : "You are already on the waitlist.";
  if (normalized.includes("waitlist") && (normalized.includes("could not") || normalized.includes("failed"))) return copy.errors.generic;
  if (normalized.includes("listing created successfully")) return locale === "fa" ? "اعلان با موفقیت ثبت شد." : locale === "ps" ? "اعلان په بریالیتوب ثبت شو." : "Listing created successfully.";
  if (normalized.includes("log in") || normalized === "unauthorized") return locale === "fa" ? "برای ادامه وارد حساب شوید." : locale === "ps" ? "د دوام لپاره خپل حساب ته ننوځئ." : "Sign in to continue.";
  if (normalized.includes("category") && (normalized.includes("required") || normalized.includes("must select"))) return locale === "fa" ? "انتخاب دسته‌بندی الزامی است." : locale === "ps" ? "د کټګورۍ ټاکل اړین دي." : "Select a category.";
  if (normalized.includes("location") && (normalized.includes("required") || normalized.includes("add"))) return locale === "fa" ? "پیش از نشر اعلان، موقعیت را اضافه کنید." : locale === "ps" ? "د اعلان له خپرولو مخکې ځای ورزیات کړئ." : "Add a location before publishing.";
  if (normalized.includes("required") || normalized.includes("invalid") || normalized.includes("failed") || normalized.includes("could not")) return copy.errors.generic;
  return message;
}
