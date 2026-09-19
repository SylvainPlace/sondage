"use client";

import Script from "next/script";
import { FormEvent, useEffect, useRef, useState } from "react";

import styles from "./AlumniAccess.module.css";

type Mode = "login" | "activation";
type ActivationStep = "email" | "code" | "password" | "complete";

interface ApiError {
  error?: { message?: string };
}

declare global {
  interface Window {
    turnstile?: {
      render(
        container: HTMLElement,
        options: {
          sitekey: string;
          action: string;
          theme: "light";
          callback: (token: string) => void;
          "expired-callback": () => void;
          "error-callback": () => void;
        },
      ): string;
      reset(widgetId: string): void;
      remove(widgetId: string): void;
    };
  }
}

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "0x4AAAAAAE8u33ydjKJIymgp";

export default function AlumniAccess() {
  const [mode, setMode] = useState<Mode>("login");
  const [activationStep, setActivationStep] = useState<ActivationStep>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [activationToken, setActivationToken] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [scriptReady, setScriptReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const turnstileContainer = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (
      mode !== "activation" ||
      activationStep !== "email" ||
      !scriptReady ||
      !window.turnstile ||
      !turnstileContainer.current ||
      widgetId.current
    ) {
      return;
    }

    const turnstile = window.turnstile;
    widgetId.current = turnstile.render(turnstileContainer.current, {
      sitekey: siteKey,
      action: "activation",
      theme: "light",
      callback: setTurnstileToken,
      "expired-callback": () => setTurnstileToken(""),
      "error-callback": () => setTurnstileToken(""),
    });
    return () => {
      if (widgetId.current) turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [activationStep, mode, scriptReady]);

  function selectMode(nextMode: Mode) {
    setMode(nextMode);
    setTurnstileToken("");
    setError("");
    setMessage("");
  }

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(async () => {
      await api("/api/auth/login", { email, password });
      window.location.assign("/profil");
    });
  }

  async function requestActivation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!turnstileToken) {
      setError("Validez d’abord la vérification anti-robot.");
      return;
    }
    await run(async () => {
      const result = await api<{ message: string }>("/api/auth/activation/request", {
        email,
        turnstileToken,
      });
      setMessage(result.message);
      setActivationStep("code");
    });
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(async () => {
      const result = await api<{ activationToken: string }>("/api/auth/activation/verify", {
        email,
        code,
      });
      setActivationToken(result.activationToken);
      setMessage("Adresse confirmée. Choisissez maintenant votre mot de passe.");
      setActivationStep("password");
    });
  }

  async function completeActivation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(async () => {
      await api("/api/auth/activation/complete", { activationToken, password });
      window.location.assign("/profil");
    });
  }

  async function run(operation: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await operation();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.card} aria-labelledby="access-title">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />

      <div className={styles.tabs} role="tablist" aria-label="Accès alumni">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "login"}
          className={mode === "login" ? styles.activeTab : ""}
          onClick={() => selectMode("login")}
        >
          Se connecter
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "activation"}
          className={mode === "activation" ? styles.activeTab : ""}
          onClick={() => selectMode("activation")}
        >
          Première visite
        </button>
      </div>

      <div className={styles.content}>
        <p className={styles.kicker}>{mode === "login" ? "Bon retour" : "Activer mon accès"}</p>
        <h2 id="access-title">
          {mode === "login" ? "Retrouvez votre réseau." : activationTitle(activationStep)}
        </h2>
        <p className={styles.hint}>
          {mode === "login"
            ? "Utilisez l’adresse et le mot de passe associés à votre compte alumni."
            : activationHint(activationStep, email)}
        </p>

        {mode === "login" && (
          <form className={styles.form} onSubmit={submitLogin}>
            <EmailField value={email} onChange={setEmail} />
            <PasswordField
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
            />
            <SubmitButton busy={busy}>Entrer dans mon espace</SubmitButton>
          </form>
        )}

        {mode === "activation" && activationStep === "email" && (
          <form className={styles.form} onSubmit={requestActivation}>
            <EmailField value={email} onChange={setEmail} />
            <div ref={turnstileContainer} className={styles.turnstile} />
            <SubmitButton busy={busy}>Recevoir mon code</SubmitButton>
          </form>
        )}

        {mode === "activation" && activationStep === "code" && (
          <form className={styles.form} onSubmit={verifyCode}>
            <label>
              Code à 6 chiffres
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                required
                className={styles.codeInput}
              />
            </label>
            <SubmitButton busy={busy}>Vérifier le code</SubmitButton>
            <button
              className={styles.textButton}
              type="button"
              onClick={() => setActivationStep("email")}
            >
              Recommencer avec une autre adresse
            </button>
          </form>
        )}

        {mode === "activation" && activationStep === "password" && (
          <form className={styles.form} onSubmit={completeActivation}>
            <PasswordField value={password} onChange={setPassword} autoComplete="new-password" />
            <SubmitButton busy={busy}>Finaliser mon compte</SubmitButton>
          </form>
        )}

        {message && <p className={styles.success}>{message}</p>}
        {error && <p className={styles.error}>{error}</p>}
      </div>
    </section>
  );
}

function EmailField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label>
      Adresse e-mail
      <input
        type="email"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="email"
        placeholder="prenom.nom@exemple.fr"
        required
      />
    </label>
  );
}

function PasswordField({
  value,
  onChange,
  autoComplete,
}: {
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
}) {
  return (
    <label>
      Mot de passe
      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        minLength={6}
        required
      />
    </label>
  );
}

function SubmitButton({ busy, children }: { busy: boolean; children: React.ReactNode }) {
  return (
    <button className={styles.submit} type="submit" disabled={busy}>
      {busy ? "Un instant…" : children}
      <span aria-hidden="true">↗</span>
    </button>
  );
}

function activationTitle(step: ActivationStep): string {
  if (step === "code") return "Consultez votre boîte mail.";
  if (step === "password") return "Sécurisez votre compte.";
  if (step === "complete") return "Votre accès est ouvert.";
  return "Rejoignez l’espace alumni.";
}

function activationHint(step: ActivationStep, email: string): string {
  if (step === "code") {
    return `Saisissez le code envoyé à ${email || "votre adresse"}. Il reste valable 10 minutes.`;
  }
  if (step === "password") return "Choisissez un mot de passe d’au moins 6 caractères.";
  if (step === "complete") return "Vous pouvez désormais accéder à votre espace personnel.";
  return "Votre adresse doit avoir été préinscrite par l’équipe NIL.";
}

async function api<T = Record<string, unknown>>(url: string, body: object): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = (await response.json().catch(() => ({}))) as T & ApiError;
  if (!response.ok) throw new Error(result.error?.message ?? "La demande n’a pas abouti.");
  return result;
}
