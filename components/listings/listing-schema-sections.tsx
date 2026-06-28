import type { ReactNode } from "react";
import type { SchemaFieldResult } from "@/lib/listingSchemas/shared";

export function ListingQuickFacts({ rows, autoFilledLabel }: { rows: SchemaFieldResult[]; autoFilledLabel: string }) {
  if (rows.length === 0) return null;

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((row) => (
        <div key={row.key} className="rounded-2xl border border-[var(--line)] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-2)]">{row.label}</p>
          <p className="mt-1 text-lg font-bold text-[var(--ink-1)]">{renderValue(row.value)}</p>
          {row.autoFilled ? <p className="mt-1 text-xs font-semibold text-[var(--accent)]">{autoFilledLabel}</p> : null}
        </div>
      ))}
    </section>
  );
}

export function ListingDetailSection({
  title,
  rows,
  description,
  emptyStateText,
}: {
  title: string;
  rows: SchemaFieldResult[];
  description?: string;
  emptyStateText?: string;
}) {
  return (
    <section className="rounded-2xl border border-[var(--line)] bg-white p-4 sm:p-5">
      <h2 className="text-base font-bold">{title}</h2>
      {description ? <p className="mt-1 text-sm text-[var(--ink-2)]">{description}</p> : null}
      {rows.length > 0 ? (
        <div className="mt-3 overflow-hidden rounded-xl border border-[var(--line)]">
          {rows.map((row) => (
            <div key={row.key} className="grid grid-cols-[1fr_auto] gap-3 border-b border-[var(--line)] px-3 py-2 text-sm last:border-b-0">
              <p className="text-[var(--ink-2)]">{row.label}</p>
              <p className="max-w-[58vw] break-words text-right font-semibold text-[var(--ink-1)] sm:max-w-none">{renderValue(row.value)}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--ink-2)]">
          {emptyStateText}
        </p>
      )}
    </section>
  );
}

export function CategorySpecificDetails({
  sections,
  emptyStateText,
}: {
  sections: Array<{ key: string; title: string; description?: string; rows: SchemaFieldResult[] }>;
  emptyStateText: string;
}) {
  if (sections.length === 0) return null;

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <ListingDetailSection
          key={section.key}
          title={section.title}
          description={section.description}
          rows={section.rows}
          emptyStateText={emptyStateText}
        />
      ))}
    </div>
  );
}

export function SafetyTips({ title, tips }: { title: string; tips: string[] }) {
  if (tips.length === 0) return null;

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
      <h2 className="text-base font-bold text-amber-900">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm text-amber-900">
        {tips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
    </section>
  );
}

function renderValue(value: string | string[]): ReactNode {
  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap justify-end gap-2">
        {value.map((item) => (
          <span key={item} className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-2 py-1 text-xs font-semibold text-[var(--ink-1)]">
            {item}
          </span>
        ))}
      </div>
    );
  }

  return value;
}
