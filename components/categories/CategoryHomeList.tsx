import { CategoryRow } from "@/components/categories/CategoryRow";
import type { CategoryNodeWithCount } from "@/lib/categories/getCategories";

type Props = {
  categories: CategoryNodeWithCount[];
};

const FALLBACK_HOME_ROWS = [
  { slug: "vehicles", name: "Vehicles", subtitle: "Cars, motorcycles, and transport listings", icon: "car" },
  { slug: "real-estate", name: "Real Estate", subtitle: "Houses, apartments, land, and commercial property", icon: "home" },
  { slug: "mobile-phones-tablets", name: "Mobile Phones & Tablets", subtitle: "Phones, tablets, watches, and accessories", icon: "phone" },
  { slug: "electronics-computers", name: "Electronics & Computers", subtitle: "Laptops, TVs, cameras, and computer gear", icon: "laptop" },
  { slug: "home-furniture-appliances", name: "Home, Furniture & Appliances", subtitle: "Furniture, appliances, and home items", icon: "sofa" },
  { slug: "clothing-personal-items", name: "Clothing & Personal Items", subtitle: "Clothes, shoes, bags, and personal goods", icon: "shirt" },
  { slug: "jobs", name: "Jobs", subtitle: "Full-time, part-time, and labor jobs", icon: "briefcase" },
  { slug: "services", name: "Services", subtitle: "Repairs, transport, documents, and local help", icon: "wrench" },
  { slug: "business-industry", name: "Business & Industry", subtitle: "Shops, machinery, wholesale, and industrial goods", icon: "factory" },
  { slug: "farm-animals", name: "Farm & Animals", subtitle: "Livestock, feed, tractors, and pets", icon: "tractor" },
  { slug: "education", name: "Education", subtitle: "Books, tutoring, classes, and training", icon: "book-open" },
  { slug: "sports-hobbies", name: "Sports & Hobbies", subtitle: "Sports items, music, games, and leisure goods", icon: "trophy" },
  { slug: "other", name: "Other", subtitle: "Manual posting for anything else", icon: "dots-horizontal" },
] as const;

export function CategoryHomeList({ categories }: Props) {
  const rows = categories.length > 0
    ? categories.map((category) => ({
        id: category.id,
        slug: category.slug,
        name: category.name,
        subtitle: category.subtitle,
        icon: category.icon,
      }))
    : FALLBACK_HOME_ROWS.map((row, index) => ({
        id: -(index + 1),
        slug: row.slug,
        name: row.name,
        subtitle: row.subtitle,
        icon: row.icon,
      }));

  return (
    <section className="overflow-hidden border border-slate-200 bg-white">
      {rows.map((category) => (
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
  );
}
