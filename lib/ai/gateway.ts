import "server-only";

export type GatewaySuggestion = { pathSlugs: string[]; confidence: number; reason: string };
export type GatewaySuggestionResult = {
  suggestions: GatewaySuggestion[];
  status: "gateway" | "missing_token" | "missing_taxonomy" | "timeout" | `http_${number}` | "invalid_response";
};

const ENDPOINT = "https://ai-gateway.vercel.sh/v1/chat/completions";

export async function requestGatewayCategorySuggestion(input: {
  title: string;
  description: string;
  allowedPaths: string[];
}): Promise<GatewaySuggestionResult> {
  const token = process.env.AI_GATEWAY_API_KEY ?? process.env.VERCEL_OIDC_TOKEN;
  if (!token) return { suggestions: [], status: "missing_token" };
  if (input.allowedPaths.length === 0) return { suggestions: [], status: "missing_taxonomy" };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        temperature: 0,
        max_tokens: 260,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Choose 2 or 3 plausible existing marketplace leaf paths, best first. Return JSON only: {suggestions:[{pathSlugs:string[],confidence:number,reason:string}]}. Every path must be copied exactly from allowedLeafPaths. Never invent, shorten, or return a parent path. Return fewer only when no second plausible leaf exists." },
          { role: "user", content: JSON.stringify({ title: input.title, description: input.description, allowedLeafPaths: input.allowedPaths }) },
        ],
      }),
    });
    if (!response.ok) return { suggestions: [], status: `http_${response.status}` };
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return { suggestions: [], status: "invalid_response" };
    const parsed = JSON.parse(content) as { suggestions?: Array<Partial<GatewaySuggestion>> };
    const seen = new Set<string>();
    const suggestions = (Array.isArray(parsed.suggestions) ? parsed.suggestions : [])
      .map((suggestion) => {
        const pathSlugs = Array.isArray(suggestion.pathSlugs) ? suggestion.pathSlugs.map(String) : [];
        const path = pathSlugs.join("/");
        if (!pathSlugs.length || !input.allowedPaths.includes(path) || seen.has(path)) return null;
        seen.add(path);
        return {
          pathSlugs,
          confidence: Math.max(0, Math.min(1, Number(suggestion.confidence ?? 0))),
          reason: String(suggestion.reason ?? "").slice(0, 240),
        } satisfies GatewaySuggestion;
      })
      .filter((suggestion): suggestion is GatewaySuggestion => Boolean(suggestion))
      .slice(0, 3);
    return { suggestions, status: suggestions.length > 0 ? "gateway" : "invalid_response" };
  } catch (error) {
    return { suggestions: [], status: error instanceof DOMException && error.name === "AbortError" ? "timeout" : "invalid_response" };
  } finally {
    clearTimeout(timeout);
  }
}
