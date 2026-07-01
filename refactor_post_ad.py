#!/usr/bin/env python3
import re

# Read the file
with open('app/post-ad/post-ad-form.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# First, remove the BrandModelSelector component from Step 2
# This is a large block, so we'll be careful with the regex
old_block = '''            {/* Brand/Model Selector for applicable categories */}
            {(rootSlug === "phones-electronics" || rootSlug === "mobile-phones-tablets" || rootSlug === "vehicles" || (rootSlug === "second-hand-items" && finalNode?.slug === "laptops")) && finalNode ? (
              <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
                <BrandModelSelector
                  category={
                    rootSlug === "vehicles"
                      ? "vehicles"
                      : (rootSlug === "second-hand-items" && finalNode?.slug === "laptops")
                        ? "laptops"
                        : "phones"
                  }
                  subcategory={finalNode?.slug}
                  onModelSelected={handleCatalogModelSelected}
                  selectedModelId={selectedCatalogModel?.id}
                />
              </div>
            ) : null}

            {autoFilledSpecs.length > 0 ? (
              <section className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
                <h3 className="text-sm font-bold">Auto-filled from selected category/model</h3>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {autoFilledSpecs.map((spec) => (
                    <span key={`${spec.key}-${spec.value}`} className="rounded-full border border-[var(--line)] bg-white px-3 py-1 font-semibold text-[var(--ink-1)]">
                      {spec.label}: {spec.value}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}'''

new_block = '''            {/* Auto-filled locked specs displayed as read-only */}
            {autoFilledSpecs.length > 0 ? (
              <section className="mt-4 rounded-xl border border-2 border-blue-300 bg-blue-50 p-3">
                <h3 className="text-sm font-bold text-blue-900 mb-3">✓ Auto-filled Specifications (locked)</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {autoFilledSpecs.map((spec) => (
                    <div key={spec.key} className="rounded-lg bg-white p-3 border border-blue-200">
                      <p className="text-xs font-semibold text-[var(--ink-2)]">{spec.label}</p>
                      <p className="text-sm font-bold text-blue-900 mt-1">{spec.value}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}'''

if old_block in content:
    content = content.replace(old_block, new_block)
    print("✓ Successfully replaced Step 2 BrandModelSelector and updated auto-filled specs display")
else:
    print("✗ Could not find the exact block to replace")
    print("Looking for alternative pattern...")

# Write the file back
with open('app/post-ad/post-ad-form.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("File refactoring complete!")
