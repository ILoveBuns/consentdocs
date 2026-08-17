import { readFile } from "node:fs/promises";
import { basename } from "node:path";

export interface NutrientBuildResponse {
  status: number;
  requestId: string | null;
  body: unknown;
}

const consentSchema = {
  type: "object",
  properties: {
    party_name: { type: "string", description: "Full legal or organizational name of the party granting consent" },
    signature_party_name: { type: "string", description: "Name of the party shown in the signature or execution section" },
    effective_date: { type: "string", description: "Effective date in YYYY-MM-DD format" },
    withdrawal_method: { type: "string", description: "Explicit method the party can use to withdraw consent" },
    contact_email: { type: "string", description: "Email address for consent or privacy questions" },
  },
} as const;

export function requireApiKey(environment: NodeJS.ProcessEnv = process.env): string {
  const key = environment.NUTRIENT_API_KEY;
  if (!key || key.trim() === "") throw new Error("NUTRIENT_API_KEY is required");
  return key;
}

export async function extractKeyValuePairs(
  filePath: string,
  options: { apiKey?: string; fetchImpl?: typeof fetch } = {},
): Promise<NutrientBuildResponse> {
  const apiKey = options.apiKey ?? requireApiKey();
  const fetchImpl = options.fetchImpl ?? fetch;
  const bytes = await readFile(filePath);
  const form = new FormData();
  form.append("document", new Blob([bytes], { type: "application/pdf" }), basename(filePath));
  form.append(
    "instructions",
    JSON.stringify({
      parts: [{ file: "document" }],
      output: {
        type: "json-content",
        plainText: false,
        structuredText: false,
        keyValuePairs: true,
        tables: false,
        language: "english",
      },
    }),
  );
  const response = await fetchImpl("https://api.nutrient.io/build", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  const text = await response.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = { error: "non_json_response", length: text.length };
  }
  if (!response.ok) throw new Error(`Nutrient DWS request failed with HTTP ${response.status}`);
  return {
    status: response.status,
    requestId: response.headers.get("x-request-id"),
    body,
  };
}

export async function extractConsentFields(
  filePath: string,
  options: { apiKey?: string; fetchImpl?: typeof fetch } = {},
): Promise<NutrientBuildResponse> {
  const apiKey = options.apiKey ?? requireApiKey();
  const fetchImpl = options.fetchImpl ?? fetch;
  const bytes = await readFile(filePath);
  const form = new FormData();
  form.append("file", new Blob([bytes], { type: "application/pdf" }), basename(filePath));
  form.append("instructions", JSON.stringify({
    schema: consentSchema,
    parseConfig: { mode: "understand" },
    options: { includeCitations: true },
    instructions: "Extract only values explicitly present in the document. Keep the agreement party and signature party separate. Never infer or invent missing consent terms.",
  }));
  const response = await fetchImpl("https://api.nutrient.io/extraction/extract", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  const text = await response.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = { error: "non_json_response", length: text.length };
  }
  if (!response.ok) {
    throw new Error(`Nutrient Data Extraction request failed with HTTP ${response.status}: ${providerErrorSummary(body)}`);
  }
  return {
    status: response.status,
    requestId: response.headers.get("x-request-id") ?? objectRequestId(body),
    body,
  };
}

function providerErrorSummary(body: unknown): string {
  const allowed = new Set(["error", "errors", "code", "message", "details", "errorDetails", "errorMessage", "path", "field", "status", "reason", "validation"]);
  function sanitize(value: unknown, depth: number): unknown {
    if (depth > 4) return undefined;
    if (typeof value === "string") return value.slice(0, 300);
    if (typeof value === "number" || typeof value === "boolean" || value === null) return value;
    if (Array.isArray(value)) return value.slice(0, 10).map((entry) => sanitize(entry, depth + 1));
    if (typeof value !== "object") return undefined;
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([key]) => allowed.has(key))
      .map(([key, entry]) => [key, sanitize(entry, depth + 1)]));
  }
  const keys = typeof body === "object" && body !== null && !Array.isArray(body)
    ? Object.keys(body as Record<string, unknown>)
    : [];
  return JSON.stringify({ keys, summary: sanitize(body, 0) }).slice(0, 1500);
}

function objectRequestId(body: unknown): string | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return null;
  const value = (body as Record<string, unknown>).requestId;
  return typeof value === "string" ? value : null;
}
