import { readFile } from "node:fs/promises";
import { basename } from "node:path";

export interface NutrientBuildResponse {
  status: number;
  requestId: string | null;
  body: unknown;
}

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
