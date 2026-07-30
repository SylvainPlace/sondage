"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import styles from "./ClearCockpitPrototype.module.css";

/**
 * PROTOTYPE JETABLE — trois variantes d’un cockpit alumni clair, moins
 * générique, partageables avec ?variant=A|B|C.
 */

const variants = [
  { key: "A", label: "Carnet de promotion" },
  { key: "B", label: "Registre de carrière" },
  { key: "C", label: "Panthéon" },
] as const;

type VariantKey = (typeof variants)[number]["key"];

const career = {
  name: "Sophie Martin",
  initials: "SM",
  graduation: "Promotion 2018",
  title: "Lead Data Engineer",
  employer: "CHU de Lille",
  domain: "Données et IA",
  sector: "Santé",
  organization: "Organisme public · 5 000+",
  workMode: "Hybride · 2 jours à distance",
  salary: "57 800 €",
  total: "62 400 €",
  median: "58 900 €",
  evolution: "+8,6 %",
  sample: "54 alumni",
  updated: "18 juillet 2026",
};

function isVariant(value: string | null): value is VariantKey {
  return variants.some((variant) => variant.key === value);
}

function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className={`${styles.brand} ${inverse ? styles.brandInverse : ""}`}>
      <span className={styles.brandMark}>
        <Image src="/logo.svg" alt="" width={34} height={24} />
      </span>
      <span>
        <strong>Alumni</strong>
        <small>Panorama des carrières</small>
      </span>
    </span>
  );
}

function CareerCurve({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 420 116" role="img" aria-label="Évolution depuis 2021">
      <path d="M4 94H416M4 57H416M4 20H416" className={styles.curveGrid} />
      <path
        d="M6 92 C52 90 68 76 108 80 S166 57 205 63 S258 37 302 43 S357 19 414 17"
        className={styles.curveLine}
      />
      <circle cx="414" cy="17" r="5" className={styles.curveDot} />
    </svg>
  );
}

function CarnetCockpit() {
  return (
    <div className={styles.carnet}>
      <header className={styles.carnetHeader}>
        <Brand />
        <nav aria-label="Navigation du carnet">
          <a href="#situation" className={styles.carnetNavActive}>
            Ma situation
          </a>
          <a href="#parcours">Mon parcours</a>
          <a href="#explorer">Explorer</a>
        </nav>
        <span className={styles.carnetIdentity}>
          <b>{career.initials}</b>
          <span>
            {career.name}
            <small>{career.graduation}</small>
          </span>
        </span>
      </header>

      <main className={styles.carnetMain}>
        <section className={styles.carnetIntro}>
          <div>
            <span className={styles.carnetKicker}>Votre carnet professionnel</span>
            <h1>Bonjour Sophie.</h1>
            <p>Votre situation est à jour. Voici ce qui a changé depuis votre dernier passage.</p>
          </div>
          <button type="button">Actualiser ma situation</button>
        </section>

        <section className={styles.carnetFreshness} aria-label="Fraîcheur du profil">
          <span>
            <i aria-hidden="true" />
            Confirmé le {career.updated}
          </span>
          <span>Activité principale</span>
          <span>France</span>
          <span>Temps plein</span>
        </section>

        <div className={styles.carnetColumns}>
          <article className={styles.carnetSituation} id="situation">
            <header>
              <span>Situation actuelle</span>
              <small>{career.domain}</small>
            </header>
            <h2>{career.title}</h2>
            <p className={styles.carnetEmployer}>
              {career.employer} · {career.sector}
            </p>

            <dl className={styles.carnetLedger}>
              <div>
                <dt>Rémunération fixe</dt>
                <dd>{career.salary}</dd>
              </div>
              <div>
                <dt>Rémunération totale</dt>
                <dd>{career.total}</dd>
              </div>
              <div>
                <dt>Organisation</dt>
                <dd>{career.organization}</dd>
              </div>
              <div>
                <dt>Organisation du travail</dt>
                <dd>{career.workMode}</dd>
              </div>
            </dl>

            <button type="button" className={styles.textAction}>
              Consulter les relevés précédents
            </button>
          </article>

          <aside className={styles.carnetComparison}>
            <header>
              <span>Repère de promotion</span>
              <small>{career.sample} comparables</small>
            </header>
            <p className={styles.carnetDelta}>
              <b>{career.evolution}</b>
              <span>depuis votre relevé précédent</span>
            </p>
            <CareerCurve className={styles.carnetCurve} />
            <p className={styles.carnetReading}>
              Votre total progresse plus vite que celui des alumni ayant un parcours comparable. Il
              reste proche de la médiane de <strong>{career.median}</strong>.
            </p>
          </aside>
        </div>

        <section className={styles.carnetFooterGrid}>
          <div>
            <span className={styles.carnetKicker}>Ce qui a changé</span>
            <p>
              Passage au niveau Lead et hausse de 4 900 € de la rémunération totale depuis 2025.
            </p>
          </div>
          <div>
            <span className={styles.carnetKicker}>À compléter</span>
            <p>La valeur annuelle des tickets restaurant manque encore à votre relevé.</p>
          </div>
        </section>
      </main>
    </div>
  );
}

function RegistreCockpit() {
  return (
    <div className={styles.registre}>
      <header className={styles.registreHeader}>
        <Brand />
        <span>Registre alumni · mise à jour continue</span>
        <nav aria-label="Navigation du registre">
          <a href="#registre" className={styles.registreNavActive}>
            Situation
          </a>
          <a href="#historique">Historique</a>
          <a href="#analyse">Analyse</a>
        </nav>
      </header>

      <main className={styles.registreMain} id="registre">
        <aside className={styles.registreProfile}>
          <span className={styles.registrePortrait}>{career.initials}</span>
          <h2>{career.name}</h2>
          <p>{career.graduation}</p>
          <dl>
            <div>
              <dt>Dernière confirmation</dt>
              <dd>{career.updated}</dd>
            </div>
            <div>
              <dt>Complétude</dt>
              <dd>92 %</dd>
            </div>
            <div>
              <dt>Visibilité</dt>
              <dd>Statistiques anonymisées</dd>
            </div>
          </dl>
          <button type="button">Modifier mon relevé</button>
        </aside>

        <div className={styles.registreContent}>
          <section className={styles.registreTitle}>
            <div>
              <span>Situation professionnelle</span>
              <h1>{career.title}</h1>
              <p>
                {career.employer} · {career.sector}
              </p>
            </div>
            <span className={styles.registreStatus}>À JOUR</span>
          </section>

          <section className={styles.registreFacts} aria-label="Données principales">
            <div>
              <span>Fixe annuel</span>
              <strong>{career.salary}</strong>
            </div>
            <div>
              <span>Total annuel</span>
              <strong>{career.total}</strong>
            </div>
            <div>
              <span>Évolution</span>
              <strong>{career.evolution}</strong>
            </div>
            <div>
              <span>Référence</span>
              <strong>{career.median}</strong>
            </div>
          </section>

          <div className={styles.registreBody}>
            <section className={styles.registreHistory} id="historique">
              <header>
                <h2>Parcours récent</h2>
                <button type="button">Voir tout l’historique</button>
              </header>
              <ol>
                <li>
                  <time>2026</time>
                  <div>
                    <strong>Lead Data Engineer</strong>
                    <span>CHU de Lille</span>
                    <small>Responsabilité Lead ajoutée · total +8,6 %</small>
                  </div>
                </li>
                <li>
                  <time>2023</time>
                  <div>
                    <strong>Data Engineer</strong>
                    <span>CHU de Lille</span>
                    <small>Prise de poste dans le secteur public</small>
                  </div>
                </li>
                <li>
                  <time>2021</time>
                  <div>
                    <strong>Data Analyst</strong>
                    <span>Entreprise privée · Lille</span>
                    <small>Premier relevé enregistré</small>
                  </div>
                </li>
              </ol>
            </section>

            <aside className={styles.registreAnalysis} id="analyse">
              <span>Lecture comparative</span>
              <strong>Position centrale</strong>
              <p>
                Votre rémunération totale se situe entre la médiane et le troisième quartile du
                groupe comparable.
              </p>
              <CareerCurve className={styles.registreCurve} />
              <small>{career.sample} · France · 5 à 10 ans d’expérience</small>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

function PantheonCockpit() {
  return (
    <div className={styles.pantheon}>
      <header className={styles.pantheonHeader}>
        <Brand inverse />
        <span className={styles.hieroglyphBand} aria-hidden="true">
          𓅓 𓂀 𓋹 𓇳 𓆣 𓅓 𓂀
        </span>
        <nav aria-label="Navigation du panthéon">
          <a href="#stela" className={styles.pantheonNavActive}>
            Ma stèle
          </a>
          <a href="#chronique">Chronique</a>
          <a href="#panorama">Panorama</a>
        </nav>
      </header>

      <main className={styles.pantheonMain}>
        <section className={styles.pantheonTitle}>
          <div>
            <span>Panthéon des parcours · {career.graduation}</span>
            <h1>La situation de Sophie</h1>
            <p>Un relevé vivant de son activité, de son évolution et de ses repères.</p>
          </div>
          <button type="button">Actualiser le relevé</button>
        </section>

        <div className={styles.pantheonLayout}>
          <aside className={styles.cartouche} aria-label="Cartouche professionnel">
            <span className={styles.cartoucheGlyph} aria-hidden="true">
              𓂀
            </span>
            <span className={styles.cartoucheInitials}>{career.initials}</span>
            <strong>{career.name}</strong>
            <small>{career.graduation}</small>
            <i aria-hidden="true" />
            <span>Relevé confirmé</span>
            <b>{career.updated}</b>
          </aside>

          <article className={styles.stela} id="stela">
            <section className={styles.stelaRegister}>
              <header>
                <span aria-hidden="true">𓅓</span>
                <small>Registre de l’activité</small>
              </header>
              <div className={styles.stelaActivity}>
                <div>
                  <h2>{career.title}</h2>
                  <p>
                    {career.employer} · {career.sector}
                  </p>
                </div>
                <dl>
                  <div>
                    <dt>Domaine professionnel</dt>
                    <dd>{career.domain}</dd>
                  </div>
                  <div>
                    <dt>Organisation</dt>
                    <dd>{career.organization}</dd>
                  </div>
                  <div>
                    <dt>Travail</dt>
                    <dd>{career.workMode}</dd>
                  </div>
                </dl>
              </div>
            </section>

            <section className={styles.stelaRegister}>
              <header>
                <span aria-hidden="true">𓋹</span>
                <small>Registre des ressources</small>
              </header>
              <dl className={styles.pantheonNumbers}>
                <div>
                  <dt>Fixe annuel</dt>
                  <dd>{career.salary}</dd>
                </div>
                <div>
                  <dt>Total annuel</dt>
                  <dd>{career.total}</dd>
                </div>
                <div>
                  <dt>Évolution</dt>
                  <dd>{career.evolution}</dd>
                </div>
                <div>
                  <dt>Médiane comparable</dt>
                  <dd>{career.median}</dd>
                </div>
              </dl>
            </section>

            <section className={styles.stelaRegister} id="panorama">
              <header>
                <span aria-hidden="true">𓇳</span>
                <small>Registre du panorama</small>
              </header>
              <div className={styles.pantheonComparison}>
                <CareerCurve className={styles.pantheonCurve} />
                <div>
                  <strong>Une progression au-dessus du groupe</strong>
                  <p>
                    Depuis 2025, le total de Sophie progresse de 3,4 points de plus que celui des
                    alumni comparables.
                  </p>
                  <small>{career.sample} distincts dans ce segment</small>
                </div>
              </div>
            </section>
          </article>
        </div>

        <section className={styles.pantheonChronicle} id="chronique">
          <span aria-hidden="true">𓆣</span>
          <div>
            <small>Chronique du dernier changement</small>
            <p>
              En 2026, Sophie devient Lead tout en restant au CHU de Lille. Sa rémunération totale
              passe de 57 500 € à 62 400 €.
            </p>
          </div>
          <button type="button">Ouvrir l’historique</button>
        </section>
      </main>
    </div>
  );
}

function VariantSwitcher({
  variant,
  onChange,
}: {
  variant: VariantKey;
  onChange: (next: VariantKey) => void;
}) {
  const currentIndex = variants.findIndex((item) => item.key === variant);

  const cycle = (direction: -1 | 1) => {
    const nextIndex = (currentIndex + direction + variants.length) % variants.length;
    const next = variants[nextIndex];
    if (next) onChange(next.key);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }

      if (event.key === "ArrowLeft") cycle(-1);
      if (event.key === "ArrowRight") cycle(1);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  if (process.env.NODE_ENV === "production") return null;

  const current = variants[currentIndex];

  return (
    <aside className={styles.switcher} aria-label="Variantes du cockpit clair">
      <button type="button" onClick={() => cycle(-1)} aria-label="Variante précédente">
        ←
      </button>
      <strong>
        {current?.key} — {current?.label}
      </strong>
      <button type="button" onClick={() => cycle(1)} aria-label="Variante suivante">
        →
      </button>
    </aside>
  );
}

export default function ClearCockpitPrototype() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const variantParam = searchParams.get("variant");
  const variant: VariantKey = isVariant(variantParam) ? variantParam : "A";

  const updateVariant = (next: VariantKey) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("variant", next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className={styles.prototypeRoot}>
      {variant === "A" && <CarnetCockpit />}
      {variant === "B" && <RegistreCockpit />}
      {variant === "C" && <PantheonCockpit />}
      <VariantSwitcher variant={variant} onChange={updateVariant} />
    </div>
  );
}
