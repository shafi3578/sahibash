"use client";
import { useState } from "react";
import { recordListingEngagementAction } from "@/lib/actions/engagement";
import { recordInventoryContactEventAction } from "@/lib/actions/inventory";
import { createShareOutputAction } from "@/lib/actions/liquidity";
import type { AppLocale } from "@/lib/i18n/translations";

const COPY={en:{reveal:"Reveal phone",call:"Call",whatsapp:"WhatsApp",share:"Share",copied:"Link copied",message:"Hello, I found your listing on Sahibash. Is it still available?",blocked:"Contact not available",external:"Confirm availability before sending money."},fa:{reveal:"نمایش شماره",call:"تماس",whatsapp:"واتساپ",share:"اشتراک",copied:"پیوند کاپی شد",message:"سلام، اعلان شما را در صاحباش دیدم. آیا هنوز موجود است؟",blocked:"تماس در دسترس نیست",external:"پیش از پرداخت، موجودیت را تأیید کنید."},ps:{reveal:"شمېره ښکاره کړئ",call:"زنګ",whatsapp:"واټس‌اپ",share:"شریکول",copied:"تړونی کاپي شو",message:"سلام، ستاسو اعلان مې په صاحباش کې ولید. آیا لا شته؟",blocked:"اړیکه نشته",external:"له پیسو ورکولو مخکې شتون تایید کړئ."}} as const;
export function ListingContactActions({listingId,title,phone,locale,canContact=true,isExternal=false}:{listingId:string;title:string;phone:string;locale:AppLocale;canContact?:boolean;isExternal?:boolean}){
 const [revealed,setRevealed]=useState(false); const [copied,setCopied]=useState(false); const t=COPY[locale]; const digits=phone.replace(/[^\d+]/g,"");
 const track=(event:"phone_reveal"|"call"|"whatsapp"|"share")=>{
  void recordListingEngagementAction(listingId,event,locale);
  const bridgeEvent=event==="call"?"call_click":event==="whatsapp"?"whatsapp_click":event==="phone_reveal"?"phone_reveal":null;
  if(bridgeEvent) void recordInventoryContactEventAction(listingId,bridgeEvent,locale,{source:"listing_detail"});
 };
 const whatsapp=`https://wa.me/${digits.replace(/^\+/,"")}?text=${encodeURIComponent(`${t.message} ${title}`)}`;
 async function share(){
  try {
   const output = await createShareOutputAction(listingId, "generic", locale);
   const hasOutput = output.ok && "shareUrl" in output && "shareText" in output;
   const url = hasOutput ? output.shareUrl : location.href;
   const text = hasOutput ? output.shareText : `${title}\n${location.href}`;
   if(navigator.share) await navigator.share({title,text,url});
   else {await navigator.clipboard.writeText(text);setCopied(true);}
   track("share");
  } catch {
   // Closing the native share sheet is an expected user action.
  }
 }
 if(!canContact) return <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 text-sm font-semibold text-[var(--ink-2)]">{t.blocked}</div>;
 return <div className="grid grid-cols-2 gap-2 sm:flex">
  {isExternal?<p className="col-span-2 text-xs font-semibold text-amber-700 sm:w-full">{t.external}</p>:null}
  <button type="button" onClick={()=>{setRevealed(true);track("phone_reveal")}} className="min-h-12 rounded-xl border border-[var(--line)] bg-white px-4 text-sm font-bold">{revealed?phone:t.reveal}</button>
  <a href={`tel:${digits}`} onClick={()=>track("call")} className="flex min-h-12 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white">{t.call}</a>
  <a href={whatsapp} target="_blank" rel="noreferrer" onClick={()=>track("whatsapp")} className="flex min-h-12 items-center justify-center rounded-xl bg-[#25D366] px-4 text-sm font-bold text-white">{t.whatsapp}</a>
  <button type="button" onClick={share} className="min-h-12 rounded-xl border border-[var(--line)] bg-white px-4 text-sm font-bold">{copied?t.copied:t.share}</button>
 </div>;
}
