import { mkdir, writeFile } from "node:fs/promises";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

await mkdir(new URL("../fixtures/", import.meta.url), { recursive: true });

async function createFixture(name: string, lines: readonly string[]): Promise<void> {
  const output = new URL(`../fixtures/${name}.pdf`, import.meta.url);
  const document = await PDFDocument.create();
  const page = document.addPage([612, 792]);
  const font = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  page.drawText("Synthetic Data Processing Consent", { x: 54, y: 720, size: 18, font: bold });
  lines.forEach((line, index) => page.drawText(line, {
    x: 54,
    y: 670 - index * 34,
    size: 11,
    font,
    color: rgb(0.12, 0.16, 0.22),
  }));
  await writeFile(output, await document.save());
  console.log(output.pathname);
}

const commonFooter = [
  "Consent scope: Process synthetic onboarding records for a product demonstration.",
  "No real person or real personal data is represented in this document.",
];

await createFixture("complete-consent", [
  "Party name: Example Research Cooperative",
  "Effective date: 2026-08-17",
  "Withdrawal method: Email the privacy desk at withdraw@example.test",
  "Contact email: compliance@example.test",
  "Signature party: Example Research Cooperative",
  ...commonFooter,
]);

await createFixture("missing-withdrawal", [
  "Party name: Example Research Cooperative",
  "Effective date: 2026-08-17",
  "Contact email: compliance@example.test",
  "Signature party: Example Research Cooperative",
  ...commonFooter,
]);

await createFixture("conflicting-party", [
  "Agreement party: Example Research Cooperative",
  "Effective date: 2026-08-17",
  "Withdrawal method: Email the privacy desk at withdraw@example.test",
  "Contact email: compliance@example.test",
  "Signature party: Different Example Holdings",
  ...commonFooter,
]);
