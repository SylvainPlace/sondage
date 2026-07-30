import { describe, expect, it } from "vitest";

import { createOpaqueSessionToken, hashOpaqueToken } from "./opaque-token";

describe("opaque session tokens", () => {
  it("creates URL-safe tokens with at least 256 bits of entropy", () => {
    const first = createOpaqueSessionToken();
    const second = createOpaqueSessionToken();

    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/u);
    expect(second).not.toBe(first);
  });

  it("hashes a token deterministically without returning the raw token", async () => {
    const token = "test-token";

    const firstHash = await hashOpaqueToken(token, "test-pepper");
    const secondHash = await hashOpaqueToken(token, "test-pepper");

    expect(firstHash).toBe(secondHash);
    expect(firstHash).toMatch(/^[a-f0-9]{64}$/u);
    expect(firstHash).not.toContain(token);
  });

  it("separates hashes belonging to different environments", async () => {
    const productionHash = await hashOpaqueToken("same-token", "production-pepper");
    const previewHash = await hashOpaqueToken("same-token", "preview-pepper");

    expect(productionHash).not.toBe(previewHash);
  });

  it("rejects missing secrets", async () => {
    await expect(hashOpaqueToken("token", "")).rejects.toThrow("Session pepper is required");
    await expect(hashOpaqueToken("", "pepper")).rejects.toThrow("Session token is required");
  });
});
