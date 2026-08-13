import test from "node:test"; import assert from "node:assert/strict"; import {scoreMarketplaceListing} from "../lib/ranking/marketplace";
const base={textRelevance:.8,categoryRelevance:1,locationRelevance:.8,freshness:.7,completeness:.9,sellerTrust:.5,engagement:.3,duplicatePenalty:0,spamPenalty:0,promotionBoost:0};
test("promotion boosts are bounded and separated",()=>{const x=scoreMarketplaceListing({...base,promotionBoost:1});assert.equal(x.promotionBoost,.12);assert.ok(x.finalScore>x.organicScore)});
test("irrelevant paid listings receive no boost",()=>{const x=scoreMarketplaceListing({...base,textRelevance:0,categoryRelevance:0,locationRelevance:0,freshness:0,completeness:0,sellerTrust:0,engagement:0,promotionBoost:1});assert.equal(x.promotionBoost,0)});
test("duplicate and spam signals demote results",()=>{const clean=scoreMarketplaceListing(base);const risky=scoreMarketplaceListing({...base,duplicatePenalty:.8,spamPenalty:.5});assert.ok(risky.finalScore<clean.finalScore)});
