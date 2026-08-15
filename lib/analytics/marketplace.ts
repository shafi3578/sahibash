import { createSupabaseServerClient } from "@/lib/supabase/server";

export type MarketplaceSnapshot={activeListings:number;meaningfulContacts:number;contactedListings:number;searches:number;zeroResults:number;contactRate:number;approvalMedianHours:number|null;topOpportunities:Array<{term:string;count:number}>};

export async function getMarketplaceSnapshot():Promise<MarketplaceSnapshot>{
 const supabase=await createSupabaseServerClient();
 const since=new Date(Date.now()-7*86400000).toISOString();
 const [active,contacts,searches]=await Promise.all([
  supabase.from("listings").select("id",{count:"exact",head:true}).eq("status","approved"),
  supabase.from("listing_engagement_events").select("listing_id,event_type").gte("created_at",since).in("event_type",["phone_reveal","call","whatsapp","message"]),
  supabase.from("search_telemetry").select("normalized_query,result_count").gte("created_at",since),
 ]);
 const contactRows=contacts.data??[]; const contacted=new Set(contactRows.map(r=>r.listing_id)); const searchRows=searches.data??[];
 const opportunityMap=new Map<string,number>(); for(const r of searchRows) if(r.result_count===0&&r.normalized_query) opportunityMap.set(r.normalized_query,(opportunityMap.get(r.normalized_query)??0)+1);
 return {activeListings:active.count??0,meaningfulContacts:contactRows.length,contactedListings:contacted.size,searches:searchRows.length,zeroResults:searchRows.filter(r=>r.result_count===0).length,contactRate:(active.count??0)>0?contacted.size/(active.count??1):0,approvalMedianHours:null,topOpportunities:[...opportunityMap].sort((a,b)=>b[1]-a[1]).slice(0,10).map(([term,count])=>({term,count}))};
}
