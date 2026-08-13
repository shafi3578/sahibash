"use client";
import { useState } from "react";
import { recordListingEngagementAction } from "@/lib/actions/engagement";
import type { AppLocale } from "@/lib/i18n/translations";

const COPY={en:{reveal:"Reveal phone",call:"Call",whatsapp:"WhatsApp",share:"Share",copied:"Link copied",message:"Hello, I found your listing on Sahibash. Is it still available?"},fa:{reveal:"نمایش شماره",call:"تماس",whatsapp:"واتساپ",share:"اشتراک",copied:"پیوند کاپی شد",message:"سلام، اعلان شما را در صاحباش دیدم. آیا هنوز موجود است؟"},ps:{reveal:"شمېره ښکاره کړئ",call:"زنګ",whatsapp:"واټس‌اپ",share:"شریکول",copied:"تړونی کاپي شو",message:"سلام، ستاسو اعلان مې په صاحباش کې ولید. آیا لا شته؟"}} as const;
export function ListingContactActions({listingId,title,phone,locale}:{listingId:string;title:string;phone:string;locale:AppLocale}){
 const [revealed,setRevealed]=useState(false); const [copied,setCopied]=useState(false); const t=COPY[locale]; const digits=phone.replace(/[^\d+]/g,"");
 const track=(event:"phone_reveal"|"call"|"whatsapp"|"share")=>void recordListingEngagementAction(listingId,event,locale);
 const whatsapp=`https://wa.me/${digits.replace(/^\+/,"")}?text=${encodeURIComponent(`${t.message} ${title}`)}`;
 async function share(){
  try {
   if(navigator.share) await navigator.share({title,url:location.href});
   else {await navigator.clipboard.writeText(location.href);setCopied(true);}
   track("share");
  } catch {
   // Closing the native share sheet is an expected user action.
  }
 }
 return <div className="grid grid-cols-2 gap-2 sm:flex">
  <button type="button" onClick={()=>{setRevealed(true);track("phone_reveal")}} className="min-h-12 rounded-xl border border-[var(--line)] bg-white px-4 text-sm font-bold">{revealed?phone:t.reveal}</button>
  <a href={`tel:${digits}`} onClick={()=>track("call")} className="flex min-h-12 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white">{t.call}</a>
  <a href={whatsapp} target="_blank" rel="noreferrer" onClick={()=>track("whatsapp")} className="flex min-h-12 items-center justify-center rounded-xl bg-[#25D366] px-4 text-sm font-bold text-white">{t.whatsapp}</a>
  <button type="button" onClick={share} className="min-h-12 rounded-xl border border-[var(--line)] bg-white px-4 text-sm font-bold">{copied?t.copied:t.share}</button>
 </div>;
}
