import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCurrentLocale } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { followUserAction, unfollowUserAction } from "@/lib/actions/social";
import { BlockUserButton } from "@/components/social/block-user-button";

export default async function PublicSellerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const locale = await getCurrentLocale();
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdmin();
  const currentUser = await getCurrentUser();
  const [{ data: listings }, followerResult, followingResult] = await Promise.all([
    admin.from("listings").select("id,title,price,currency,province,district,contact_name,created_at,listing_images(public_url,is_primary,sort_order)").eq("user_id", id).eq("status", "approved").order("created_at", { ascending: false }).limit(48),
    supabase.from("user_follows").select("follower_user_id", { count: "exact", head: true }).eq("following_user_id", id),
    supabase.from("user_follows").select("following_user_id", { count: "exact", head: true }).eq("follower_user_id", id),
  ]);
  if (!listings || listings.length === 0) notFound();
  const isSelf = currentUser?.id === id;
  const [{ data: existingFollow }, { data: existingBlock }] = currentUser && !isSelf
    ? await Promise.all([
        supabase.from("user_follows").select("following_user_id").eq("follower_user_id", currentUser.id).eq("following_user_id", id).maybeSingle(),
        supabase.from("user_blocks").select("blocked_user_id").eq("blocker_user_id", currentUser.id).eq("blocked_user_id", id).maybeSingle(),
      ])
    : [{ data: null }, { data: null }];
  const text = locale === "fa"
    ? { listings: "اعلان‌های فعال", followers: "دنبال‌کنندگان", following: "دنبال‌شده", follow: "دنبال کردن", unfollow: "لغو دنبال کردن", seller: "فروشندهٔ صاحبش", activeSince: "اعلان فعال از", empty: "اعلان فعالی وجود ندارد" }
    : locale === "ps"
      ? { listings: "فعال اعلانونه", followers: "تعقیبوونکي", following: "تعقیبوي", follow: "تعقیب کړئ", unfollow: "تعقیب بند کړئ", seller: "د صاحبش پلورونکی", activeSince: "فعال اعلان له", empty: "فعال اعلان نشته" }
      : { listings: "Active listings", followers: "Followers", following: "Following", follow: "Follow", unfollow: "Unfollow", seller: "Sahibash seller", activeSince: "Active listing since", empty: "No active listings" };
  const sellerName = listings.find((listing) => listing.contact_name?.trim())?.contact_name?.trim() || text.seller;
  const oldestVisibleListing = listings[listings.length - 1];

  return <main className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6">
    <section className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="font-display text-2xl font-black text-[var(--ink-1)]">{sellerName}</h1><p className="mt-1 text-sm text-[var(--ink-2)]">{text.activeSince}: {new Date(oldestVisibleListing.created_at).toLocaleDateString(locale === "en" ? "en-US" : `${locale}-AF`)}</p></div>
        {!isSelf && currentUser ? <div className="flex gap-2"><form action={async()=>{"use server"; if(existingFollow) await unfollowUserAction(id); else await followUserAction(id);}}><button disabled={Boolean(existingBlock)} className="rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{existingFollow ? text.unfollow : text.follow}</button></form><BlockUserButton userId={id} locale={locale} initiallyBlocked={Boolean(existingBlock)} /></div> : null}
      </div>
      <div className="mt-4 flex gap-4 text-sm"><span><strong>{followerResult.count ?? 0}</strong> {text.followers}</span><span><strong>{followingResult.count ?? 0}</strong> {text.following}</span></div>
    </section>
    <section><h2 className="mb-3 font-display text-xl font-black">{text.listings}</h2>{(listings ?? []).length === 0 ? <p className="rounded-2xl border border-dashed border-[var(--line)] p-5 text-[var(--ink-2)]">{text.empty}</p> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{(listings ?? []).map((listing) => { const images=[...(listing.listing_images ?? [])].sort((a,b)=>Number(Boolean(b.is_primary))-Number(Boolean(a.is_primary))||Number(a.sort_order??0)-Number(b.sort_order??0)); const image=images[0]?.public_url; return <Link key={listing.id} href={localizePath(`/listings/${listing.id}`,locale)} className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-sm"><div className="relative aspect-video bg-[var(--surface-2)]">{image?<Image src={image} alt={listing.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw"/>:null}</div><div className="p-3"><h3 className="line-clamp-2 font-bold">{listing.title}</h3><p className="mt-1 text-sm font-bold text-[var(--accent)]">{Number(listing.price).toLocaleString()} {listing.currency}</p><p className="mt-1 text-xs text-[var(--ink-2)]">{[listing.province,listing.district].filter(Boolean).join(" · ")}</p></div></Link>; })}</div>}</section>
  </main>;
}
