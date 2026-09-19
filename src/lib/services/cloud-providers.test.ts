import { describe, expect, it, vi } from "vitest";

import {
  FirebaseIdentityProvider,
  ResendEmailProvider,
  TurnstileProvider,
} from "@/lib/services/cloud-providers";

describe("TurnstileProvider", () => {
  it("validates the browser token with Cloudflare siteverify", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ success: true, action: "activation" }));
    const provider = new TurnstileProvider("turnstile-secret", fetcher);

    await expect(
      provider.verify({
        token: "browser-token",
        remoteIp: "203.0.113.4",
        idempotencyKey: "request-id",
      }),
    ).resolves.toEqual({ valid: true });

    const [url, init] = fetcher.mock.calls[0] ?? [];
    expect(url).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    expect(init?.method).toBe("POST");
    expect(init?.body?.toString()).toContain("secret=turnstile-secret");
    expect(init?.body?.toString()).toContain("response=browser-token");
    expect(init?.body?.toString()).toContain("remoteip=203.0.113.4");
    expect(init?.body?.toString()).toContain("idempotency_key=request-id");
  });
});

describe("ResendEmailProvider", () => {
  it("renders and sends an activation code email", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ id: "email_123" }));
    const provider = new ResendEmailProvider(
      "resend-key",
      "Alumni NIL <alumni@example.org>",
      fetcher,
    );

    await expect(
      provider.send({
        to: "alice@example.org",
        template: "activation-code",
        variables: { code: "123456", expiresInMinutes: "10" },
        idempotencyKey: "activation:challenge_1",
      }),
    ).resolves.toEqual({ messageId: "email_123" });

    const [, init] = fetcher.mock.calls[0] ?? [];
    expect(init?.headers).toMatchObject({
      Authorization: "Bearer resend-key",
      "Idempotency-Key": "activation:challenge_1",
    });
    expect(JSON.parse(String(init?.body))).toMatchObject({
      from: "Alumni NIL <alumni@example.org>",
      to: ["alice@example.org"],
      subject: "Votre code d’activation",
    });
    expect(String(init?.body)).toContain("123456");
  });
});

describe("FirebaseIdentityProvider", () => {
  it("creates the Firebase password identity during activation", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ localId: "firebase_uid", email: "Alice@Example.org" }));
    const provider = new FirebaseIdentityProvider("firebase-web-api-key", fetcher);

    const identity = await provider.activateWithPassword({
      emailNormalized: "alice@example.org",
      password: "correct horse battery staple",
    });

    expect(identity).toMatchObject({ uid: "firebase_uid", emailNormalized: "alice@example.org" });
    expect(fetcher.mock.calls[0]?.[0]).toBe(
      "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=firebase-web-api-key",
    );
    expect(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body))).toEqual({
      email: "alice@example.org",
      password: "correct horse battery staple",
      returnSecureToken: true,
    });
  });

  it("uses Firebase password authentication for login", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ localId: "firebase_uid", email: "alice@example.org" }));
    const provider = new FirebaseIdentityProvider("firebase-web-api-key", fetcher);

    await expect(
      provider.authenticateWithPassword({
        emailNormalized: "alice@example.org",
        password: "correct horse battery staple",
      }),
    ).resolves.toMatchObject({ uid: "firebase_uid", emailNormalized: "alice@example.org" });

    expect(fetcher.mock.calls[0]?.[0]).toBe(
      "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=firebase-web-api-key",
    );
  });

  it("updates a password through the authenticated Firebase admin endpoint", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ localId: "firebase_uid" }));
    const provider = new FirebaseIdentityProvider(
      "firebase-web-api-key",
      fetcher,
      {
        projectId: "nil-project",
        clientEmail: "firebase-admin@example.org",
        privateKey: "unused by injected token factory",
      },
      async () => "google-access-token",
    );

    await provider.resetPassword({ uid: "firebase_uid", password: "a new secure password" });

    expect(fetcher).toHaveBeenCalledWith(
      "https://identitytoolkit.googleapis.com/v1/projects/nil-project/accounts:update",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer google-access-token" }),
        body: JSON.stringify({ localId: "firebase_uid", password: "a new secure password" }),
      }),
    );
  });
});
