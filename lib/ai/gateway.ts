import "server-only";

type GatewaySuggestion = { pathSlugs: string[]; confidence: number; reason: string };

const ENDPOINT = "https://ai-gateway.vercel.sh/v1/chat/completions";

export async function requestGatewayCategorySuggestion(input: {
  title: string;
  description: string;
  allowedPaths: string[];
}): Promise<GatewaySuggestion | null> {
  const token = process.env.AI_GATEWAY_API_KEY ?? process.env.VERCEL_OIDC_TOKEN;
  if (!token || input.allowedPaths.length === 0) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: "openai/gpt-5.6-luna",
        temperature: 0,
        max_tokens: 180,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Choose one existing marketplace leaf path. Return JSON only: {pathSlugs:string[],confidence:number,reason:string}. Never invent a path." },
          { role: "user", content: JSON.stringify({ title: input.title, description: input.description, allowedLeafPaths: input.allowedPaths }) },
        ],
      }),
    });
    if (!response.ok) return null;
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content) as Partial<GatewaySuggestion>;
    const pathSlugs = Array.isArray(parsed.pathSlugs) ? parsed.pathSlugs.map(String) : [];
    const path = pathSlugs.join("/");
    if (!input.allowedPaths.includes(path) || pathSlugs.length === 0) return null;
    const confidence = Math.max(0, Math.min(1, Number(parsed.confidence ?? 0)));
    return { pathSlugs, confidence, reason: String(parsed.reason ?? "") .slice(0, 240) };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
