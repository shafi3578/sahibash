import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { getCurrentLocale } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routing";
import { VEHICLE_MODELS_3D } from "@/lib/vehicles/model-catalog";
import { Vehicle3DManager } from "@/components/admin/vehicle-3d-manager";

export default async function AdminVehicle3DPage() {
  await requirePermission("settings.update");
  const locale = await getCurrentLocale();
  const copy = locale === "fa"
    ? {
        back: "بازگشت به ادمین",
        title: "کنترول مدل‌های سه‌بعدی موتر",
        subtitle: "نمایش سه‌بعدی برای خریداران فعلاً خاموش است. این صفحه جای حرفه‌ای برای فعال‌سازی، انتخاب مدل موتر، آپلود فایل GLB و فعال‌سازی بعدی را آماده می‌کند.",
        global: "وضعیت عمومی",
        off: "خاموش برای خریداران",
        on: "روشن در حالت آماده‌سازی",
        onLater: "پس از تکمیل ذخیره‌سازی، می‌توان برای هر مدل روشن کرد.",
        choose: "مدل‌های پشتیبانی‌شده",
        selected: "برای شروع، مدل‌های موتر را انتخاب کنید.",
        selectModels: "انتخاب مدل‌های موتر",
        close: "بستن",
        upload: "آپلود مدل سه‌بعدی",
        inactive: "غیرفعال",
        draft: "آماده آپلود",
        submit: "ذخیره و فعال‌سازی بعداً",
        disabled: "آپلود پس از وصل‌شدن Storage فعال می‌شود",
        storageNote: "برای جلوگیری از خرابی سایت، فایل‌ها بعداً با Storage، نسخه‌بندی، اعتبارسنجی GLB و امکان برگشت ذخیره می‌شوند.",
        activeLater: "بعداً فعال شود",
      }
    : locale === "ps"
      ? {
          back: "ادمین ته بېرته",
          title: "د موټر درې‌بعدي موډل کنټرول",
          subtitle: "د پېرودونکو لپاره 3D اوس بند دی. دا پاڼه د فعالولو، د موټر موډل ټاکلو، GLB اپلوډ او وروسته فعالولو مسلکي ځای چمتو کوي.",
          global: "عمومي حالت",
          off: "د پېرودونکو لپاره بند",
          on: "د چمتووالي حالت کې روښانه",
          onLater: "د Storage له نښلېدو وروسته هر موډل جلا فعالېږي.",
          choose: "ملاتړ شوي موډلونه",
          selected: "د پیل لپاره د موټر موډلونه وټاکئ.",
          selectModels: "د موټر موډلونه وټاکئ",
          close: "بندول",
          upload: "درې‌بعدي موډل اپلوډ",
          inactive: "غیرفعال",
          draft: "د اپلوډ لپاره چمتو",
          submit: "وساتئ او وروسته فعال کړئ",
          disabled: "اپلوډ به د Storage له وصلېدو وروسته فعال شي",
          storageNote: "د سایټ د خوندي ساتلو لپاره فایلونه وروسته د Storage، نسخه‌بندۍ، GLB اعتبارسنجۍ او بېرته‌ګرځولو امکان سره ساتل کېږي.",
          activeLater: "وروسته فعال",
        }
      : {
          back: "Back to admin",
          title: "Vehicle 3D Model Control",
          subtitle: "Buyer-facing 3D is currently off. This page reserves the professional workflow for enabling 3D, choosing car models, uploading GLB assets, and activating them later.",
          global: "Global status",
          off: "Off for buyers",
          on: "On for preparation",
          onLater: "After storage is wired, each model can be activated individually.",
          choose: "Supported models",
          selected: "Select car models to prepare upload slots.",
          selectModels: "Choose car models",
          close: "Close",
          upload: "Upload 3D model",
          inactive: "Inactive",
          draft: "Ready for upload",
          submit: "Save and activate later",
          disabled: "Upload activates after Storage is connected",
          storageNote: "Files will be stored later with Storage, GLB validation, versioning, audit history, and rollback before buyers can see them.",
          activeLater: "Activate later",
        };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href={localizePath("/admin", locale)} className="text-sm font-semibold text-[var(--ink-2)]">← {copy.back}</Link>
      <div className="mt-6 rounded-3xl border border-[var(--line)] bg-white p-6 shadow-sm">
        <h1 className="mt-4 font-display text-3xl font-bold">{copy.title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--ink-2)]">{copy.subtitle}</p>
      </div>

      <div className="mt-6">
        <Vehicle3DManager models={VEHICLE_MODELS_3D} copy={copy} />
      </div>
    </main>
  );
}
