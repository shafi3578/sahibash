import "server-only";

import { requestSearchGateway, type AiSearchGatewayInput, type AiSearchGatewayResult } from "@/lib/ai/search-gateway-request";

export type { AiSearchGatewayStatus, AiSearchGatewayResult } from "@/lib/ai/search-gateway-request";

export async function requestGatewaySearchIntent(input: AiSearchGatewayInput): Promise<AiSearchGatewayResult> {
  return requestSearchGateway(input, {
    token: process.env.AI_GATEWAY_API_KEY ?? process.env.VERCEL_OIDC_TOKEN,
    environment: process.env.VERCEL_ENV,
    fetch,
  });
}

export async function verifyGatewayAiSearch(): Promise<AiSearchGatewayResult> {
  return requestGatewaySearchIntent({ query: "Toyota Corolla 2015 or newer in Kabul under 500000 AFN", locale: "en" });
}
