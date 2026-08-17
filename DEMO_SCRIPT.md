# ConsentDocs demo script — target 2:45

## 0:00–0:20 — Problem

“Document AI often returns something plausible, but consent workflows need
something provable. ConsentDocs uses Nutrient DWS for source-grounded facts,
deterministic policy for routing, and humans for the exceptions.”

Show the public console and the workflow integrity card.

## 0:20–0:55 — Complete document

Select `complete-consent.pdf`.

“DWS extracted four mandatory business fields. Every accepted field has a
source citation, and the local policy returns auto-eligible. The signal is
displayed as an uncalibrated signal, not misleadingly as a probability.”

Click two field rows to highlight their source areas.

## 0:55–1:30 — Missing evidence

Select `missing-withdrawal.pdf`.

“This document never says how consent can be withdrawn. DWS does not invent the
field. ConsentDocs marks it missing and blocks automation.”

Enter a reviewer rationale, explain that static public mode previews the action,
and that the local server records it as a linked audit event.

## 1:30–2:05 — Conflict correction

Select `conflicting-party.pdf`.

“Our first real probe taught us something important. A one-field schema selected
one party and hid the conflict. We fixed the architecture by extracting the
agreement and signature parties separately. Local deterministic policy now
flags the mismatch instead of asking the model to decide.”

Show `evidence/RUN_002.md` and the two request receipts.

## 2:05–2:30 — Real end-to-end path

Run the local server, upload the missing-withdrawal fixture, and show:

- `Nutrient DWS connected`;
- the real provider request ID;
- `needs_review`;
- a human approval producing a new audit hash linked to the first.

## 2:30–2:45 — Close

“Nutrient DWS does the core extraction and citation work. ConsentDocs turns that
evidence into a workflow people can trust: automate the clear cases, escalate
the uncertainty, and preserve every decision.”
