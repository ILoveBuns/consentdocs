# ConsentDocs — Devpost submission draft

## One-line pitch

ConsentDocs turns high-stakes consent documents into source-grounded,
deterministic decisions with human review exactly where uncertainty remains.

## Inspiration

Most document AI demos stop after extracting plausible text. That is not enough
for consent, where a missing withdrawal method or a mismatch between the named
party and signature block can invalidate the workflow. ConsentDocs separates
fact extraction from decision authority: Nutrient DWS extracts and cites the
facts, deterministic local policy decides whether automation is safe, and a
human records the final exception decision in a tamper-evident chain.

## What it does

1. Accepts one PDF through a secure server-side upload endpoint.
2. Sends the in-memory file to Nutrient DWS Data Extraction with a constrained
   consent schema and citations enabled.
3. Normalizes party, date, withdrawal, and contact evidence while preserving
   source page, bounds, match label, and confidence signal.
4. Fails closed when required evidence is missing, low-confidence, malformed,
   uncited, or conflicting.
5. Routes exceptions to a human review console.
6. Appends approval or rejection, including an explicit rationale, to a
   SHA-256-linked audit chain.
7. Exports a privacy-safe audit summary without the source document, API key,
   or raw provider response.

## Where Nutrient DWS does the heavy lifting

Nutrient DWS is the core document operation, not a decorative call. Its real
`POST /extraction/extract` endpoint maps each PDF to the consent schema and
returns the values plus field-level source citations. ConsentDocs cannot make a
business decision until that DWS response exists. The application then uses
the returned grounding evidence to make deterministic routing decisions and
show reviewers exactly where each fact came from.

**Submission-form version:** Nutrient DWS performs the core PDF-to-structured-
evidence operation, including field-level citations; without that grounded
response, ConsentDocs deliberately refuses to issue a workflow decision.

## How we built it

- TypeScript and Fastify backend with an in-memory, 10 MiB-limited PDF upload.
- Nutrient DWS Data Extraction `understand` mode with citations enabled.
- Deterministic policy and canonical SHA-256 result hashing.
- Append-only human review audit chain.
- Responsive dependency-free review console.
- Vitest, TypeScript strict mode, GitHub Actions, and production dependency
  auditing.

## Real evidence

Three real Nutrient requests prove the decision matrix:

- Complete consent: HTTP 200 → `auto_eligible`.
- Missing withdrawal method: HTTP 200 → `needs_review`.
- Conflicting agreement/signature parties: HTTP 200 → `needs_review`.

Each one-page run consumed 15 Data Extraction credits. Public receipts contain
provider request IDs, input hashes, field status, deterministic result hashes,
and verified audit hashes, but no document text or credentials.

## Challenge we overcame

Our first conflict test exposed a subtle safety bug: asking for one generic
`party_name` allowed an extraction model to choose one of two conflicting
names, hiding the disagreement from policy. We changed the schema to extract
the agreement party and signature party separately, then compare them with
local deterministic logic. The repeated real run correctly changed from
`auto_eligible` to `needs_review`.

## Accomplishments

- Real Nutrient DWS integration completed within minutes of the competition
  submission window opening.
- Real complete, missing-field, and conflict scenarios with public receipts.
- Upload-to-human-review end-to-end flow verified against DWS.
- 23 tests, strict type checking, zero production dependency vulnerabilities,
  and green CI.
- API key remains server-side and never enters the browser, logs, repository,
  or public evidence.

## Feasibility and business path

ConsentDocs is designed as a narrow workflow layer rather than another general
document model. A regulated team can keep its existing approval policy, use DWS
to turn incoming PDFs into cited evidence, and automate only the cases that
meet that policy. The remaining cases arrive in one review queue with the
missing or conflicting evidence already identified.

The initial product path is a per-document API and reviewer workspace for
privacy, legal, and onboarding teams. Expansion does not require retraining a
model: teams add deterministic policy packs for their document type while the
same DWS extraction, citation, review, and audit pipeline remains in place.
This makes a pilot feasible with synthetic or approved documents first, then a
controlled rollout beside an existing manual process. No customer, revenue, or
time-savings claim is made without production evidence.

## What is next

- Overlay DWS bounding boxes directly on rendered PDF pages.
- Add DWS redaction and signing after human approval.
- Persist encrypted audit events for multi-reviewer organizations.
- Add policy packs for vendor agreements, privacy notices, and regulated
  onboarding forms.

## Links

- Live review console: https://ilovebuns.github.io/consentdocs/
- Public repository: https://github.com/ILoveBuns/consentdocs
- Real run evidence: https://github.com/ILoveBuns/consentdocs/tree/main/evidence
