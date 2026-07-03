'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { getRootCategories, getCategoryPath, CATEGORY_TREE } from '@/lib/posting/categoryTree';
import { useTranslation } from '@/lib/i18n/client';
import type { AppLocale } from '@/lib/i18n/translations';

interface Step2CategorySelectionProps {
  onContinue: (product: string, categoryPath: string[]) => void;
  onBack: () => void;
}

export const Step2CategorySelection = ({
  onContinue,
  onBack,
}: Step2CategorySelectionProps) => {
  const params = useParams();
  const locale = (params.locale as AppLocale) || 'en';
  const { t } = useTranslation(locale);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [browsePath, setBrowsePath] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');

  const rootCategories = getRootCategories();

  // Get categories at current browsing level
  const currentLevelCategories = browsePath.length === 0
    ? rootCategories
    : Object.values(CATEGORY_TREE).filter((cat) => 
        cat.parentId === browsePath[browsePath.length - 1]
      );

  // Filter categories by search
  const searchResults = searchQuery.trim()
    ? Object.values(CATEGORY_TREE).filter((cat) =>
        cat.labelKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleContinue = () => {
    if (!selectedProduct) {
      alert('Please select a product');
      return;
    }
    onContinue(selectedProduct, browsePath);
  };

  const handleSelectCategory = (categoryId: string) => {
    const category = CATEGORY_TREE[categoryId];
    if (!category) return;

    // If it's a final node, select it as product
    if (category.finalNode) {
      setSelectedProduct(categoryId);
    } else {
      // Otherwise navigate deeper
      setBrowsePath((prev) => [...prev, categoryId]);
    }
  };

  const handleBack = () => {
    if (browsePath.length > 0) {
      setBrowsePath((prev) => prev.slice(0, -1));
    }
  };

  // Get breadcrumb labels
  const breadcrumbLabels = browsePath.map((id) => t(CATEGORY_TREE[id]?.labelKey || id, CATEGORY_TREE[id]?.labelKey || id));

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Select Category</h2>
        <p className="text-gray-600 text-sm">Step 2 of 4: Choose the item category</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search category (e.g., Couch, jacket, guitar)"
          className="w-full p-3 border border-gray-300 rounded-lg text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          Examples: Couch, jacket, guitar, phone, car
        </p>
      </div>

      {/* Breadcrumb Navigation */}
      {browsePath.length > 0 && (
        <div className="mb-4 flex items-center gap-2 text-sm">
          <button
            onClick={() => setBrowsePath([])}
            className="text-blue-600 hover:underline"
          >
            All Categories
          </button>
          {breadcrumbLabels.map((label, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-gray-400">›</span>
              <span className="text-gray-700">{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
        {(searchQuery ? searchResults : currentLevelCategories).map((category) => (
          <button
            key={category.id}
            onClick={() => handleSelectCategory(category.id)}
            className={`p-3 rounded-lg border-2 transition text-center text-sm ${
              selectedProduct === category.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="font-medium truncate">{t(category.labelKey, category.labelKey)}</div>
            {!category.finalNode && (
              <div className="text-xs text-gray-500 mt-1">
                {Object.values(CATEGORY_TREE).filter((c) => c.parentId === category.id).length} items
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Selected Product Info */}
      {selectedProduct && (
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-900">
            ✓ Product Selected: {t(CATEGORY_TREE[selectedProduct]?.labelKey || selectedProduct, CATEGORY_TREE[selectedProduct]?.labelKey || selectedProduct)}
          </p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3">
        {browsePath.length > 0 ? (
          <>
            <button
              onClick={handleBack}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Back
            </button>
            <button
              onClick={onBack}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Back to Details
            </button>
          </>
        ) : (
          <button
            onClick={onBack}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Back
          </button>
        )}
        <button
          onClick={handleContinue}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          disabled={!selectedProduct}
        >
          Continue
        </button>
      </div>
    </div>
  );
};
