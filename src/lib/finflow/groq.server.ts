// Shared Groq API caller (server-only)

export const GROQ_MODEL = "llama-3.3-70b-versatile";
export const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export type GroqMessage = { role: "system" | "user" | "assistant"; content: string };

export async function callGroq(
  messages: GroqMessage[],
  opts: { json?: boolean; model?: string; temperature?: number } = {},
): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY not configured");

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: opts.model ?? GROQ_MODEL,
      messages,
      temperature: opts.temperature ?? 0.7,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (res.status === 429) throw new Error("Groq rate limit — please try again shortly.");
  if (res.status === 401) throw new Error("Invalid Groq API key.");
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Groq request failed (${res.status}) ${t.slice(0, 200)}`);
  }

  const j = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  return j.choices[0]?.message?.content ?? "";
}
