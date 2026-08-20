import { normalizeSourceType, sourceRankingWeight } from "@/lib/inventory/provenance";

export type RankingSignals={textRelevance:number;categoryRelevance:number;locationRelevance:number;freshness:number;completeness:number;sellerTrust:number;engagement:number;duplicatePenalty:number;spamPenalty:number;promotionBoost:number;sourceType?:string|null;ownershipStatus?:string|null;provenanceConfidence?:number|null};
const clamp=(n:number,min=0,max=1)=>Math.min(max,Math.max(min,Number.isFinite(n)?n:0));
export function scoreMarketplaceListing(s:RankingSignals){
 const provenance=sourceRankingWeight(normalizeSourceType(s.sourceType),s.ownershipStatus)*clamp(s.provenanceConfidence??1);
 const organic=clamp(s.textRelevance)*0.29+clamp(s.categoryRelevance)*0.15+clamp(s.locationRelevance)*0.14+clamp(s.freshness)*0.13+clamp(s.completeness)*0.11+clamp(s.sellerTrust)*0.07+clamp(s.engagement)*0.04+provenance*0.07;
 const penalties=clamp(s.duplicatePenalty)*0.35+clamp(s.spamPenalty)*0.5;
 const boundedPromotion=organic>=0.25?clamp(s.promotionBoost,0,0.12):0;
 return {organicScore:organic,provenanceScore:provenance,penalty:penalties,promotionBoost:boundedPromotion,finalScore:Math.max(0,organic-penalties+boundedPromotion)};
}
