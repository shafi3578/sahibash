import type { AppLocale } from "@/lib/i18n/translations";

export type ListingAiFact = {
  key: string;
  label: string;
  value: string | null;
};

const COPY = {
  en: {
    title: "Ask Sahibash about this ad",
    subtitle: "Factual answers only from the listing. If the seller did not provide a detail, Sahibash says so.",
    notMentioned: "Not mentioned in this listing",
    knownFacts: "Known facts",
    price: "What is the price?",
    location: "Where is it located?",
    condition: "What important details are available?",
    sellerTip: "Seller improvement tip",
    sellerTipText: "Add missing high-value details to get better buyer questions and fewer repeated messages.",
  },
  fa: {
    title: "از صاحبش درباره این اعلان بپرسید",
    subtitle: "فقط پاسخ‌های واقعی از معلومات خود اعلان. اگر فروشنده چیزی ننوشته باشد، صاحبش واضح می‌گوید.",
    notMentioned: "در این اعلان ذکر نشده است",
    knownFacts: "معلومات موجود",
    price: "قیمت چقدر است؟",
    location: "موقعیت کجاست؟",
    condition: "کدام جزئیات مهم موجود است؟",
    sellerTip: "پیشنهاد برای فروشنده",
    sellerTipText: "جزئیات مهمِ کمبود را اضافه کنید تا پرسش‌های خریدار بهتر و پیام‌های تکراری کمتر شود.",
  },
  ps: {
    title: "له صاحبش څخه د دې اعلان په اړه وپوښتئ",
    subtitle: "یوازې د اعلان له معلوماتو څخه واقعي ځوابونه. که پلورونکي جزئیات نه وي لیکلي، صاحبش یې ښکاره وایي.",
    notMentioned: "په دې اعلان کې نه دي یاد شوي",
    knownFacts: "شته معلومات",
    price: "بیه څو ده؟",
    location: "چېرته موقعیت لري؟",
    condition: "کوم مهم جزئیات شته؟",
    sellerTip: "د پلورونکي لپاره وړاندیز",
    sellerTipText: "مهم ورک جزئیات زیات کړئ تر څو د پېرودونکو پوښتنې ښه او تکراري پیغامونه کم شي.",
  },
};

function cleanFactValue(value: string | null | undefined, fallback: string) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed || trimmed === "-" || trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "undefined") {
    return fallback;
  }
  return trimmed;
}

export function ListingAiAssistant({
  locale,
  facts,
  isOwner,
}: {
  locale: AppLocale;
  facts: ListingAiFact[];
  isOwner: boolean;
}) {
  const copy = COPY[locale];
  const factMap = new Map(facts.map((fact) => [fact.key, fact]));
  const answerFacts = facts
    .filter((fact) => cleanFactValue(fact.value, "") !== "")
    .slice(0, 8);

  const price = cleanFactValue(factMap.get("price")?.value, copy.notMentioned);
  const location = cleanFactValue(factMap.get("location")?.value, copy.notMentioned);
  const detailAnswer = answerFacts.length
    ? answerFacts.map((fact) => `${fact.label}: ${cleanFactValue(fact.value, copy.notMentioned)}`).join(" · ")
    : copy.notMentioned;

  return (
    <section className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-700 text-lg font-black text-white">
          AI
        </span>
        <div>
          <h2 className="text-base font-black text-indigo-950">{copy.title}</h2>
          <p className="mt-1 text-sm leading-6 text-indigo-900">{copy.subtitle}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <details className="rounded-2xl border border-indigo-100 bg-white p-3" open>
          <summary className="cursor-pointer text-sm font-bold text-slate-950">{copy.price}</summary>
          <p className="mt-2 text-sm text-slate-700">{price}</p>
        </details>
        <details className="rounded-2xl border border-indigo-100 bg-white p-3">
          <summary className="cursor-pointer text-sm font-bold text-slate-950">{copy.location}</summary>
          <p className="mt-2 text-sm text-slate-700">{location}</p>
        </details>
        <details className="rounded-2xl border border-indigo-100 bg-white p-3">
          <summary className="cursor-pointer text-sm font-bold text-slate-950">{copy.condition}</summary>
          <p className="mt-2 text-sm leading-6 text-slate-700">{detailAnswer}</p>
        </details>
      </div>

      {isOwner ? (
        <div className="mt-4 rounded-2xl border border-dashed border-indigo-200 bg-white/80 p-3 text-sm text-indigo-950">
          <p className="font-bold">{copy.sellerTip}</p>
          <p className="mt-1">{copy.sellerTipText}</p>
        </div>
      ) : null}
    </section>
  );
}
