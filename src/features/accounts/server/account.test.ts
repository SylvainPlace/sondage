import { describe, expect, it } from "vitest";

import { normalizeEmail } from "./account";

describe("normalizeEmail", () => {
  it("normalizes whitelist and login addresses consistently", () => {
    expect(normalizeEmail("  Alumni.Example@School.FR ")).toBe("alumni.example@school.fr");
  });
});
