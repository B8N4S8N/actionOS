/**
 * Minimal JSON-in / JSON-out LLM client.
 *
 * Supports an OpenAI-compatible endpoint or Gemini, chosen by whichever API key
 * is configured. There is no SDK dependency: two fetch calls are easier to
 * audit than a provider SDK, and ActionOS only ever asks a model for structured
 * suggestions a human then approves.
 *
 * Every failure mode (no key, HTTP error, timeout, non-JSON response) surfaces
 * as `LlmUnavailableError` so callers can fall back to deterministic logic.
 */
import { getLlmProvider } from "@/lib/env";

const REQUEST_TIMEOUT_MS = 15_000;

export class LlmUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmUnavailableError";
  }
}

export function isLlmConfigured(): boolean {
  return getLlmProvider() !== null;
}

export interface JsonModelRequest {
  system: string;
  user: string;
  /** Lower is more literal; classification wants determinism. */
  temperature?: number;
}

export interface JsonModelResult {
  data: unknown;
  model: string;
}

async function postJson(
  url: string,
  body: unknown,
  headers: Record<string, string>,
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new LlmUnavailableError(
        `Provider returned ${response.status} ${response.statusText}`,
      );
    }

    return (await response.json()) as unknown;
  } catch (error) {
    if (error instanceof LlmUnavailableError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new LlmUnavailableError("Provider timed out");
    }
    throw new LlmUnavailableError(
      error instanceof Error ? error.message : "Provider request failed",
    );
  } finally {
    clearTimeout(timeout);
  }
}

/** Models sometimes wrap JSON in prose or a code fence; take the object. */
export function extractJsonObject(raw: string): unknown {
  const unfenced = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "");
  const start = unfenced.indexOf("{");
  const end = unfenced.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new LlmUnavailableError("Provider response was not JSON");
  }

  try {
    return JSON.parse(unfenced.slice(start, end + 1)) as unknown;
  } catch {
    throw new LlmUnavailableError("Provider response was not valid JSON");
  }
}

async function requestOpenAi({
  system,
  user,
  temperature = 0.1,
}: JsonModelRequest): Promise<JsonModelResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new LlmUnavailableError("OPENAI_API_KEY is not set");

  const baseUrl = (
    process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1"
  ).replace(/\/$/, "");
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const payload = await postJson(
    `${baseUrl}/chat/completions`,
    {
      model,
      temperature,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    },
    { authorization: `Bearer ${apiKey}` },
  );

  const content = (payload as { choices?: { message?: { content?: string } }[] })
    .choices?.[0]?.message?.content;

  if (!content) throw new LlmUnavailableError("Provider returned no content");

  return { data: extractJsonObject(content), model };
}

async function requestGemini({
  system,
  user,
  temperature = 0.1,
}: JsonModelRequest): Promise<JsonModelResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new LlmUnavailableError("GEMINI_API_KEY is not set");

  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

  const payload = await postJson(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { temperature, responseMimeType: "application/json" },
    },
    { "x-goog-api-key": apiKey },
  );

  const content = (
    payload as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
  ).candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) throw new LlmUnavailableError("Provider returned no content");

  return { data: extractJsonObject(content), model };
}

export async function requestJson(
  request: JsonModelRequest,
): Promise<JsonModelResult> {
  const provider = getLlmProvider();
  if (!provider) throw new LlmUnavailableError("No LLM API key configured");

  return provider === "openai"
    ? requestOpenAi(request)
    : requestGemini(request);
}
