# ConsentDocs

ConsentDocs turns consent-heavy documents into deterministic, reviewable, and
audit-ready decisions. It is being built from scratch during the DevNetwork
API + Cloud + AI Hackathon 2026 window for the Nutrient DWS Challenge.

Nutrient DWS performs the core PDF-to-structured-evidence operation, including
field-level citations. Without that grounded response, ConsentDocs deliberately
refuses to issue a workflow decision.

## Current evidence

- A real Nutrient DWS `/extraction/extract` call completed with HTTP `200` on
  the synthetic fixture; see `evidence/RUN_001.md`.
- A three-document real API matrix proves complete consent is eligible while a
  missing withdrawal method and conflicting parties are blocked; see
  `evidence/RUN_002.md`.
- A real server flow proves browser upload, DWS extraction, deterministic
  routing, and a chained human decision; see `evidence/RUN_003.md`.
- Nutrient DWS is the only document provider in the production adapter.
- The API key is read server-side from `NUTRIENT_API_KEY` and never logged.
- Missing, low-confidence, uncited, or malformed fields fail closed.
- Business result hashes exclude provider request IDs and timestamps.
- Human decisions form a tamper-evident SHA-256 audit chain.
- All included documents are synthetic and contain no real personal data.

## Run locally

```bash
npm ci
npm run check
npm run fixture
npm run demo
npm start
```

To execute the real DWS integration after setting the key in your private
environment:

```bash
NUTRIENT_API_KEY=... npm run dws:run -- fixtures/complete-consent.pdf
```

The command writes only a sanitized receipt under `evidence/`, named after the
input fixture. It does not persist the API key, source document text, or raw
provider response.

## Submission materials

- `SUBMISSION_DRAFT.md` — complete Devpost narrative.
- `DEMO_SCRIPT.md` — timed 2–4 minute walkthrough.
- `DEVPOST_UPLOAD_CHECKLIST.md` — exact field values, media order, captions,
  and final eligibility/link checks.
- `submission-assets/` — a 1200×630 project cover plus five 1920×1080
  Devpost-ready screenshots covering grounded extraction, missing evidence,
  conflicting evidence, the live DWS path, and the public real-run receipt.

## Product path

The first deployable form is a per-document API plus a reviewer workspace for
privacy, legal, and onboarding teams. Organizations retain their deterministic
approval rules while DWS supplies cited evidence; new document categories are
added as policy packs instead of requiring model retraining. The current public
build is a hackathon demonstration, not a claim of production customers,
revenue, or measured labor savings.
