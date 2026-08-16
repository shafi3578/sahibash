import type { AppLocale } from "@/lib/i18n/translations";

export type UserEvent = "WELCOME" | "VERIFY_EMAIL" | "PASSWORD_RESET" | "LISTING_SUBMITTED" | "LISTING_APPROVED" | "CHANGES_REQUESTED" | "LISTING_REJECTED" | "SECURITY_ALERT";

type Template = { subject: string; body: string };

const TEMPLATES: Record<AppLocale, Record<UserEvent, Template>> = {
  en: {
    WELCOME: { subject: "Welcome to Sahibash", body: "Your Sahibash account is ready." },
    VERIFY_EMAIL: { subject: "Verify your Sahibash email", body: "Use the secure verification link to confirm your email address." },
    PASSWORD_RESET: { subject: "Reset your Sahibash password", body: "Use the secure password-reset link. Ignore this message if you did not request it." },
    LISTING_SUBMITTED: { subject: "Your listing was submitted", body: "Your listing is under review. We will notify you when its status changes." },
    LISTING_APPROVED: { subject: "Your listing is active", body: "Your listing was approved and is now visible on Sahibash." },
    CHANGES_REQUESTED: { subject: "Your listing needs changes", body: "Review the moderator's note, update your listing, and submit it again." },
    LISTING_REJECTED: { subject: "Your listing was not approved", body: "Open your Sahibash account to review the decision and available next steps." },
    SECURITY_ALERT: { subject: "Sahibash security alert", body: "We detected a security-related account event. Review your account and change your password if you do not recognize it." },
  },
  fa: {
    WELCOME: { subject: "به صاحباش خوش آمدید", body: "حساب صاحباش شما آماده است." },
    VERIFY_EMAIL: { subject: "ایمیل صاحباش خود را تأیید کنید", body: "برای تأیید ایمیل از لینک امن تأیید استفاده کنید." },
    PASSWORD_RESET: { subject: "بازنشانی رمز صاحباش", body: "از لینک امن بازنشانی رمز استفاده کنید. اگر این درخواست از شما نیست، پیام را نادیده بگیرید." },
    LISTING_SUBMITTED: { subject: "اعلان شما ثبت شد", body: "اعلان شما زیر بررسی است. هنگام تغییر وضعیت به شما خبر می‌دهیم." },
    LISTING_APPROVED: { subject: "اعلان شما فعال شد", body: "اعلان شما تأیید شد و اکنون در صاحباش نمایش داده می‌شود." },
    CHANGES_REQUESTED: { subject: "اعلان شما نیاز به تغییر دارد", body: "یادداشت بررسی‌کننده را ببینید، اعلان را اصلاح و دوباره ثبت کنید." },
    LISTING_REJECTED: { subject: "اعلان شما تأیید نشد", body: "برای دیدن تصمیم و گام بعدی، حساب صاحباش خود را باز کنید." },
    SECURITY_ALERT: { subject: "هشدار امنیتی صاحباش", body: "یک رویداد امنیتی در حساب شناسایی شد. اگر آن را نمی‌شناسید، حساب را بررسی و رمز را تغییر دهید." },
  },
  ps: {
    WELCOME: { subject: "صاحباش ته ښه راغلاست", body: "ستاسو د صاحباش حساب چمتو دی." },
    VERIFY_EMAIL: { subject: "خپل صاحباش برېښنالیک تایید کړئ", body: "د برېښنالیک د تایید لپاره خوندي تاییدي لینک وکاروئ." },
    PASSWORD_RESET: { subject: "د صاحباش پټنوم بیا وټاکئ", body: "خوندي د پټنوم بیاټاکلو لینک وکاروئ. که غوښتنه مو نه وي کړې، دا پیغام له پامه وغورځوئ." },
    LISTING_SUBMITTED: { subject: "ستاسو اعلان ثبت شو", body: "اعلان مو تر کتنې لاندې دی. د حالت په بدلېدو به خبر درکړو." },
    LISTING_APPROVED: { subject: "ستاسو اعلان فعال شو", body: "اعلان مو تایید شو او اوس په صاحباش کې ښکاري." },
    CHANGES_REQUESTED: { subject: "ستاسو اعلان بدلون ته اړتیا لري", body: "د کتونکي یادښت وګورئ، اعلان سم او بیا یې ثبت کړئ." },
    LISTING_REJECTED: { subject: "ستاسو اعلان تایید نه شو", body: "د پرېکړې او راتلونکو ګامونو لپاره خپل صاحباش حساب پرانیزئ." },
    SECURITY_ALERT: { subject: "د صاحباش امنیتي خبرتیا", body: "په حساب کې امنیتي پېښه وموندل شوه. که یې نه پېژنئ، حساب وګورئ او پټنوم بدل کړئ." },
  },
};

export function renderUserEvent(event: UserEvent, locale: AppLocale, parameters: Record<string, string> = {}) {
  const template = TEMPLATES[locale][event];
  const interpolate = (value: string) => value.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key: string) => parameters[key] ?? "");
  return { event, locale, subject: interpolate(template.subject), body: interpolate(template.body) };
}

export const USER_EVENT_TEMPLATES = TEMPLATES;
