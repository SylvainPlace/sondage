"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import styles from "./ActivityEditor.module.css";

interface Option {
  id: string;
  label: string;
}

interface DomainOption extends Option {
  occupations: Option[];
}

interface Activity {
  id: string;
  startedOn: string | null;
  employmentRelation: string;
  domain: Option;
  occupation: Option;
  jobTitle: string;
  sector: Option;
  employmentCountryCode: string;
  currentSnapshot: {
    observedOn: string;
    fixedCompensationEuros: number;
    variableCompensationKnown: boolean;
    variableCompensationEuros: number | null;
    workRatioPercent: number;
    weeklyHours: number;
    currency: string;
  };
}

interface ActivitiesResponse {
  activities: Activity[];
  options: { domains: DomainOption[]; sectors: Option[] };
}

interface ActivityForm {
  employmentRelation: string;
  domainCategoryId: string;
  occupationCategoryId: string;
  jobTitle: string;
  sectorCategoryId: string;
  employmentCountryCode: string;
  startedOn: string;
  observedOn: string;
  fixedCompensationEuros: string;
  variableCompensationKnown: boolean;
  variableCompensationEuros: string;
}

const relationLabels: Record<string, string> = {
  permanent: "CDI",
  fixed_term: "CDD",
  civil_servant: "Fonctionnaire",
  public_contract: "Contractuel public",
  independent: "Indépendant",
  apprenticeship: "Alternance",
  internship: "Stage",
  volunteer: "Volontariat",
  other: "Autre",
};

export default function ActivityEditor() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [domains, setDomains] = useState<DomainOption[]>([]);
  const [sectors, setSectors] = useState<Option[]>([]);
  const [form, setForm] = useState<ActivityForm>(() => emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const occupations = useMemo(
    () => domains.find((domain) => domain.id === form.domainCategoryId)?.occupations ?? [],
    [domains, form.domainCategoryId],
  );

  useEffect(() => {
    let active = true;
    void fetch("/api/activities")
      .then(async (response) => {
        if (response.status === 401) {
          if (active) setUnauthorized(true);
          return;
        }
        if (!response.ok) throw new Error("Impossible de charger vos activités.");
        const result = (await response.json()) as ActivitiesResponse;
        if (active) {
          setActivities(result.activities);
          setDomains(result.options.domains);
          setSectors(result.options.sectors);
        }
      })
      .catch((caught: unknown) => {
        if (active) setError(messageFrom(caught));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function saveActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setFieldErrors({});
    try {
      const response = await fetch(
        editingId ? `/api/activities/${encodeURIComponent(editingId)}` : "/api/activities",
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": readCookie("__Host-alumni_csrf"),
          },
          body: JSON.stringify({
            ...form,
            startedOn: form.startedOn || null,
            fixedCompensationEuros: Number(form.fixedCompensationEuros),
            variableCompensationEuros: form.variableCompensationKnown
              ? Number(form.variableCompensationEuros)
              : null,
          }),
        },
      );
      const result = (await response.json().catch(() => ({}))) as {
        activity?: Activity;
        error?: { fields?: Record<string, string>; message?: string };
      };
      if (!response.ok || !result.activity) {
        setFieldErrors(result.error?.fields ?? {});
        throw new Error(result.error?.message ?? "L’activité n’a pas pu être enregistrée.");
      }
      setActivities((current) => {
        const others = current.filter((activity) => activity.id !== result.activity?.id);
        return result.activity ? [...others, result.activity] : current;
      });
      setEditingId(null);
      setForm(emptyForm());
    } catch (caught: unknown) {
      setError(messageFrom(caught));
    } finally {
      setSaving(false);
    }
  }

  function editActivity(activity: Activity) {
    setEditingId(activity.id);
    setFieldErrors({});
    setError("");
    setForm({
      employmentRelation: activity.employmentRelation,
      domainCategoryId: activity.domain.id,
      occupationCategoryId: activity.occupation.id,
      jobTitle: activity.jobTitle,
      sectorCategoryId: activity.sector.id,
      employmentCountryCode: activity.employmentCountryCode,
      startedOn: activity.startedOn ?? "",
      observedOn: activity.currentSnapshot.observedOn,
      fixedCompensationEuros: String(activity.currentSnapshot.fixedCompensationEuros),
      variableCompensationKnown: activity.currentSnapshot.variableCompensationKnown,
      variableCompensationEuros: String(activity.currentSnapshot.variableCompensationEuros ?? ""),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteActivity(activity: Activity) {
    if (!window.confirm(`Supprimer l’activité « ${activity.jobTitle} » ?`)) return;
    setError("");
    try {
      const response = await fetch(`/api/activities/${encodeURIComponent(activity.id)}`, {
        method: "DELETE",
        headers: { "x-csrf-token": readCookie("__Host-alumni_csrf") },
      });
      if (!response.ok) throw new Error("L’activité n’a pas pu être supprimée.");
      setActivities((current) => current.filter((item) => item.id !== activity.id));
      if (editingId === activity.id) {
        setEditingId(null);
        setForm(emptyForm());
      }
    } catch (caught: unknown) {
      setError(messageFrom(caught));
    }
  }

  if (loading) return <div className={styles.state}>Ouverture de votre contribution…</div>;
  if (unauthorized) {
    return (
      <div className={styles.state}>
        <strong>Votre session n’est plus active.</strong>
        <a href="/">Revenir à la connexion</a>
      </div>
    );
  }

  return (
    <div className={styles.workspace}>
      <form className={styles.form} onSubmit={saveActivity} noValidate>
        <div className={styles.formHeading}>
          <span>{editingId ? "Correction" : "Nouvelle activité"}</span>
          <h2>{editingId ? "Mettre à jour votre relevé" : "Décrivez votre situation actuelle"}</h2>
          <p>Un relevé comparable, sans vous demander ce qui ne concerne pas votre situation.</p>
        </div>

        <fieldset>
          <legend>Le rôle</legend>
          <div className={styles.fieldGrid}>
            <Field label="Relation de travail" error={fieldErrors.employmentRelation}>
              <select
                required
                value={form.employmentRelation}
                onChange={(event) => setForm({ ...form, employmentRelation: event.target.value })}
              >
                <option value="">Choisir…</option>
                {Object.entries(relationLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Domaine professionnel" error={fieldErrors.domainCategoryId}>
              <select
                required
                value={form.domainCategoryId}
                onChange={(event) =>
                  setForm({
                    ...form,
                    domainCategoryId: event.target.value,
                    occupationCategoryId: "",
                  })
                }
              >
                <option value="">Choisir…</option>
                {domains.map((domain) => (
                  <option key={domain.id} value={domain.id}>
                    {domain.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Métier" error={fieldErrors.occupationCategoryId}>
              <select
                required
                value={form.occupationCategoryId}
                onChange={(event) => setForm({ ...form, occupationCategoryId: event.target.value })}
              >
                <option value="">Choisir…</option>
                {occupations.map((occupation) => (
                  <option key={occupation.id} value={occupation.id}>
                    {occupation.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Intitulé de poste" error={fieldErrors.jobTitle} wide>
              <input
                required
                placeholder="Ex. Lead Data Engineer"
                value={form.jobTitle}
                onChange={(event) => setForm({ ...form, jobTitle: event.target.value })}
              />
            </Field>
            <Field label="Secteur d’activité" error={fieldErrors.sectorCategoryId}>
              <select
                required
                value={form.sectorCategoryId}
                onChange={(event) => setForm({ ...form, sectorCategoryId: event.target.value })}
              >
                <option value="">Choisir…</option>
                {sectors.map((sector) => (
                  <option key={sector.id} value={sector.id}>
                    {sector.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Pays d’emploi" error={fieldErrors.employmentCountryCode}>
              <input
                required
                maxLength={2}
                value={form.employmentCountryCode}
                onChange={(event) =>
                  setForm({ ...form, employmentCountryCode: event.target.value.toUpperCase() })
                }
              />
            </Field>
            <Field label="Début de l’activité" hint="Facultatif">
              <input
                type="date"
                value={form.startedOn}
                onChange={(event) => setForm({ ...form, startedOn: event.target.value })}
              />
            </Field>
          </div>
        </fieldset>

        <fieldset>
          <legend>Le relevé</legend>
          <div className={styles.fieldGrid}>
            <Field label="Date d’observation" error={fieldErrors.observedOn}>
              <input
                required
                type="date"
                value={form.observedOn}
                onChange={(event) => setForm({ ...form, observedOn: event.target.value })}
              />
            </Field>
            <Field label="Salaire fixe annuel" hint="Brut · équivalent temps plein">
              <div className={styles.moneyInput}>
                <input
                  required
                  type="number"
                  min="0"
                  step="1"
                  value={form.fixedCompensationEuros}
                  onChange={(event) =>
                    setForm({ ...form, fixedCompensationEuros: event.target.value })
                  }
                />
                <span>€</span>
              </div>
            </Field>
          </div>
          <label className={styles.checkRow}>
            <input
              type="checkbox"
              checked={form.variableCompensationKnown}
              onChange={(event) =>
                setForm({ ...form, variableCompensationKnown: event.target.checked })
              }
            />
            <span>Je connais ma part variable annuelle</span>
          </label>
          {form.variableCompensationKnown && (
            <Field label="Part variable annuelle" error={fieldErrors.variableCompensationEuros}>
              <div className={styles.moneyInput}>
                <input
                  required
                  type="number"
                  min="0"
                  step="1"
                  value={form.variableCompensationEuros}
                  onChange={(event) =>
                    setForm({ ...form, variableCompensationEuros: event.target.value })
                  }
                />
                <span>€</span>
              </div>
            </Field>
          )}
          <div className={styles.baseline}>
            <span>Base de comparaison</span>
            <strong>Temps plein · 35 h / semaine · EUR</strong>
          </div>
        </fieldset>

        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.actions}>
          {editingId && (
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm());
              }}
            >
              Annuler
            </button>
          )}
          <button type="submit" className={styles.primaryButton} disabled={saving}>
            {saving
              ? "Enregistrement…"
              : editingId
                ? "Enregistrer la correction"
                : "Ajouter l’activité"}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </form>

      <section className={styles.registry} aria-labelledby="registry-title">
        <div className={styles.registryHeading}>
          <p>Registre personnel</p>
          <h2 id="registry-title">Votre activité</h2>
          <span>{activities.length === 0 ? "Aucun relevé" : "À jour aujourd’hui"}</span>
        </div>
        {activities.length === 0 ? (
          <div className={styles.emptyState}>
            <span aria-hidden="true">↗</span>
            <p>Votre première activité apparaîtra ici dès son enregistrement.</p>
          </div>
        ) : (
          activities.map((activity) => (
            <article className={styles.activityCard} key={activity.id}>
              <div className={styles.activityTopline}>
                <span>
                  {relationLabels[activity.employmentRelation] ?? activity.employmentRelation}
                </span>
                <time dateTime={activity.currentSnapshot.observedOn}>
                  Relevé du {formatDate(activity.currentSnapshot.observedOn)}
                </time>
              </div>
              <h3>{activity.jobTitle}</h3>
              <p>
                {activity.occupation.label} · {activity.domain.label}
              </p>
              <dl>
                <div>
                  <dt>Fixe</dt>
                  <dd>{formatEuros(activity.currentSnapshot.fixedCompensationEuros)}</dd>
                </div>
                <div>
                  <dt>Variable</dt>
                  <dd>
                    {activity.currentSnapshot.variableCompensationKnown
                      ? formatEuros(activity.currentSnapshot.variableCompensationEuros ?? 0)
                      : "Non renseigné"}
                  </dd>
                </div>
                <div>
                  <dt>Référence</dt>
                  <dd>
                    {activity.currentSnapshot.workRatioPercent} % ·{" "}
                    {activity.currentSnapshot.weeklyHours} h
                  </dd>
                </div>
              </dl>
              <footer>
                <button type="button" onClick={() => editActivity(activity)}>
                  Corriger
                </button>
                <button type="button" onClick={() => void deleteActivity(activity)}>
                  Supprimer
                </button>
              </footer>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  wide = false,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={wide ? styles.wideField : undefined}>
      <span>
        {label}
        {hint && <small>{hint}</small>}
      </span>
      {children}
      {error && <em>{error}</em>}
    </label>
  );
}

function emptyForm(): ActivityForm {
  return {
    employmentRelation: "",
    domainCategoryId: "",
    occupationCategoryId: "",
    jobTitle: "",
    sectorCategoryId: "",
    employmentCountryCode: "FR",
    startedOn: "",
    observedOn: new Date().toISOString().slice(0, 10),
    fixedCompensationEuros: "",
    variableCompensationKnown: false,
    variableCompensationEuros: "",
  };
}

function readCookie(name: string): string {
  const prefix = `${name}=`;
  return (
    document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(prefix))
      ?.slice(prefix.length) ?? ""
  );
}

function messageFrom(value: unknown): string {
  return value instanceof Error ? value.message : "Une erreur est survenue.";
}

function formatEuros(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
    new Date(`${value}T12:00:00`),
  );
}
