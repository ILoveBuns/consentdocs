import { writeFile } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { appendAudit, verifyAuditChain } from "./audit.js";
import { sha256 } from "./hash.js";
import { detectPartyConflict, normalizeDwsFields } from "./normalize.js";
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
  signals: { partyConflict: detectPartyConflict(response.body) },
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
const responseRecord = typeof response.body === "object" && response.body !== null && !Array.isArray(response.body)
  ? response.body as Record<string, unknown>
  : {};
const metrics = typeof responseRecord.metrics === "object" && responseRecord.metrics !== null && !Array.isArray(responseRecord.metrics)
  ? responseRecord.metrics as Record<string, unknown>
  : {};
const usage = typeof responseRecord.usage === "object" && responseRecord.usage !== null && !Array.isArray(responseRecord.usage)
  ? responseRecord.usage as Record<string, unknown>
  : {};
const extractionCredits = typeof usage.data_extraction_credits === "object" && usage.data_extraction_credits !== null && !Array.isArray(usage.data_extraction_credits)
  ? usage.data_extraction_credits as Record<string, unknown>
  : {};
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
  usage: {
    pagesProcessed: typeof metrics.pagesProcessed === "number" ? metrics.pagesProcessed : null,
    creditsCost: typeof extractionCredits.cost === "number" ? extractionCredits.cost : null,
    remainingCredits: typeof extractionCredits.remainingCredits === "number" ? extractionCredits.remainingCredits : null,
  },
  completedAt: new Date().toISOString(),
};
const receiptName = `${basename(filePath, ".pdf")}.public.json`;
await writeFile(`evidence/${receiptName}`, `${JSON.stringify(publicReceipt, null, 2)}\n`, { mode: 0o644 });
console.log(JSON.stringify(publicReceipt, null, 2));
