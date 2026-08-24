"use client";
import { useState } from "react";
import { recordListingEngagementAction } from "@/lib/actions/engagement";
import { recordInventoryContactEventAction, revealListingPhoneAction } from "@/lib/actions/inventory";
import { createShareOutputAction } from "@/lib/actions/liquidity";
import type { AppLocale } from "@/lib/i18n/translations";

const COPY={en:{reveal:"Reveal phone",revealing:"Revealing…",call:"Call",whatsapp:"WhatsApp",share:"Share",copied:"Link copied",message:"Hello, I found your listing on Sahibash. Is it still available?",blocked:"Contact not available",external:"Confirm availability before sending money.",revealed:"Phone revealed"},fa:{reveal:"نمایش شماره",revealing:"در حال نمایش…",call:"تماس",whatsapp:"واتساپ",share:"اشتراک",copied:"پیوند کاپی شد",message:"سلام، اعلان شما را در صاحباش دیدم. آیا هنوز موجود است؟",blocked:"تماس در دسترس نیست",external:"پیش از پرداخت، موجودیت را تأیید کنید.",revealed:"شماره نمایش داده شد"},ps:{reveal:"شمېره ښکاره کړئ",revealing:"ښکاره کېږي…",call:"زنګ",whatsapp:"واټس‌اپ",share:"شریکول",copied:"تړونی کاپي شو",message:"سلام، ستاسو اعلان مې په صاحباش کې ولید. آیا لا شته؟",blocked:"اړیکه نشته",external:"له پیسو ورکولو مخکې شتون تایید کړئ.",revealed:"شمېره ښکاره شوه"}} as const;
export function ListingContactActions({listingId,title,locale,canContact=true,isExternal=false,hasPhone=true}:{listingId:string;title:string;locale:AppLocale;canContact?:boolean;isExternal?:boolean;hasPhone?:boolean}){
 const [phone,setPhone]=useState(""); const [isRevealing,setIsRevealing]=useState(false); const [copied,setCopied]=useState(false); const [error,setError]=useState(""); const t=COPY[locale]; const revealed=Boolean(phone); const digits=phone.replace(/[^\d+]/g,"");
 const track=(event:"phone_reveal"|"call"|"whatsapp"|"share")=>{
  void recordListingEngagementAction(listingId,event,locale);
  const bridgeEvent=event==="call"?"call_click":event==="whatsapp"?"whatsapp_click":event==="phone_reveal"?"phone_reveal":null;
  if(bridgeEvent) void recordInventoryContactEventAction(listingId,bridgeEvent,locale,{source:"listing_detail"});
 };
 const whatsapp=`https://wa.me/${digits.replace(/^\+/,"")}?text=${encodeURIComponent(`${t.message} ${title}`)}`;
 async function reveal(){
  if(revealed || isRevealing) return;
  setError("");
  setIsRevealing(true);
  const result=await revealListingPhoneAction(listingId,locale);
  setIsRevealing(false);
  if(result.ok){
   setPhone(result.phone);
   void recordListingEngagementAction(listingId,"phone_reveal",locale);
   return;
  }
  setError(result.message || t.blocked);
 }
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
 if(!canContact || !hasPhone) return <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 text-sm font-semibold text-[var(--ink-2)]">{t.blocked}</div>;
 return <div className="grid grid-cols-2 gap-2 sm:flex">
  {isExternal?<p className="col-span-2 text-xs font-semibold text-amber-700 sm:w-full">{t.external}</p>:null}
  {error?<p className="col-span-2 text-xs font-semibold text-red-600 sm:w-full">{error}</p>:null}
  <button type="button" onClick={reveal} disabled={isRevealing} className="min-h-12 rounded-xl border border-[var(--line)] bg-white px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60">{revealed?phone:isRevealing?t.revealing:t.reveal}</button>
  {revealed?<a href={`tel:${digits}`} onClick={()=>track("call")} className="flex min-h-12 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white">{t.call}</a>:null}
  {revealed?<a href={whatsapp} target="_blank" rel="noreferrer" onClick={()=>track("whatsapp")} className="flex min-h-12 items-center justify-center rounded-xl bg-[#25D366] px-4 text-sm font-bold text-white">{t.whatsapp}</a>:null}
  <button type="button" onClick={share} className="min-h-12 rounded-xl border border-[var(--line)] bg-white px-4 text-sm font-bold">{copied?t.copied:t.share}</button>
 </div>;
}
