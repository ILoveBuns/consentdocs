import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("review console", () => {
  it("exposes the three deterministic review scenarios", async () => {
    const script = await readFile("web/app.js", "utf8");
    expect(script).toContain("complete-consent.pdf");
    expect(script).toContain("missing-withdrawal.pdf");
    expect(script).toContain("conflicting-party.pdf");
  });

  it("labels the interface as synthetic and avoids real PII", async () => {
    const html = await readFile("web/index.html", "utf8");
    expect(html).toContain("SYNTHETIC · NO REAL PII");
    expect(html).not.toMatch(/gmail\.com|qq\.com|hotmail\.com/);
  });
});
