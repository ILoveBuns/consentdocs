import { hashCanonical } from "./hash.js";
import { fieldNames, type ExtractionEnvelope, type FieldName, type PolicyResult } from "./types.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export function evaluateConsent(
  extraction: ExtractionEnvelope,
  minimumConfidence = 0.85,
): PolicyResult {
  const fields = new Map(extraction.fields.map((field) => [field.name, field]));
  const fieldStatus = Object.fromEntries(
    fieldNames.map((name) => {
      const field = fields.get(name);
      if (!field || field.value === null || field.value.trim() === "") return [name, "missing"];
      if (field.confidence === null || field.confidence < minimumConfidence) return [name, "low_confidence"];
      if (field.citations.length === 0) return [name, "invalid"];
      if (name === "contact_email" && !emailPattern.test(field.value)) return [name, "invalid"];
      if (name === "effective_date" && !isoDatePattern.test(field.value)) return [name, "invalid"];
      return [name, "accepted"];
    }),
  ) as Record<FieldName, "accepted" | "missing" | "low_confidence" | "invalid">;

  const reasons = fieldNames
    .filter((name) => fieldStatus[name] !== "accepted")
    .map((name) => `${name}:${fieldStatus[name]}`);
  const decision: PolicyResult["decision"] = reasons.length === 0 ? "auto_eligible" : "needs_review";
  const stableResult = { decision, fieldStatus, reasons };
  return { ...stableResult, resultHash: hashCanonical(stableResult) };
}
