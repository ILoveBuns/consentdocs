import { readFile } from "node:fs/promises";
import { buildApp } from "./app.js";

if (!process.env.NUTRIENT_API_KEY) {
  try {
    process.env.NUTRIENT_API_KEY = (await readFile("/root/.config/consentdocs/nutrient-api-key", "utf8")).trim();
  } catch {
    // Startup health reports the missing key without logging its value.
  }
}

const app = await buildApp();
const port = Number.parseInt(process.env.PORT ?? "4173", 10);
await app.listen({ host: "0.0.0.0", port });
