import { appendAudit, type AuditEvent } from "./audit.js";

export function recordHumanDecision(
  previous: AuditEvent,
  decision: "approved" | "rejected",
  rationale: string,
): AuditEvent {
  const normalizedRationale = rationale.trim();
  if (normalizedRationale.length < 8 || normalizedRationale.length > 500) {
    throw new Error("Human rationale must contain 8 to 500 characters");
  }
  return appendAudit(previous, {
    inputSha256: previous.inputSha256,
    schemaVersion: previous.schemaVersion,
    policyVersion: previous.policyVersion,
    decision: previous.decision,
    fieldStatus: previous.fieldStatus,
    humanDecision: decision,
    humanRationale: normalizedRationale,
  });
}
