import { fieldNames, type Citation, type ExtractedField, type FieldName } from "./types.js";

const aliases: Readonly<Record<string, FieldName>> = {
  "party name": "party_name",
  party_name: "party_name",
  "effective date": "effective_date",
  effective_date: "effective_date",
  "withdrawal method": "withdrawal_method",
  withdrawal_method: "withdrawal_method",
  "contact email": "contact_email",
  contact_email: "contact_email",
};

function object(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeLabel(value: unknown): FieldName | null {
  if (typeof value !== "string") return null;
  return aliases[value.trim().toLowerCase()] ?? null;
}

function normalizeBounds(value: unknown): Citation["bounds"] | null {
  if (!Array.isArray(value) || value.length !== 4) return null;
  const numbers = value.map(finiteNumber);
  return numbers.every((entry): entry is number => entry !== null)
    ? numbers as [number, number, number, number]
    : null;
}

function candidateElements(response: unknown): Record<string, unknown>[] {
  const root = object(response);
  if (!root) return [];
  const pages = Array.isArray(root.pages) ? root.pages : [];
  return pages.flatMap((page) => {
    const pageObject = object(page);
    if (!pageObject) return [];
    const keyValuePairs = Array.isArray(pageObject.keyValuePairs) ? pageObject.keyValuePairs : [];
    const elements = Array.isArray(pageObject.elements) ? pageObject.elements : [];
    return [...keyValuePairs, ...elements].map(object).filter((entry): entry is Record<string, unknown> => entry !== null);
  });
}

export function normalizeDwsFields(response: unknown): ExtractedField[] {
  const candidates = candidateElements(response);
  return fieldNames.map((name) => {
    const matches = candidates
      .map((candidate) => {
        const label = candidate.label ?? candidate.key ?? object(candidate.key)?.text;
        if (normalizeLabel(label) !== name) return null;
        const rawValue = candidate.value ?? object(candidate.value)?.text;
        const confidence = finiteNumber(candidate.confidence)
          ?? finiteNumber(object(candidate.value)?.confidence);
        const page = finiteNumber(candidate.page) ?? finiteNumber(candidate.pageIndex);
        const bounds = normalizeBounds(candidate.bounds ?? candidate.bbox);
        return {
          value: typeof rawValue === "string" ? rawValue.trim() : null,
          confidence,
          citation: page !== null && bounds
            ? { page: page === 0 ? 1 : page, bounds, label: String(label) }
            : null,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
    const best = matches.sort((left, right) => (right.confidence ?? -1) - (left.confidence ?? -1))[0];
    return {
      name,
      value: best?.value ?? null,
      confidence: best?.confidence ?? null,
      citations: best?.citation ? [best.citation] : [],
    };
  });
}
