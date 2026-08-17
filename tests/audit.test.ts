import { describe, expect, it } from "vitest";
import { appendAudit, verifyAuditChain, type AuditPayload } from "../src/audit.js";

const payload: AuditPayload = {
  inputSha256: "b".repeat(64),
  schemaVersion: "consent-v1",
  policyVersion: "consent-policy-v1",
  decision: "needs_review",
  fieldStatus: {
    party_name: "accepted",
    effective_date: "accepted",
    withdrawal_method: "missing",
    contact_email: "accepted",
  },
  humanDecision: "pending",
  humanRationale: null,
};

describe("audit chain", () => {
  it("links review decisions to the extraction event", () => {
    const first = appendAudit(null, payload);
    const second = appendAudit(first, { ...payload, humanDecision: "approved", humanRationale: "Verified source page" });
    expect(verifyAuditChain([first, second])).toBe(true);
  });

  it("detects tampering", () => {
    const event = appendAudit(null, payload);
    expect(verifyAuditChain([{ ...event, humanDecision: "approved" }])).toBe(false);
  });
});
