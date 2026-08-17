import { describe, expect, it } from "vitest";
import { evaluateConsent } from "../src/policy.js";
import type { ExtractionEnvelope, FieldName } from "../src/types.js";

const citation = { page: 1, bounds: [1, 2, 3, 4] as const, label: "field" };
const values: Record<FieldName, string> = {
  party_name: "Example Cooperative",
  effective_date: "2026-08-17",
  withdrawal_method: "withdraw@example.test",
  contact_email: "privacy@example.test",
};

function extraction(overrides: Partial<Record<FieldName, { value: string | null; confidence: number | null }>> = {}): ExtractionEnvelope {
  return {
    inputSha256: "a".repeat(64),
    provider: "fixture",
    providerRequestId: null,
    fields: (Object.keys(values) as FieldName[]).map((name) => {
      const override = overrides[name];
      return {
        name,
        value: override ? override.value : values[name],
        confidence: override ? override.confidence : 0.99,
        citations: [citation],
      };
    }),
  };
}

describe("evaluateConsent", () => {
  it("allows a complete source-grounded consent record", () => {
    expect(evaluateConsent(extraction()).decision).toBe("auto_eligible");
  });

  it("fails closed when withdrawal method is missing", () => {
    const result = evaluateConsent(extraction({ withdrawal_method: { value: null, confidence: null } }));
    expect(result.decision).toBe("needs_review");
    expect(result.reasons).toContain("withdrawal_method:missing");
  });

  it("fails closed below the confidence threshold", () => {
    const result = evaluateConsent(extraction({ party_name: { value: values.party_name, confidence: 0.84 } }));
    expect(result.reasons).toContain("party_name:low_confidence");
  });

  it("rejects invalid email formatting", () => {
    const result = evaluateConsent(extraction({ contact_email: { value: "not-email", confidence: 0.99 } }));
    expect(result.reasons).toContain("contact_email:invalid");
  });

  it("is deterministic across provider request identifiers", () => {
    const first = extraction();
    const second = { ...first, providerRequestId: "different" };
    expect(evaluateConsent(first).resultHash).toBe(evaluateConsent(second).resultHash);
  });
});
