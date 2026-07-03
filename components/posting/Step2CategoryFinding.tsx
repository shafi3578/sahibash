"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/client";
import type { PostingState, CategoryNode } from "@/lib/posting/types";
import {
  getRootCategories,
  getChildCategories,
  getCategoryPath,
  isValidCategoryPath,
} from "@/lib/posting/categoryTree";

type Step2CategoryFindingProps = {
  state: PostingState;
  onStateChange: (updates: Partial<PostingState>) => void;
  onNext: () => void;
  onBack: () => void;
  locale?: string;
};

type Tab = "ai" | "manual";

export function Step2CategoryFinding({
  state,
  onStateChange,
  onNext,
  onBack,
  locale = "en",
}: Step2CategoryFindingProps) {
  const { t } = useTranslation(locale as any);
  const [activeTab, setActiveTab] = useState<Tab>(state.aiSuggestion ? "ai" : "manual");
  const [breadcrumb, setBreadcrumb] = useState<CategoryNode[]>([]);
  const [availableOptions, setAvailableOptions] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch AI suggestion on mount if not already cached
  useEffect(() => {
    if (!state.aiSuggestion && state.title) {
      const fetchSuggestion = async () => {
        try {
          setLoading(true);
          const response = await fetch("/api/posting/suggest-category", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: state.title,
              description: state.description,
              location: {
                province: state.location.provinceName,
                district: state.location.districtName,
              },
              sellingMethod: state.sellingMethod,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.suggestion) {
              onStateChange({ aiSuggestion: data.suggestion });
              setActiveTab("ai");
            }
          }
        } catch (error) {
          console.error("Failed to fetch suggestion:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchSuggestion();
    }
  }, [state.title]); // Only fetch when title changes

  // Initialize with root categories
  useEffect(() => {
    if (breadcrumb.length === 0) {
      setAvailableOptions(getRootCategories());
    }
  }, []);

  const handleSelectNode = (node: CategoryNode) => {
    const newBreadcrumb = [...breadcrumb, node];
    setBreadcrumb(newBreadcrumb);

    if (node.finalNode) {
      // This is a final category, we can continue
      onStateChange({
        selectedCategoryPath: newBreadcrumb,
        finalCategoryNodeId: node.id,
      });
      return;
    }

    // Show children of selected node
    const children = getChildCategories(node.id);
    setAvailableOptions(children);
  };

  const handleGoBack = () => {
    if (breadcrumb.length > 0) {
      const newBreadcrumb = breadcrumb.slice(0, -1);
      setBreadcrumb(newBreadcrumb);

      if (newBreadcrumb.length === 0) {
        setAvailableOptions(getRootCategories());
      } else {
        const parent = newBreadcrumb[newBreadcrumb.length - 1];
        const children = getChildCategories(parent.id);
        setAvailableOptions(children);
      }
    }
  };

  const handleAcceptAISuggestion = () => {
    if (state.aiSuggestion) {
      onStateChange({
        selectedCategoryPath: state.aiSuggestion.categoryPath,
        finalCategoryNodeId:
          state.aiSuggestion.categoryPath[state.aiSuggestion.categoryPath.length - 1].id,
      });
      onNext();
    }
  };

  const canContinue =
    breadcrumb.length > 0 &&
    isValidCategoryPath(breadcrumb) &&
    breadcrumb[breadcrumb.length - 1].finalNode;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">{t("posting.step2.title") || "Step 2: Category"}</h2>
        <p className="text-gray-600">
          {t("posting.step2.description") ||
            "Help us find the right category for your item. You can accept AI suggestion or choose manually."}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {state.aiSuggestion && (
          <button
            onClick={() => setActiveTab("ai")}
            className={`px-4 py-2 border-b-2 transition ${
              activeTab === "ai"
                ? "border-blue-500 text-blue-600 font-semibold"
                : "border-transparent text-gray-600 hover:text-gray-800"
            }`}
          >
            🤖 {t("posting.aiSuggestion") || "AI Suggestion"}
          </button>
        )}
        <button
          onClick={() => setActiveTab("manual")}
          className={`px-4 py-2 border-b-2 transition ${
            activeTab === "manual"
              ? "border-blue-500 text-blue-600 font-semibold"
              : "border-transparent text-gray-600 hover:text-gray-800"
          }`}
        >
          {t("posting.manualSelection") || "Manual Selection"}
        </button>
      </div>

      {/* AI Tab */}
      {activeTab === "ai" && state.aiSuggestion && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-semibold mb-3">
            {t("posting.aiSuggestedCategory") || "AI Suggested Category:"}
          </p>
          <div className="flex flex-wrap gap-1 mb-4">
            {state.aiSuggestion?.categoryPath.map((node, idx) => (
              <span key={node.id}>
                <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded text-sm">
                  {node.name || node.slug}
                </span>
                {idx < (state.aiSuggestion?.categoryPath.length ?? 0) - 1 && (
                  <span className="mx-1 text-gray-400">/</span>
                )}
              </span>
            ))}
          </div>
          <p className="text-sm text-gray-700 mb-4">
            {state.aiSuggestion?.reasoning}
          </p>
          <button
            onClick={handleAcceptAISuggestion}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-semibold"
          >
            {t("posting.acceptSuggestion") || "Accept This Category"}
          </button>
        </div>
      )}

      {/* Manual Selection Tab */}
      {activeTab === "manual" && (
        <div className="space-y-4">
          {/* Breadcrumb */}
          {breadcrumb.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => {
                  setBreadcrumb([]);
                  setAvailableOptions(getRootCategories());
                }}
                className="text-blue-500 hover:underline"
              >
                {t("posting.root") || "Root"}
              </button>
              {breadcrumb.map((node, idx) => (
                <span key={node.id}>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-700 ml-2">{node.name || node.slug}</span>
                </span>
              ))}
            </div>
          )}

          {/* Category Options Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {availableOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSelectNode(option)}
                className={`p-3 rounded border-2 transition text-center ${
                  breadcrumb.some((n) => n.id === option.id)
                    ? "border-green-500 bg-green-50"
                    : "border-gray-300 bg-white hover:border-blue-300"
                }`}
              >
                <p className="font-semibold text-sm">{option.name || option.slug}</p>
                {option.finalNode && (
                  <p className="text-xs text-gray-500 mt-1">✓ Final</p>
                )}
              </button>
            ))}
          </div>

          {/* Back button */}
          {breadcrumb.length > 0 && (
            <button
              onClick={handleGoBack}
              className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
            >
              ← {t("common.back") || "Back"}
            </button>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded font-semibold hover:bg-gray-50 transition"
        >
          {t("common.back") || "Back"}
        </button>
        <button
          onClick={onNext}
          disabled={!canContinue}
          className="flex-1 px-4 py-3 bg-blue-500 text-white rounded font-semibold hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          {t("common.continue") || "Continue to Details"}
        </button>
      </div>
    </div>
  );
}
