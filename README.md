# ConsentDocs

ConsentDocs turns consent-heavy documents into deterministic, reviewable, and
audit-ready decisions. It is being built from scratch during the DevNetwork
API + Cloud + AI Hackathon 2026 window for the Nutrient DWS Challenge.

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
