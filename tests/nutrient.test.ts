import { describe, expect, it, vi } from "vitest";
import { requireApiKey } from "../src/nutrient.js";

describe("Nutrient credential boundary", () => {
  it("requires a server-side key", () => {
    expect(() => requireApiKey({})).toThrow("NUTRIENT_API_KEY is required");
  });

  it("does not log the key while validating it", () => {
    const log = vi.spyOn(console, "log");
    expect(requireApiKey({ NUTRIENT_API_KEY: "secret-value" })).toBe("secret-value");
    expect(log).not.toHaveBeenCalled();
  });
});
