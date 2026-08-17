import { writeFile } from "node:fs/promises";
import { extractKeyValuePairs } from "./nutrient.js";

const filePath = process.argv[2] ?? "fixtures/complete-consent.pdf";
const response = await extractKeyValuePairs(filePath);
const publicReceipt = {
  provider: "nutrient-dws",
  operation: "build-json-content-key-value-pairs",
  status: response.status,
  requestId: response.requestId,
  receivedJson: typeof response.body === "object" && response.body !== null,
  completedAt: new Date().toISOString(),
};
await writeFile("evidence/dws-build.public.json", `${JSON.stringify(publicReceipt, null, 2)}\n`, { mode: 0o600 });
console.log(JSON.stringify(publicReceipt, null, 2));
