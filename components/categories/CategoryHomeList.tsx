import { CategoryRow } from "@/components/categories/CategoryRow";
import type { CategoryNodeWithCount } from "@/lib/categories/getCategories";

type Props = {
  categories: CategoryNodeWithCount[];
};

const FALLBACK_HOME_ROWS = [
  { slug: "vehicles", name: "Vehicles", subtitle: "Cars, motorcycles, and transport listings", icon: "car", is_coming_soon: false },
  { slug: "real-estate", name: "Real Estate", subtitle: "Houses, apartments, land, and commercial property", icon: "home", is_coming_soon: false },
  { slug: "mobile-phones-tablets", name: "Phones & Electronics", subtitle: "Phones, tablets, and electronics deals", icon: "phone", is_coming_soon: false },
  { slug: "second-hand-items", name: "Second Hand", subtitle: "Used furniture, tools, home items, and more", icon: "box", is_coming_soon: false },
  { slug: "electronics-computers", name: "Electronics & Computers", subtitle: "Laptops, TVs, cameras, and computer gear", icon: "laptop", is_coming_soon: true },
  { slug: "home-furniture-appliances", name: "Home, Furniture & Appliances", subtitle: "Furniture, appliances, and home items", icon: "sofa", is_coming_soon: true },
  { slug: "clothing-personal-items", name: "Clothing & Personal Items", subtitle: "Clothes, shoes, bags, and personal goods", icon: "shirt", is_coming_soon: true },
  { slug: "jobs", name: "Jobs", subtitle: "Full-time, part-time, and labor jobs", icon: "briefcase", is_coming_soon: true },
  { slug: "services", name: "Services", subtitle: "Repairs, transport, documents, and local help", icon: "wrench", is_coming_soon: true },
  { slug: "business-industry", name: "Business & Industry", subtitle: "Shops, machinery, wholesale, and industrial goods", icon: "factory", is_coming_soon: true },
  { slug: "farm-animals", name: "Farm & Animals", subtitle: "Livestock, feed, tractors, and pets", icon: "tractor", is_coming_soon: true },
  { slug: "education", name: "Education", subtitle: "Books, tutoring, classes, and training", icon: "book-open", is_coming_soon: true },
  { slug: "sports-hobbies", name: "Sports & Hobbies", subtitle: "Sports items, music, games, and leisure goods", icon: "trophy", is_coming_soon: true },
  { slug: "other", name: "Other", subtitle: "Manual posting for anything else", icon: "dots-horizontal", is_coming_soon: true },
] as const;

export function CategoryHomeList({ categories }: Props) {
  const rows = categories.length > 0
    ? categories.map((category) => ({
        id: category.id,
        slug: category.slug,
        name: category.slug === "mobile-phones-tablets" ? "Phones & Electronics" : category.name,
        subtitle: category.subtitle,
        icon: category.icon,
        is_coming_soon: Boolean(category.is_coming_soon),
      }))
    : FALLBACK_HOME_ROWS.map((row, index) => ({
        id: -(index + 1),
        slug: row.slug,
        name: row.name,
        subtitle: row.subtitle,
        icon: row.icon,
        is_coming_soon: row.is_coming_soon,
      }));

  const launchRows = rows.filter((row) => !row.is_coming_soon);
  const comingSoonRows = rows.filter((row) => row.is_coming_soon);

  return (
    <div className="space-y-3">
      <section className="overflow-hidden border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Featured Categories
        </div>
        {launchRows.map((category) => (
          <CategoryRow
            key={category.id}
            href={category.id > 0 ? `/categories/${category.slug}?node=${category.id}` : `/categories/${category.slug}`}
            title={category.name}
            subtitle={category.subtitle}
            icon={category.icon}
            showCount={false}
            showIcon
          />
        ))}
      </section>

      {comingSoonRows.length > 0 ? (
        <section className="overflow-hidden border border-slate-200 bg-white">
          <div className="border-b border-slate-200 bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
            More Categories (Coming Soon)
          </div>
          {comingSoonRows.map((category) => (
            <CategoryRow
              key={category.id}
              href={`/categories/${category.slug}`}
              title={category.name}
              subtitle={category.subtitle}
              icon={category.icon}
              showCount={false}
              showIcon
              comingSoon
            />
          ))}
        </section>
      ) : null}
    </div>
  );
}
