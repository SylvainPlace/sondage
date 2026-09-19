"use client";

import { FormEvent, useEffect, useState } from "react";

import styles from "./ProfileEditor.module.css";

interface ProfileValue {
  graduationYear: number | null;
  specialty: string | null;
  additionalDegrees: string[];
  availableForRecruiting: boolean;
  availableForMentoring: boolean;
  remindersEnabled: boolean;
}

interface ProfileResponse {
  profile: ProfileValue;
  directoryConsent: {
    directoryEnabled: boolean;
  };
}

interface ErrorResponse {
  error?: {
    message?: string;
    fields?: Record<string, string>;
  };
}

const emptyProfile: ProfileValue = {
  graduationYear: null,
  specialty: null,
  additionalDegrees: [],
  availableForRecruiting: false,
  availableForMentoring: false,
  remindersEnabled: true,
};

export default function ProfileEditor() {
  const [profile, setProfile] = useState<ProfileValue>(emptyProfile);
  const [additionalDegrees, setAdditionalDegrees] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    void fetch("/api/profile")
      .then(async (response) => {
        if (response.status === 401) {
          if (active) setUnauthorized(true);
          return;
        }
        if (!response.ok) throw new Error("Impossible de charger votre profil.");
        const result = (await response.json()) as ProfileResponse;
        if (active) {
          setProfile(result.profile);
          setAdditionalDegrees(result.profile.additionalDegrees.join("\n"));
        }
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : "Une erreur est survenue.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    setFieldErrors({});
    try {
      const csrfToken = readCookie("__Host-alumni_csrf");
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          ...profile,
          additionalDegrees: additionalDegrees
            .split("\n")
            .map((degree) => degree.trim())
            .filter(Boolean),
        }),
      });
      const result = (await response.json().catch(() => ({}))) as ProfileResponse & ErrorResponse;
      if (!response.ok) {
        setFieldErrors(result.error?.fields ?? {});
        throw new Error(result.error?.message ?? "Le profil n’a pas pu être enregistré.");
      }
      setProfile(result.profile);
      setAdditionalDegrees(result.profile.additionalDegrees.join("\n"));
      setMessage("Votre profil a bien été enregistré.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className={styles.state}>Ouverture de votre profil…</div>;
  }
  if (unauthorized) {
    return (
      <div className={styles.state}>
        <strong>Votre session n’est plus active.</strong>
        <a href="/">Revenir à la connexion</a>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={saveProfile} noValidate>
      <section className={styles.section} aria-labelledby="parcours-title">
        <div className={styles.sectionHeading}>
          <span>01</span>
          <div>
            <h2 id="parcours-title">Votre passage par NIL</h2>
            <p>Quelques repères stables pour mieux comprendre les parcours de la communauté.</p>
          </div>
        </div>

        <div className={styles.fields}>
          <label>
            <span>
              Année de diplôme <b>obligatoire</b>
            </span>
            <input
              type="number"
              min="1950"
              max="2200"
              required
              value={profile.graduationYear ?? ""}
              aria-invalid={Boolean(fieldErrors.graduationYear)}
              onChange={(event) =>
                setProfile({
                  ...profile,
                  graduationYear: event.target.value ? Number(event.target.value) : null,
                })
              }
            />
            {fieldErrors.graduationYear && <small>{fieldErrors.graduationYear}</small>}
          </label>

          <label>
            <span>
              Spécialité <em>facultatif</em>
            </span>
            <input
              value={profile.specialty ?? ""}
              placeholder="Ex. Data, développement, produit…"
              onChange={(event) => setProfile({ ...profile, specialty: event.target.value })}
            />
          </label>

          <label className={styles.wideField}>
            <span>
              Diplômes complémentaires <em>facultatif · un par ligne</em>
            </span>
            <textarea
              rows={3}
              value={additionalDegrees}
              placeholder={"Master économie numérique\nCertification accessibilité"}
              onChange={(event) => setAdditionalDegrees(event.target.value)}
            />
          </label>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="ouverture-title">
        <div className={styles.sectionHeading}>
          <span>02</span>
          <div>
            <h2 id="ouverture-title">Vos préférences</h2>
            <p>Ces choix restent privés et peuvent être modifiés à tout moment.</p>
          </div>
        </div>

        <div className={styles.preferences}>
          <Toggle
            label="Je suis disponible pour des opportunités de recrutement"
            checked={profile.availableForRecruiting}
            onChange={(checked) => setProfile({ ...profile, availableForRecruiting: checked })}
          />
          <Toggle
            label="Je suis disponible pour du mentorat"
            checked={profile.availableForMentoring}
            onChange={(checked) => setProfile({ ...profile, availableForMentoring: checked })}
          />
          <Toggle
            label="Recevoir les rappels d’actualisation"
            checked={profile.remindersEnabled}
            onChange={(checked) => setProfile({ ...profile, remindersEnabled: checked })}
          />
        </div>
      </section>

      <aside className={styles.privacy}>
        <span aria-hidden="true">◇</span>
        <div>
          <strong>Votre profil n’est pas un annuaire.</strong>
          <p>
            Les consentements de publication sont désactivés. Aucune information nominative n’est
            consultable par les autres alumni dans cette version.
          </p>
        </div>
      </aside>

      {message && <p className={styles.success}>{message}</p>}
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        {message ? (
          <a href="/contribution">Continuer vers mon activité →</a>
        ) : (
          <span>Les champs facultatifs peuvent rester vides.</span>
        )}
        <button type="submit" disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer mon profil"}
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </form>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={styles.toggleRow}>
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <i aria-hidden="true" />
    </label>
  );
}

function readCookie(name: string): string {
  const prefix = `${name}=`;
  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  return cookie?.slice(prefix.length) ?? "";
}
