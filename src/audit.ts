import { hashCanonical } from "./hash.js";
import type { Decision, FieldName } from "./types.js";

export interface AuditPayload {
  inputSha256: string;
  schemaVersion: "consent-v1";
  policyVersion: "consent-policy-v1";
  decision: Decision;
  fieldStatus: Readonly<Record<FieldName, string>>;
  humanDecision: "pending" | "approved" | "rejected";
  humanRationale: string | null;
}

export interface AuditEvent extends AuditPayload {
  sequence: number;
  previousHash: string | null;
  eventHash: string;
}

export function appendAudit(
  previous: AuditEvent | null,
  payload: AuditPayload,
): AuditEvent {
  const sequence = previous ? previous.sequence + 1 : 1;
  const previousHash = previous?.eventHash ?? null;
  const event = { ...payload, sequence, previousHash };
  return { ...event, eventHash: hashCanonical(event) };
}

export function verifyAuditChain(events: readonly AuditEvent[]): boolean {
  return events.every((event, index) => {
    const previous = index === 0 ? null : events[index - 1];
    const { eventHash, ...unsigned } = event;
    return event.previousHash === (previous?.eventHash ?? null) && eventHash === hashCanonical(unsigned);
  });
}
