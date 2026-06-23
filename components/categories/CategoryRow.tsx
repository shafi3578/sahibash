import Link from "next/link";

type Props = {
  href?: string;
  title: string;
  subtitle?: string | null;
  icon?: string | null;
  count?: number;
  showCount?: boolean;
  comingSoon?: boolean;
  countStyle?: "plain" | "paren";
  compact?: boolean;
  showIcon?: boolean;
  emphasize?: boolean;
};

function iconFromName(icon?: string | null) {
  const key = (icon ?? "").toLowerCase();
  if (key.includes("home") || key.includes("building")) return "🏠";
  if (key.includes("car") || key.includes("truck") || key.includes("van")) return "🚗";
  if (key.includes("bike")) return "🏍";
  if (key.includes("phone") || key.includes("smart")) return "📱";
  if (key.includes("laptop")) return "💻";
  if (key.includes("tablet")) return "📲";
  if (key.includes("tv")) return "📺";
  if (key.includes("sofa")) return "🛋";
  if (key.includes("fridge")) return "🧊";
  if (key.includes("shirt")) return "👕";
  if (key.includes("briefcase")) return "💼";
  if (key.includes("wrench")) return "🛠";
  if (key.includes("factory")) return "🏭";
  if (key.includes("tractor")) return "🚜";
  if (key.includes("book")) return "📚";
  if (key.includes("trophy")) return "🏆";
  if (key.includes("store")) return "🏬";
  if (key.includes("map")) return "🗺";
  if (key.includes("bus")) return "🚌";
  if (key.includes("bicycle")) return "🚲";
  if (key.includes("box")) return "📦";
  return "📂";
}

function iconTone(icon?: string | null) {
  const key = (icon ?? "").toLowerCase();
  if (key.includes("home") || key.includes("building")) return "bg-amber-400";
  if (key.includes("car") || key.includes("truck")) return "bg-red-500";
  if (key.includes("phone") || key.includes("smart") || key.includes("laptop")) return "bg-cyan-500";
  if (key.includes("shirt") || key.includes("book") || key.includes("trophy")) return "bg-emerald-500";
  if (key.includes("briefcase") || key.includes("wrench") || key.includes("factory")) return "bg-slate-600";
  if (key.includes("tractor") || key.includes("bus") || key.includes("bicycle")) return "bg-lime-600";
  if (key.includes("store") || key.includes("box")) return "bg-indigo-500";
  return "bg-slate-400";
}

function formatCount(count?: number, style: "plain" | "paren" = "paren") {
  const value = new Intl.NumberFormat("tr-TR").format(Math.max(0, Number(count ?? 0)));
  return style === "plain" ? value : `(${value})`;
}

export function CategoryRow({
  href,
  title,
  subtitle,
  icon,
  count,
  showCount = true,
  comingSoon = false,
  countStyle = "paren",
  compact = false,
  showIcon = false,
  emphasize = false,
}: Props) {
  const content = (
    <div className={`flex items-center gap-3 bg-white px-4 ${compact ? "py-2" : "py-2.5"}`}>
      {showIcon ? (
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[15px] text-white ${iconTone(icon)}`}>
          {iconFromName(icon)}
        </div>
      ) : null}
      <div className="min-w-0 flex-1 pr-2">
        <p className={`leading-6 break-words ${emphasize ? "font-semibold text-[#236dab]" : "text-slate-800"} ${compact ? "text-[17px]" : "text-[18px]"}`}>{title}</p>
        {subtitle ? <p className="mt-0.5 text-[12px] leading-4 text-slate-400 break-words">{subtitle}</p> : null}
        {comingSoon ? <p className="mt-0.5 text-xs font-semibold text-amber-600">Coming soon</p> : null}
      </div>
      {showCount && !comingSoon ? <p className="shrink-0 text-[14px] text-slate-400">{formatCount(count, countStyle)}</p> : null}
      <span className="text-[22px] leading-none text-slate-300">›</span>
    </div>
  );

  if (href && !comingSoon) {
    return (
      <Link href={href} className="block border-b border-slate-100 last:border-b-0">
        {content}
      </Link>
    );
  }

  return <div className="border-b border-slate-100 last:border-b-0">{content}</div>;
}
