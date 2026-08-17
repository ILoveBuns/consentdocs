import { describe, expect, it } from "vitest";
import { appendAudit, verifyAuditChain, type AuditPayload } from "../src/audit.js";
import { recordHumanDecision } from "../src/review.js";

const payload: AuditPayload = {
  inputSha256: "c".repeat(64),
  schemaVersion: "consent-v1",
  policyVersion: "consent-policy-v1",
  decision: "needs_review",
  fieldStatus: { party_name: "accepted", effective_date: "accepted", withdrawal_method: "missing", contact_email: "accepted" },
  humanDecision: "pending",
  humanRationale: null,
};

describe("human review", () => {
  it("requires an explicit rationale", () => {
    const event = appendAudit(null, payload);
    expect(() => recordHumanDecision(event, "approved", "short")).toThrow();
  });

  it("appends an approved decision without rewriting history", () => {
    const first = appendAudit(null, payload);
    const second = recordHumanDecision(first, "approved", "Verified withdrawal instructions on page one");
    expect(second.previousHash).toBe(first.eventHash);
    expect(verifyAuditChain([first, second])).toBe(true);
  });
});
