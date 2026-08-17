import { describe, expect, it } from "vitest";
import { normalizeDwsFields } from "../src/normalize.js";

describe("normalizeDwsFields", () => {
  it("normalizes source-grounded key-value pairs", () => {
    const fields = normalizeDwsFields({
      pages: [{
        pageIndex: 0,
        elements: [
          { label: "Party name", value: "Example Cooperative", confidence: 0.96, page: 1, bounds: [1, 2, 3, 4] },
          { label: "Effective date", value: "2026-08-17", confidence: 0.98, page: 1, bounds: [5, 6, 7, 8] },
        ],
      }],
    });
    expect(fields.find((field) => field.name === "party_name")).toMatchObject({
      value: "Example Cooperative",
      confidence: 0.96,
    });
    expect(fields.find((field) => field.name === "effective_date")?.citations).toHaveLength(1);
  });

  it("fails closed for absent fields", () => {
    const fields = normalizeDwsFields({ pages: [] });
    expect(fields).toHaveLength(4);
    expect(fields.every((field) => field.value === null && field.citations.length === 0)).toBe(true);
  });

  it("does not invent citations from malformed bounds", () => {
    const fields = normalizeDwsFields({ pages: [{ elements: [{ label: "Contact email", value: "a@example.test", confidence: 0.99, page: 1, bounds: [1, 2] }] }] });
    expect(fields.find((field) => field.name === "contact_email")?.citations).toEqual([]);
  });

  it("selects the highest confidence duplicate deterministically", () => {
    const fields = normalizeDwsFields({ pages: [{ elements: [
      { label: "Party name", value: "Low", confidence: 0.51, page: 1, bounds: [1, 2, 3, 4] },
      { label: "Party name", value: "High", confidence: 0.97, page: 1, bounds: [5, 6, 7, 8] },
    ] }] });
    expect(fields.find((field) => field.name === "party_name")?.value).toBe("High");
  });
});
