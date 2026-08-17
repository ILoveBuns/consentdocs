import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";

const response = {
  status: 200,
  requestId: "request-test",
  body: {
    output: {
      data: {
        party_name: "Example Cooperative",
        signature_party_name: "Example Cooperative",
        effective_date: "2026-08-17",
        withdrawal_method: "privacy@example.test",
        contact_email: "compliance@example.test",
      },
      metadata: Object.fromEntries(["party_name", "effective_date", "withdrawal_method", "contact_email"].map((name) => [name, {
        confidence: 0.99,
        match: "id_match",
        pageNumber: 1,
        bbox: { x: 1, y: 2, width: 3, height: 4 },
      }])),
    },
  },
};

describe("ConsentDocs API", () => {
  it("analyzes one PDF and records a human decision", async () => {
    const app = await buildApp({ extractor: async () => response, serveStatic: false });
    const boundary = "test-boundary";
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="synthetic.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
      Buffer.from("%PDF-1.4 synthetic"),
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);
    const analyzed = await app.inject({
      method: "POST",
      url: "/api/analyze",
      headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
      payload: body,
    });
    expect(analyzed.statusCode).toBe(200);
    expect(analyzed.json().policy.decision).toBe("auto_eligible");
    const reviewed = await app.inject({
      method: "POST",
      url: "/api/review",
      payload: {
        auditHash: analyzed.json().audit.eventHash,
        decision: "approved",
        rationale: "Verified against source evidence",
      },
    });
    expect(reviewed.statusCode).toBe(200);
    expect(reviewed.json().audit.humanDecision).toBe("approved");
    await app.close();
  });

  it("rejects non-PDF uploads before provider execution", async () => {
    let called = false;
    const app = await buildApp({ extractor: async () => { called = true; return response; }, serveStatic: false });
    const boundary = "test-boundary";
    const body = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="notes.txt"\r\nContent-Type: text/plain\r\n\r\nno\r\n--${boundary}--\r\n`);
    const result = await app.inject({ method: "POST", url: "/api/analyze", headers: { "content-type": `multipart/form-data; boundary=${boundary}` }, payload: body });
    expect(result.statusCode).toBe(415);
    expect(called).toBe(false);
    await app.close();
  });
});
