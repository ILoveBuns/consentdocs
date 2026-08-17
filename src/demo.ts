import { appendAudit, verifyAuditChain } from "./audit.js";
import { evaluateConsent } from "./policy.js";
import type { ExtractionEnvelope } from "./types.js";

const citation = { page: 1, bounds: [50, 50, 300, 80] as const, label: "synthetic fixture" };
const extraction: ExtractionEnvelope = {
  inputSha256: "0".repeat(64),
  provider: "fixture",
  providerRequestId: null,
  fields: [
    { name: "party_name", value: "Example Research Cooperative", confidence: 0.99, citations: [citation] },
    { name: "effective_date", value: "2026-08-17", confidence: 0.99, citations: [citation] },
    { name: "withdrawal_method", value: "withdraw@example.test", confidence: 0.98, citations: [citation] },
    { name: "contact_email", value: "compliance@example.test", confidence: 0.99, citations: [citation] },
  ],
};
const result = evaluateConsent(extraction);
const event = appendAudit(null, {
  inputSha256: extraction.inputSha256,
  schemaVersion: "consent-v1",
  policyVersion: "consent-policy-v1",
  decision: result.decision,
  fieldStatus: result.fieldStatus,
  humanDecision: "pending",
  humanRationale: null,
});
console.log(JSON.stringify({ result, event, chainValid: verifyAuditChain([event]) }, null, 2));
