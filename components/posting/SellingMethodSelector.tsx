"use client";

import { useTranslation } from "@/lib/i18n/client";
import type { SellingMethod } from "@/lib/posting/types";

type SellingMethodSelectorProps = {
  value: SellingMethod;
  onChange: (method: SellingMethod) => void;
  allowedMethods?: SellingMethod[]; // if provided, only these are shown
  locale?: string;
};

const ALL_METHODS: SellingMethod[] = ["sell", "rent", "exchange", "wanted", "negotiable"];

export function SellingMethodSelector({
  value,
  onChange,
  allowedMethods,
  locale = "en",
}: SellingMethodSelectorProps) {
  const { t } = useTranslation(locale as any);
  const methods = allowedMethods || ALL_METHODS;

  const methodLabels: Record<SellingMethod, string> = {
    sell: t("selling_method.sell") || "Sell",
    rent: t("selling_method.rent") || "Rent",
    exchange: t("selling_method.exchange") || "Exchange / Trade",
    wanted: t("selling_method.wanted") || "Wanted",
    negotiable: t("selling_method.negotiable") || "Negotiable",
  };

  const methodIcons: Record<SellingMethod, string> = {
    sell: "🏷️",
    rent: "🔄",
    exchange: "🔁",
    wanted: "🔍",
    negotiable: "💬",
  };

  return (
    <div>
      <label className="block text-sm font-semibold mb-3">
        {t("posting.sellingMethod") || "Selling Method"}
      </label>
      <div className="flex flex-wrap gap-2">
        {methods.map((method) => (
          <button
            key={method}
            onClick={() => onChange(method)}
            className={`px-4 py-2 rounded-lg border-2 transition font-medium ${
              value === method
                ? "border-green-500 bg-green-50 text-green-700"
                : "border-gray-300 bg-white text-gray-700 hover:border-green-300"
            }`}
          >
            <span className="mr-1">{methodIcons[method]}</span>
            {methodLabels[method]}
          </button>
        ))}
      </div>
    </div>
  );
}
