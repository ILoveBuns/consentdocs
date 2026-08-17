import { writeFile } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import { appendAudit, verifyAuditChain } from "./audit.js";
import { sha256 } from "./hash.js";
import { normalizeDwsFields } from "./normalize.js";
import { extractConsentFields } from "./nutrient.js";
import { evaluateConsent } from "./policy.js";

const filePath = process.argv[2] ?? "fixtures/complete-consent.pdf";
const response = await extractConsentFields(filePath);
const inputSha256 = sha256(await readFile(filePath));
const fields = normalizeDwsFields(response.body);
const policy = evaluateConsent({
  inputSha256,
  provider: "nutrient-dws",
  providerRequestId: response.requestId,
  fields,
});
const audit = appendAudit(null, {
  inputSha256,
  schemaVersion: "consent-v1",
  policyVersion: "consent-policy-v1",
  decision: policy.decision,
  fieldStatus: policy.fieldStatus,
  humanDecision: "pending",
  humanRationale: null,
});
const publicReceipt = {
  provider: "nutrient-dws",
  operation: "extraction-extract-consent-v1",
  status: response.status,
  requestId: response.requestId,
  inputSha256,
  fieldStatus: policy.fieldStatus,
  decision: policy.decision,
  resultHash: policy.resultHash,
  auditHash: audit.eventHash,
  auditChainValid: verifyAuditChain([audit]),
  completedAt: new Date().toISOString(),
};
await writeFile("evidence/dws-extract.public.json", `${JSON.stringify(publicReceipt, null, 2)}\n`, { mode: 0o644 });
console.log(JSON.stringify(publicReceipt, null, 2));
