"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import PrototypeSwitcher, {
  PROTOTYPE_STATES,
  PROTOTYPE_VARIANTS,
  PROTOTYPE_VIEWS,
  type PrototypeState,
  type PrototypeVariant,
  type PrototypeView,
} from "./PrototypeSwitcher";
import styles from "./AlumniPrototype.module.css";

/**
 * PROTOTYPE JETABLE — trois directions de l’expérience alumni V1,
 * partageables avec ?variant=A|B|C&view=...&state=...
 */

const career = {
  name: "Sophie Martin",
  initials: "SM",
  graduation: "Promotion 2018",
  title: "Lead Data Engineer",
  employer: "CHU de Lille",
  domain: "Données et IA",
  sector: "Santé · Hôpital",
  salary: "57 800 €",
  total: "62 400 €",
  evolution: "+8,6 %",
  sample: "54 alumni",
  updated: "Actualisé le 18 juillet 2026",
};

const stateCopy: Record<PrototypeState, { title: string; detail: string }> = {
  default: {
    title: "Données complètes",
    detail: "Situation confirmée il y a 12 jours.",
  },
  empty: {
    title: "Profil à commencer",
    detail: "Ajoutez une première activité professionnelle pour débloquer votre cockpit.",
  },
  loading: {
    title: "Chargement des données",
    detail: "Les informations sont simulées avec un état de chargement.",
  },
  error: {
    title: "Données momentanément indisponibles",
    detail: "Votre contribution est conservée. Réessayez dans quelques instants.",
  },
  historical: {
    title: "Référence historique",
    detail: "Ce segment ne dispose pas encore de trois situations actuelles.",
  },
  suppressed: {
    title: "Confidentialité appliquée",
    detail: "Les valeurs sont masquées car moins de trois alumni correspondent.",
  },
};

function isVariant(value: string | null): value is PrototypeVariant {
  return PROTOTYPE_VARIANTS.some((item) => item.key === value);
}

function isView(value: string | null): value is PrototypeView {
  return PROTOTYPE_VIEWS.some((item) => item.key === value);
}

function isState(value: string | null): value is PrototypeState {
  return PROTOTYPE_STATES.some((item) => item.key === value);
}

function PrototypeLogo({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className={styles.logoLockup}>
      <span className={inverse ? styles.logoMarkInverse : styles.logoMark}>
        <Image src="/logo.svg" alt="" width={28} height={28} />
      </span>
      <span>
        <b>Alumni</b>
        <small>Panorama des carrières</small>
      </span>
    </span>
  );
}

function Value({
  state,
  children,
  privateValue = false,
}: {
  state: PrototypeState;
  children: React.ReactNode;
  privateValue?: boolean;
}) {
  if (state === "loading") return <span className={styles.inlineSkeleton} />;
  if (state === "empty") return <span>—</span>;
  if (state === "suppressed" && privateValue) {
    return <span className={styles.maskedValue}>Masqué · &lt; 3</span>;
  }
  return children;
}

function StateBanner({ state, variant }: { state: PrototypeState; variant: PrototypeVariant }) {
  if (state === "default") return null;

  return (
    <div
      className={`${styles.stateBanner} ${styles[`state${state}`]} ${styles[`stateVariant${variant}`]}`}
      role={state === "error" ? "alert" : "status"}
    >
      <span>{state === "error" ? "!" : state === "loading" ? "…" : "i"}</span>
      <div>
        <strong>{stateCopy[state].title}</strong>
        <p>{stateCopy[state].detail}</p>
      </div>
    </div>
  );
}

function Sparkline({ tone = "gold" }: { tone?: "gold" | "mint" | "blue" }) {
  return (
    <svg className={styles.sparkline} viewBox="0 0 260 82" role="img" aria-label="Évolution">
      <path className={styles.sparkGrid} d="M0 65H260M0 40H260M0 15H260" />
      <path
        className={styles[`spark${tone}`]}
        d="M2 66 C28 65,38 50,62 54 S92 36,116 42 S148 17,172 29 S202 12,258 8"
      />
      <circle className={styles[`sparkDot${tone}`]} cx="258" cy="8" r="5" />
    </svg>
  );
}

function Bars({ compact = false }: { compact?: boolean }) {
  const bars = [42, 64, 52, 83, 71, 94, 78];
  return (
    <div className={compact ? styles.barsCompact : styles.bars} aria-label="Distribution simulée">
      {bars.map((height, index) => (
        <span key={`${height}-${index}`} style={{ height: `${height}%` }} />
      ))}
    </div>
  );
}

function VariantANavigation({ view }: { view: PrototypeView }) {
  return (
    <nav className={styles.aNav} aria-label="Navigation proposition A">
      {PROTOTYPE_VIEWS.filter((item) => item.key !== "public").map((item) => (
        <span key={item.key} className={view === item.key ? styles.aNavActive : undefined}>
          <i>{item.label.slice(0, 1)}</i>
          {item.label}
        </span>
      ))}
      <span className={styles.aNavSpacer} />
      <span>
        <i>?</i>Aide
      </span>
    </nav>
  );
}

function VariantAPublic({ state }: { state: PrototypeState }) {
  return (
    <div className={styles.aPublic}>
      <header className={styles.aPublicHeader}>
        <PrototypeLogo />
        <nav>
          <a href="#mission">Notre mission</a>
          <a href="#confidentialite">Confidentialité</a>
          <button type="button" className={styles.aGhostButton}>
            Se connecter
          </button>
        </nav>
      </header>
      <main className={styles.aHero}>
        <section>
          <span className={styles.aEyebrow}>La communauté, mieux informée</span>
          <h1>Votre parcours éclaire celui des autres.</h1>
          <p>
            Actualisez votre situation en quelques minutes et accédez à des repères de carrière
            fiables, construits par les alumni.
          </p>
          <div className={styles.aHeroActions}>
            <button type="button" className={styles.aPrimaryButton}>
              Activer mon compte
            </button>
            <button type="button" className={styles.aTextButton}>
              J’ai déjà un compte →
            </button>
          </div>
          <div className={styles.aTrustRow}>
            <span>✓ Gratuit pour l’association</span>
            <span>✓ Salaires individuels privés</span>
            <span>✓ Statistiques dès 3 alumni</span>
          </div>
        </section>
        <aside className={styles.aLoginCard}>
          <span className={styles.aLoginBadge}>Espace privé</span>
          <h2>Bienvenue</h2>
          <p>Connectez-vous avec l’adresse connue de l’association.</p>
          <label>
            Adresse email
            <input type="email" placeholder="vous@exemple.fr" />
          </label>
          <label>
            Mot de passe
            <input type="password" placeholder="••••••••••" />
          </label>
          <button type="button" className={styles.aPrimaryButton}>
            Se connecter
          </button>
          <a href="#forgot">Mot de passe oublié ?</a>
          <StateBanner state={state} variant="A" />
        </aside>
      </main>
      <section className={styles.aPublicStats} id="mission">
        <article>
          <strong>54</strong>
          <span>situations récentes en Données et IA</span>
        </article>
        <article>
          <strong>12 min</strong>
          <span>pour actualiser un parcours complet</span>
        </article>
        <article>
          <strong>100 %</strong>
          <span>des données individuelles restent privées</span>
        </article>
      </section>
    </div>
  );
}

function VariantACockpit({ state }: { state: PrototypeState }) {
  return (
    <VariantAShell view="cockpit" state={state}>
      <div className={styles.aPageHeading}>
        <div>
          <span className={styles.aEyebrow}>Bonjour Sophie</span>
          <h1>Votre situation en un coup d’œil</h1>
          <p>{career.updated} · Situation récente</p>
        </div>
        <button type="button" className={styles.aPrimaryButton}>
          Actualiser ma situation
        </button>
      </div>
      <StateBanner state={state} variant="A" />
      <div className={styles.aCockpitGrid}>
        <article className={styles.aSituationCard}>
          <div className={styles.aCardTop}>
            <span className={styles.aCardIcon}>↗</span>
            <span className={styles.aStatusPill}>Activité principale</span>
          </div>
          <h2>
            <Value state={state}>{career.title}</Value>
          </h2>
          <p>
            <Value state={state}>
              {career.employer} · {career.sector}
            </Value>
          </p>
          <dl className={styles.aSituationFacts}>
            <div>
              <dt>Fixe annuel</dt>
              <dd>
                <Value state={state} privateValue>
                  {career.salary}
                </Value>
              </dd>
            </div>
            <div>
              <dt>Total annuel</dt>
              <dd>
                <Value state={state} privateValue>
                  {career.total}
                </Value>
              </dd>
            </div>
          </dl>
          <button type="button" className={styles.aCardLink}>
            Voir le détail et l’historique →
          </button>
        </article>
        <article className={styles.aComparisonCard}>
          <div className={styles.aCardTop}>
            <span>
              <b>Votre évolution</b>
              <small>Depuis le relevé précédent</small>
            </span>
            <strong className={styles.aPositive}>
              <Value state={state} privateValue>
                {career.evolution}
              </Value>
            </strong>
          </div>
          <Sparkline />
          <p>
            Votre rémunération totale progresse plus vite que la médiane de votre groupe comparable.
          </p>
        </article>
        <article className={styles.aMetricCard}>
          <span>Médiane comparable</span>
          <strong>
            <Value state={state} privateValue>
              58 900 €
            </Value>
          </strong>
          <small>{career.sample} · France · 5–10 ans d’expérience</small>
        </article>
        <article className={styles.aMetricCard}>
          <span>Télétravail médian</span>
          <strong>
            <Value state={state} privateValue>
              2 jours
            </Value>
          </strong>
          <small>74 % des profils comparables sont hybrides</small>
        </article>
      </div>
    </VariantAShell>
  );
}

function VariantAContribution({ state }: { state: PrototypeState }) {
  return (
    <VariantAShell view="contribution" state={state}>
      <div className={styles.aPageHeading}>
        <div>
          <span className={styles.aEyebrow}>Étape 2 sur 4</span>
          <h1>Votre activité actuelle</h1>
          <p>Les champs marqués « facultatif » pourront être complétés plus tard.</p>
        </div>
        <span className={styles.aSaveState}>✓ Brouillon enregistré</span>
      </div>
      <div className={styles.aStepper}>
        <span className={styles.aStepDone}>
          1<span>Profil</span>
        </span>
        <span className={styles.aStepActive}>
          2<span>Activité</span>
        </span>
        <span>
          3<span>Rémunération</span>
        </span>
        <span>
          4<span>Avantages</span>
        </span>
      </div>
      <StateBanner state={state} variant="A" />
      <form className={styles.aFormCard}>
        <section>
          <h2>Votre métier</h2>
          <p>Sélectionnez une catégorie comparable, puis conservez votre intitulé réel.</p>
          <div className={styles.aFieldGrid}>
            <label>
              Domaine professionnel
              <select defaultValue="data">
                <option value="data">Données et IA</option>
              </select>
            </label>
            <label>
              Métier
              <select defaultValue="engineer">
                <option value="engineer">Data Engineer</option>
              </select>
            </label>
            <label className={styles.aWideField}>
              Intitulé de poste
              <input defaultValue="Lead Data Engineer" />
            </label>
          </div>
        </section>
        <section>
          <h2>Votre organisation employeuse</h2>
          <div className={styles.aFieldGrid}>
            <label>
              Nom <small>Facultatif</small>
              <input defaultValue="CHU de Lille" />
            </label>
            <label>
              Nature
              <select defaultValue="public">
                <option value="public">Organisme public</option>
              </select>
            </label>
            <label>
              Secteur d’activité
              <select defaultValue="hospital">
                <option value="hospital">Santé · Hôpital</option>
              </select>
            </label>
            <label>
              Effectif
              <select defaultValue="5000">
                <option value="5000">5 000 et plus</option>
              </select>
            </label>
          </div>
        </section>
        <footer>
          <button type="button" className={styles.aGhostButton}>
            Retour
          </button>
          <button type="button" className={styles.aPrimaryButton}>
            Continuer vers la rémunération
          </button>
        </footer>
      </form>
    </VariantAShell>
  );
}

function VariantAExplorer({ state }: { state: PrototypeState }) {
  return (
    <VariantAShell view="explorer" state={state}>
      <div className={styles.aPageHeading}>
        <div>
          <span className={styles.aEyebrow}>Explorateur</span>
          <h1>Comprendre les parcours alumni</h1>
          <p>Données actuelles · 214 alumni distincts</p>
        </div>
        <button type="button" className={styles.aGhostButton}>
          Exporter la vue
        </button>
      </div>
      <StateBanner state={state} variant="A" />
      <div className={styles.aExplorerLayout}>
        <aside className={styles.aFilters}>
          <div>
            <h2>Filtres</h2>
            <button type="button">Réinitialiser</button>
          </div>
          <label>
            Période
            <select defaultValue={state === "historical" ? "history" : "current"}>
              <option value="current">Situations actuelles</option>
              <option value="history">Historique</option>
            </select>
          </label>
          <label>
            Domaine professionnel
            <select defaultValue="data">
              <option value="data">Données et IA</option>
            </select>
          </label>
          <label>
            Expérience
            <select defaultValue="5-10">
              <option value="5-10">5 à 10 ans</option>
            </select>
          </label>
          <label>
            Géographie
            <select defaultValue="france">
              <option value="france">France entière</option>
            </select>
          </label>
          <div className={styles.aFilterSummary}>
            <span>Échantillon</span>
            <strong>
              <Value state={state} privateValue>
                54 alumni
              </Value>
            </strong>
          </div>
        </aside>
        <section className={styles.aExplorerContent}>
          <div className={styles.aTopicTabs}>
            <button type="button" className={styles.aTopicActive}>
              Rémunération
            </button>
            <button type="button">Métiers</button>
            <button type="button">Secteurs</button>
            <button type="button">Géographie</button>
            <button type="button">Avantages</button>
          </div>
          <div className={styles.aKpiRow}>
            {[
              ["Médiane", "58 900 €"],
              ["Moyenne", "61 240 €"],
              ["Total médian", "63 600 €"],
              ["Évolution", "+ 5,2 %"],
            ].map(([label, value]) => (
              <article key={label}>
                <span>{label}</span>
                <strong>
                  <Value state={state} privateValue>
                    {value}
                  </Value>
                </strong>
              </article>
            ))}
          </div>
          <article className={styles.aChartCard}>
            <div>
              <span>
                <b>Distribution de la rémunération totale</b>
                <small>Équivalent temps plein · annuel brut</small>
              </span>
              <span className={styles.aLegend}>● 2026</span>
            </div>
            <Bars />
            <p>
              La moitié des profils se situe entre 52 000 € et 71 000 €. La dispersion augmente
              après huit ans d’expérience.
            </p>
          </article>
        </section>
      </div>
    </VariantAShell>
  );
}

function VariantAAdmin({ state }: { state: PrototypeState }) {
  return (
    <VariantAShell view="admin" state={state}>
      <div className={styles.aPageHeading}>
        <div>
          <span className={styles.aEyebrow}>Administration</span>
          <h1>Superviser la communauté</h1>
          <p>Accès récemment vérifié · aucune rémunération individuelle accessible</p>
        </div>
        <button type="button" className={styles.aPrimaryButton}>
          Importer des adresses
        </button>
      </div>
      <StateBanner state={state} variant="A" />
      <div className={styles.aAdminMetrics}>
        <article>
          <span>Comptes actifs</span>
          <strong>184</strong>
          <small>+23 ce mois</small>
        </article>
        <article>
          <span>À inviter</span>
          <strong>72</strong>
          <small>Prochaine campagne : 12 août</small>
        </article>
        <article>
          <span>Rappels éligibles</span>
          <strong>31</strong>
          <small>Limite : 20 par jour</small>
        </article>
        <article>
          <span>Propositions à qualifier</span>
          <strong>8</strong>
          <small>3 nouvelles cette semaine</small>
        </article>
      </div>
      <div className={styles.aAdminGrid}>
        <section className={styles.aAdminList}>
          <div>
            <h2>Envois à venir</h2>
            <button type="button">Tout voir</button>
          </div>
          {[
            ["Invitations", "12 août · 09:00", "25 destinataires", "Planifié"],
            ["Rappels de profil", "13 août · 09:00", "20 destinataires", "Automatique"],
            ["Relance invitation", "26 août · 09:00", "18 destinataires", "Planifié"],
          ].map((row) => (
            <article key={row[0]}>
              <span className={styles.aListIcon}>✉</span>
              <span>
                <b>{row[0]}</b>
                <small>{row[1]}</small>
              </span>
              <span>
                <b>{row[2]}</b>
                <small>{row[3]}</small>
              </span>
            </article>
          ))}
        </section>
        <section className={styles.aAdminList}>
          <div>
            <h2>Actions requises</h2>
            <button type="button">Traiter</button>
          </div>
          {[
            ["Taxonomie", "Budget mobilité", "À qualifier"],
            ["Suppression", "Échéance dans 18 jours", "1 demande"],
            ["Import", "4 adresses invalides", "À vérifier"],
          ].map((row) => (
            <article key={row[1]}>
              <span className={styles.aListIcon}>!</span>
              <span>
                <b>{row[0]}</b>
                <small>{row[1]}</small>
              </span>
              <span className={styles.aStatusPill}>{row[2]}</span>
            </article>
          ))}
        </section>
      </div>
    </VariantAShell>
  );
}

function VariantAShell({
  view,
  state: _state,
  children,
}: {
  view: PrototypeView;
  state: PrototypeState;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.variantA}>
      <header className={styles.aTopbar}>
        <PrototypeLogo />
        <div className={styles.aTopActions}>
          <button type="button" aria-label="Notifications">
            ●
          </button>
          <span className={styles.aAvatar}>{career.initials}</span>
          <span>
            <b>{career.name}</b>
            <small>{career.graduation}</small>
          </span>
        </div>
      </header>
      <div className={styles.aShellBody}>
        <VariantANavigation view={view} />
        <main className={styles.aMain}>{children}</main>
      </div>
    </div>
  );
}

function VariantB({ view, state }: { view: PrototypeView; state: PrototypeState }) {
  const content = {
    public: <VariantBPublic state={state} />,
    cockpit: <VariantBCockpit state={state} />,
    contribution: <VariantBContribution state={state} />,
    explorer: <VariantBExplorer state={state} />,
    admin: <VariantBAdmin state={state} />,
  }[view];

  return <div className={styles.variantB}>{content}</div>;
}

function BHeader({ section }: { section: string }) {
  return (
    <header className={styles.bHeader}>
      <PrototypeLogo inverse />
      <span className={styles.bSection}>{section}</span>
      <nav>
        <span>Le rapport</span>
        <span>Contribuer</span>
        <span className={styles.bMonogram}>SM</span>
      </nav>
    </header>
  );
}

function VariantBPublic({ state }: { state: PrototypeState }) {
  return (
    <>
      <BHeader section="Édition 2026" />
      <main className={styles.bPublic}>
        <section className={styles.bPublicLead}>
          <span className={styles.bKicker}>Le panorama vivant des carrières alumni</span>
          <h1>Une promotion ne s’arrête pas au diplôme.</h1>
          <p>
            Elle évolue, bifurque et progresse. Racontez votre situation aujourd’hui pour donner à
            chacun un repère plus juste demain.
          </p>
          <button type="button" className={styles.bPrimary}>
            Commencer mon actualisation ↗
          </button>
          <div className={styles.bIssueLine}>
            <span>N° 01</span>
            <span>Actualisé par la communauté</span>
            <span>Données privées, enseignements partagés</span>
          </div>
        </section>
        <aside className={styles.bLoginPanel}>
          <span className={styles.bNumber}>01</span>
          <div>
            <span className={styles.bKicker}>Espace alumni</span>
            <h2>Reprendre le fil.</h2>
            <p>Votre adresse et votre mot de passe suffisent après la première activation.</p>
          </div>
          <label>
            Email
            <input placeholder="vous@exemple.fr" />
          </label>
          <label>
            Mot de passe
            <input type="password" placeholder="••••••••" />
          </label>
          <button type="button" className={styles.bPrimary}>
            Entrer dans le rapport
          </button>
          <button type="button" className={styles.bLink}>
            Première connexion ? Activer mon compte
          </button>
          <StateBanner state={state} variant="B" />
        </aside>
      </main>
      <footer className={styles.bPublicFooter}>
        <strong>3</strong>
        <span>alumni minimum avant toute publication statistique</span>
        <strong>36</strong>
        <span>mois avant qu’une situation devienne historique</span>
      </footer>
    </>
  );
}

function BShell({ section, children }: { section: string; children: React.ReactNode }) {
  return (
    <>
      <BHeader section={section} />
      <main className={styles.bMain}>{children}</main>
    </>
  );
}

function VariantBCockpit({ state }: { state: PrototypeState }) {
  return (
    <BShell section="Mon récit professionnel">
      <StateBanner state={state} variant="B" />
      <section className={styles.bIntro}>
        <span className={styles.bChapter}>Chapitre actuel · {career.updated}</span>
        <h1>Sophie, votre trajectoire a pris de l’élan.</h1>
        <p>
          Votre rémunération totale a progressé de {career.evolution}. Vous êtes proche du centre de
          votre groupe comparable, avec un variable légèrement supérieur.
        </p>
      </section>
      <div className={styles.bStoryGrid}>
        <article className={styles.bCurrentStory}>
          <span className={styles.bNumber}>01</span>
          <div>
            <span className={styles.bKicker}>Situation actuelle</span>
            <h2>
              <Value state={state}>{career.title}</Value>
            </h2>
            <p>
              <Value state={state}>
                {career.employer} · {career.sector}
              </Value>
            </p>
            <dl>
              <div>
                <dt>Rémunération totale</dt>
                <dd>
                  <Value state={state} privateValue>
                    {career.total}
                  </Value>
                </dd>
              </div>
              <div>
                <dt>Organisation du travail</dt>
                <dd>
                  <Value state={state}>Hybride · 2 jours</Value>
                </dd>
              </div>
              <div>
                <dt>Dernière confirmation</dt>
                <dd>
                  <Value state={state}>18 juillet 2026</Value>
                </dd>
              </div>
            </dl>
            <button type="button" className={styles.bPrimary}>
              Confirmer ou actualiser ↗
            </button>
          </div>
        </article>
        <article className={styles.bQuoteCard}>
          <span className={styles.bKicker}>Lecture communautaire</span>
          <blockquote>
            « Les profils Données et IA progressent de 5,2 % cette année, avec un écart qui se
            creuse après huit ans d’expérience. »
          </blockquote>
          <span>{career.sample} dans le groupe comparable</span>
        </article>
      </div>
      <section className={styles.bEvolution}>
        <div>
          <span className={styles.bChapter}>Votre évolution · 2021—2026</span>
          <h2>Une progression régulière, puis une accélération.</h2>
          <p>Le passage à une responsabilité Lead explique l’essentiel du dernier mouvement.</p>
        </div>
        <Sparkline tone="mint" />
      </section>
    </BShell>
  );
}

function VariantBContribution({ state }: { state: PrototypeState }) {
  return (
    <BShell section="Contribuer">
      <StateBanner state={state} variant="B" />
      <div className={styles.bFormLayout}>
        <aside>
          <span className={styles.bChapter}>02 · Activité professionnelle</span>
          <h1>Décrivez ce que vous faites, avec vos mots.</h1>
          <p>
            Nous vous aiderons à relier votre intitulé réel à un métier comparable. Les précisions
            facultatives peuvent attendre.
          </p>
          <ol>
            <li className={styles.bDone}>
              Profil stable <span>Terminé</span>
            </li>
            <li className={styles.bActive}>
              Activité actuelle <span>En cours</span>
            </li>
            <li>
              Rémunération <span>À venir</span>
            </li>
            <li>
              Avantages <span>À venir</span>
            </li>
          </ol>
        </aside>
        <form className={styles.bForm}>
          <span className={styles.bKicker}>Commençons par l’essentiel</span>
          <label>
            Quel est votre intitulé de poste ?
            <input defaultValue="Lead Data Engineer" />
            <small>Gardez le libellé utilisé par votre organisation.</small>
          </label>
          <div className={styles.bFormPair}>
            <label>
              Dans quel domaine ?
              <select defaultValue="data">
                <option value="data">Données et IA</option>
              </select>
            </label>
            <label>
              Quel métier s’en rapproche ?
              <select defaultValue="engineer">
                <option value="engineer">Data Engineer</option>
              </select>
            </label>
          </div>
          <label>
            Pour quelle organisation ? <small>Facultatif</small>
            <input defaultValue="CHU de Lille" />
          </label>
          <div className={styles.bFormPair}>
            <label>
              Nature
              <select defaultValue="public">
                <option value="public">Organisme public</option>
              </select>
            </label>
            <label>
              Secteur d’activité
              <select defaultValue="hospital">
                <option value="hospital">Santé · Hôpital</option>
              </select>
            </label>
          </div>
          <footer>
            <button type="button" className={styles.bLink}>
              Retour
            </button>
            <button type="button" className={styles.bPrimary}>
              Continuer ↗
            </button>
          </footer>
        </form>
      </div>
    </BShell>
  );
}

function VariantBExplorer({ state }: { state: PrototypeState }) {
  return (
    <BShell section="Le rapport">
      <StateBanner state={state} variant="B" />
      <div className={styles.bReportHeading}>
        <span className={styles.bChapter}>Rémunération · Données et IA · France</span>
        <h1>La médiane progresse, les trajectoires se diversifient.</h1>
        <p>
          Lecture des situations {state === "historical" ? "historiques" : "actuelles"} de 54 alumni
          entre cinq et dix ans d’expérience.
        </p>
        <button type="button" className={styles.bFilterButton}>
          Modifier le segment · 4 filtres
        </button>
      </div>
      <section className={styles.bKeyFinding}>
        <span className={styles.bNumber}>58,9</span>
        <div>
          <span className={styles.bKicker}>Médiane annuelle · milliers d’euros</span>
          <h2>
            <Value state={state} privateValue>
              La moitié du groupe se situe entre 52 k€ et 71 k€.
            </Value>
          </h2>
          <p>La moyenne atteint 61,2 k€. Le variable médian représente 7,4 % du total.</p>
        </div>
      </section>
      <section className={styles.bReportVisual}>
        <div>
          <span className={styles.bChapter}>Distribution</span>
          <h2>Un centre compact, puis davantage de dispersion.</h2>
          <p>
            Les responsabilités Lead et Manager expliquent une part importante des écarts supérieurs
            à 70 k€.
          </p>
        </div>
        <Bars />
      </section>
      <nav className={styles.bChapters}>
        <span className={styles.bActive}>01 Rémunération</span>
        <span>02 Métiers</span>
        <span>03 Secteurs</span>
        <span>04 Géographie</span>
        <span>05 Avantages</span>
      </nav>
    </BShell>
  );
}

function VariantBAdmin({ state }: { state: PrototypeState }) {
  return (
    <BShell section="Administration">
      <StateBanner state={state} variant="B" />
      <div className={styles.bAdminHeading}>
        <span className={styles.bChapter}>Journal du 30 juillet 2026</span>
        <h1>Trois décisions demandent votre attention.</h1>
        <p>Les campagnes suivent leur cours. Le quota transactionnel reste préservé.</p>
      </div>
      <section className={styles.bDecisionList}>
        {[
          [
            "01",
            "Qualifier « Budget mobilité »",
            "8 saisies proches · Avantages",
            "Ouvrir la proposition",
          ],
          [
            "02",
            "Traiter une demande de suppression",
            "Échéance dans 18 jours",
            "Examiner la demande",
          ],
          [
            "03",
            "Corriger quatre adresses importées",
            "Lot du 29 juillet · 96 % valide",
            "Voir le rapport",
          ],
        ].map((item) => (
          <article key={item[0]}>
            <span className={styles.bNumber}>{item[0]}</span>
            <div>
              <h2>{item[1]}</h2>
              <p>{item[2]}</p>
            </div>
            <button type="button" className={styles.bLink}>
              {item[3]} ↗
            </button>
          </article>
        ))}
      </section>
      <section className={styles.bDispatchStory}>
        <div>
          <span className={styles.bKicker}>Prochaine séquence</span>
          <h2>25 invitations mardi, puis 20 rappels mercredi.</h2>
          <p>20 emails restent réservés chaque jour aux activations et récupérations.</p>
        </div>
        <dl>
          <div>
            <dt>Comptes actifs</dt>
            <dd>184</dd>
          </div>
          <div>
            <dt>À inviter</dt>
            <dd>72</dd>
          </div>
          <div>
            <dt>Rappels éligibles</dt>
            <dd>31</dd>
          </div>
        </dl>
      </section>
    </BShell>
  );
}

function VariantC({ view, state }: { view: PrototypeView; state: PrototypeState }) {
  return (
    <div className={styles.variantC}>
      <header className={styles.cTopbar}>
        <PrototypeLogo inverse />
        <div className={styles.cSearch}>⌕ Rechercher une vue, un filtre, une action…</div>
        <span className={styles.cEnvironment}>DONNÉES 2026.07</span>
        <span className={styles.cAvatar}>SM</span>
      </header>
      <aside className={styles.cRail}>
        <span className={view === "cockpit" ? styles.cRailActive : undefined}>
          ⌂<small>Accueil</small>
        </span>
        <span className={view === "contribution" ? styles.cRailActive : undefined}>
          ＋<small>Saisir</small>
        </span>
        <span className={view === "explorer" ? styles.cRailActive : undefined}>
          ⌁<small>Explorer</small>
        </span>
        <span className={view === "admin" ? styles.cRailActive : undefined}>
          ⚙<small>Admin</small>
        </span>
      </aside>
      <main className={styles.cMain}>
        <StateBanner state={state} variant="C" />
        {view === "public" && <VariantCPublic state={state} />}
        {view === "cockpit" && <VariantCCockpit state={state} />}
        {view === "contribution" && <VariantCContribution state={state} />}
        {view === "explorer" && <VariantCExplorer state={state} />}
        {view === "admin" && <VariantCAdmin state={state} />}
      </main>
      <footer className={styles.cStatusbar}>
        <span>
          <i className={styles.cOnline} /> Service opérationnel
        </span>
        <span>Confidentialité : seuil 3</span>
        <span>Dernière synchro : 14:32</span>
      </footer>
    </div>
  );
}

function CHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: string }) {
  return (
    <div className={styles.cHeading}>
      <div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
      </div>
      {action && (
        <button type="button" className={styles.cAccentButton}>
          {action}
        </button>
      )}
    </div>
  );
}

function VariantCPublic({ state }: { state: PrototypeState }) {
  return (
    <div className={styles.cPublic}>
      <CHeading eyebrow="ACCÈS COMMUNAUTAIRE" title="Panorama des carrières alumni" />
      <div className={styles.cPublicGrid}>
        <section className={styles.cAccessPanel}>
          <div className={styles.cAccessHero}>
            <span className={styles.cCode}>PRIVATE_DATA / SHARED_INSIGHT</span>
            <h2>
              Des repères fiables.
              <br />
              Des individus protégés.
            </h2>
            <p>
              Connectez votre situation au panorama, sans jamais exposer votre salaire individuel.
            </p>
          </div>
          <div className={styles.cLockedPreview}>
            <div>
              <span>MÉDIANE DATA</span>
              <strong>•• ••• €</strong>
            </div>
            <div>
              <span>ÉVOLUTION</span>
              <strong>+ •,• %</strong>
            </div>
            <div>
              <span>ÉCHANTILLON</span>
              <strong>AUTH REQUISE</strong>
            </div>
            <Bars compact />
          </div>
        </section>
        <form className={styles.cLogin}>
          <span className={styles.cPanelLabel}>AUTHENTIFICATION</span>
          <h2>Ouvrir une session</h2>
          <label>
            EMAIL
            <input placeholder="vous@exemple.fr" />
          </label>
          <label>
            MOT DE PASSE
            <input type="password" placeholder="••••••••" />
          </label>
          <button type="button" className={styles.cAccentButton}>
            CONNEXION →
          </button>
          <button type="button" className={styles.cSecondaryButton}>
            ACTIVER UN COMPTE
          </button>
          <small>Session chiffrée · expiration après 15 mois d’inactivité</small>
          <StateBanner state={state} variant="C" />
        </form>
      </div>
      <section className={styles.cFeatureStrip}>
        <span>
          <b>01</b> Mettre à jour ma situation
        </span>
        <span>
          <b>02</b> Comparer sans exposer
        </span>
        <span>
          <b>03</b> Explorer les trajectoires
        </span>
      </section>
    </div>
  );
}

function VariantCCockpit({ state }: { state: PrototypeState }) {
  return (
    <>
      <CHeading
        eyebrow="TABLEAU DE BORD / SOPHIE MARTIN"
        title="Situation actuelle"
        action="+ ACTUALISER"
      />
      <div className={styles.cToolbar}>
        <span>
          PÉRIODE <b>2026</b>
        </span>
        <span>
          ACTIVITÉ <b>PRINCIPALE</b>
        </span>
        <span>
          FRAÎCHEUR <b className={styles.cGood}>RÉCENTE</b>
        </span>
      </div>
      <div className={styles.cDashboard}>
        <section className={styles.cProfilePanel}>
          <span className={styles.cPanelLabel}>PROFIL ACTUEL</span>
          <div className={styles.cIdentity}>
            <span className={styles.cLargeAvatar}>SM</span>
            <div>
              <h2>
                <Value state={state}>{career.title}</Value>
              </h2>
              <p>
                <Value state={state}>{career.employer}</Value>
              </p>
            </div>
          </div>
          <table>
            <tbody>
              <tr>
                <th>Domaine</th>
                <td>
                  <Value state={state}>{career.domain}</Value>
                </td>
              </tr>
              <tr>
                <th>Secteur</th>
                <td>
                  <Value state={state}>{career.sector}</Value>
                </td>
              </tr>
              <tr>
                <th>Organisation</th>
                <td>
                  <Value state={state}>Public · 5 000+</Value>
                </td>
              </tr>
              <tr>
                <th>Travail</th>
                <td>
                  <Value state={state}>Hybride · 2 j/sem.</Value>
                </td>
              </tr>
            </tbody>
          </table>
          <button type="button" className={styles.cSecondaryButton}>
            OUVRIR L’HISTORIQUE
          </button>
        </section>
        <section className={styles.cMetricMatrix}>
          {[
            ["FIXE", career.salary, "P50 : 54 200 €"],
            ["TOTAL", career.total, "P50 : 58 900 €"],
            ["ÉVOLUTION", career.evolution, "Groupe : +5,2 %"],
            ["ÉCHANTILLON", "54", "Alumni distincts"],
          ].map((item) => (
            <article key={item[0]}>
              <span>{item[0]}</span>
              <strong>
                <Value state={state} privateValue>
                  {item[1]}
                </Value>
              </strong>
              <small>{item[2]}</small>
            </article>
          ))}
          <article className={styles.cWideMetric}>
            <span>TRAJECTOIRE 2021—2026</span>
            <Sparkline tone="blue" />
          </article>
        </section>
        <section className={styles.cInsightFeed}>
          <span className={styles.cPanelLabel}>SIGNAUX</span>
          <article>
            <i>↑</i>
            <div>
              <b>Progression supérieure</b>
              <p>+3,4 points face au groupe comparable</p>
            </div>
          </article>
          <article>
            <i>=</i>
            <div>
              <b>Position centrale</b>
              <p>Votre total se situe entre P50 et P75</p>
            </div>
          </article>
          <article>
            <i>!</i>
            <div>
              <b>À compléter</b>
              <p>Ajoutez la valeur de vos tickets restaurant</p>
            </div>
          </article>
        </section>
      </div>
    </>
  );
}

function VariantCContribution({ state }: { state: PrototypeState }) {
  return (
    <>
      <CHeading
        eyebrow="CONTRIBUTION / ACTIVITÉ 01"
        title="Éditer l’activité actuelle"
        action="ENREGISTRER"
      />
      <div className={styles.cToolbar}>
        <span className={styles.cGood}>● SAUVEGARDE AUTO</span>
        <span>
          COMPLÉTION <b>68 %</b>
        </span>
        <span>
          CHAMPS REQUIS <b>9/11</b>
        </span>
      </div>
      <div className={styles.cFormWorkspace}>
        <aside className={styles.cOutline}>
          <span className={styles.cPanelLabel}>SECTIONS</span>
          <b className={styles.cOutlineActive}>
            01 Métier <i>✓</i>
          </b>
          <b>
            02 Organisation <i>✓</i>
          </b>
          <b>
            03 Localisation <i>4/5</i>
          </b>
          <b>
            04 Rémunération <i>3/4</i>
          </b>
          <b>
            05 Avantages <i>2/6</i>
          </b>
          <div>
            <span>DERNIÈRE VERSION</span>
            <small>18/07/2026 · 14:32</small>
          </div>
        </aside>
        <form className={styles.cDenseForm}>
          <section>
            <span className={styles.cPanelLabel}>01 / MÉTIER ET RESPONSABILITÉ</span>
            <div className={styles.cThreeFields}>
              <label>
                DOMAINE
                <select defaultValue="data">
                  <option value="data">Données et IA</option>
                </select>
              </label>
              <label>
                MÉTIER
                <select defaultValue="engineer">
                  <option value="engineer">Data Engineer</option>
                </select>
              </label>
              <label>
                SÉNIORITÉ
                <select defaultValue="senior">
                  <option value="senior">Senior</option>
                </select>
              </label>
            </div>
            <label>
              INTITULÉ DE POSTE
              <input defaultValue="Lead Data Engineer" />
            </label>
            <div className={styles.cThreeFields}>
              <label>
                RESPONSABILITÉ
                <select defaultValue="lead">
                  <option value="lead">Lead</option>
                </select>
              </label>
              <label>
                TAILLE D’ÉQUIPE
                <select defaultValue="5-9">
                  <option value="5-9">5 à 9 personnes</option>
                </select>
              </label>
              <label>
                EXPÉRIENCE MÉTIER
                <input defaultValue="7 ans" />
              </label>
            </div>
          </section>
          <section>
            <span className={styles.cPanelLabel}>02 / ORGANISATION EMPLOYEUSE</span>
            <div className={styles.cThreeFields}>
              <label>
                NOM · FACULTATIF
                <input defaultValue="CHU de Lille" />
              </label>
              <label>
                NATURE
                <select defaultValue="public">
                  <option value="public">Organisme public</option>
                </select>
              </label>
              <label>
                EFFECTIF
                <select defaultValue="5000">
                  <option value="5000">5 000 et plus</option>
                </select>
              </label>
            </div>
            <label>
              SECTEUR D’ACTIVITÉ
              <select defaultValue="hospital">
                <option value="hospital">Santé · Hôpital</option>
              </select>
            </label>
          </section>
        </form>
        <aside className={styles.cDataPreview}>
          <span className={styles.cPanelLabel}>APERÇU NORMALISÉ</span>
          <code>
            domain: data_ai
            <br />
            occupation: data_engineer
            <br />
            responsibility: lead
            <br />
            nature: public
            <br />
            sector: health_hospital
            <br />
            confidence: exact
          </code>
          <p>Ces catégories alimentent les comparaisons. Votre intitulé original reste conservé.</p>
          <StateBanner state={state} variant="C" />
        </aside>
      </div>
    </>
  );
}

function VariantCExplorer({ state }: { state: PrototypeState }) {
  return (
    <>
      <CHeading
        eyebrow="EXPLORATEUR / RÉMUNÉRATION"
        title="Analyse multi-dimensionnelle"
        action="SAUVER LA VUE"
      />
      <div className={styles.cExplorer}>
        <aside className={styles.cFilterRail}>
          <span className={styles.cPanelLabel}>FILTRES ACTIFS · 4</span>
          <label>
            PÉRIODE
            <select defaultValue={state === "historical" ? "history" : "current"}>
              <option value="current">Situations actuelles</option>
              <option value="history">Historique</option>
            </select>
          </label>
          <label>
            DOMAINE
            <select defaultValue="data">
              <option value="data">Données et IA</option>
            </select>
          </label>
          <label>
            EXPÉRIENCE
            <select defaultValue="5-10">
              <option value="5-10">5 à 10 ans</option>
            </select>
          </label>
          <label>
            PAYS
            <select defaultValue="fr">
              <option value="fr">France</option>
            </select>
          </label>
          <label>
            MESURE
            <select defaultValue="fte">
              <option value="fte">Équivalent temps plein</option>
            </select>
          </label>
          <button type="button" className={styles.cSecondaryButton}>
            RÉINITIALISER
          </button>
          <div className={styles.cSampleBox}>
            <span>ÉCHANTILLON</span>
            <strong>
              <Value state={state} privateValue>
                54
              </Value>
            </strong>
            <small>alumni distincts</small>
          </div>
        </aside>
        <section className={styles.cAnalysis}>
          <nav className={styles.cDataTabs}>
            <b>RÉMUNÉRATION</b>
            <span>MÉTIERS</span>
            <span>SECTEURS</span>
            <span>GÉOGRAPHIE</span>
            <span>AVANTAGES</span>
          </nav>
          <div className={styles.cKpis}>
            {[
              ["MÉDIANE", "58 900 €", "P50"],
              ["MOYENNE", "61 240 €", "μ"],
              ["TOTAL", "63 600 €", "FIXE + VAR."],
              ["ÉVOLUTION", "+5,2 %", "12 MOIS"],
            ].map((item) => (
              <article key={item[0]}>
                <span>
                  {item[0]} <i>{item[2]}</i>
                </span>
                <strong>
                  <Value state={state} privateValue>
                    {item[1]}
                  </Value>
                </strong>
              </article>
            ))}
          </div>
          <div className={styles.cChartGrid}>
            <article className={styles.cMainChart}>
              <header>
                <span>
                  <b>DISTRIBUTION</b>
                  <small>Rémunération totale annuelle</small>
                </span>
                <span>UNITÉ · EUR</span>
              </header>
              <Bars />
              <footer>
                <span>30K</span>
                <span>45K</span>
                <span>60K</span>
                <span>75K</span>
                <span>90K+</span>
              </footer>
            </article>
            <article className={styles.cInterpretation}>
              <span className={styles.cPanelLabel}>INTERPRÉTATION</span>
              <h2>Dispersion contenue jusqu’à 70 k€.</h2>
              <p>
                Les responsabilités Lead et Manager sont surreprésentées dans le quart supérieur.
              </p>
              <div>
                <span>CONFIANCE</span>
                <b className={styles.cGood}>ÉLEVÉE</b>
              </div>
              <div>
                <span>FRAÎCHEUR</span>
                <b>87 % &lt; 12 MOIS</b>
              </div>
            </article>
          </div>
          <div className={styles.cResultTable}>
            <span>MÉTIER</span>
            <span>N</span>
            <span>MÉDIANE</span>
            <span>ÉVOLUTION</span>
            <b>Data Engineer</b>
            <b>21</b>
            <b>
              <Value state={state} privateValue>
                61 200 €
              </Value>
            </b>
            <b className={styles.cGood}>+6,1 %</b>
            <b>Data Analyst</b>
            <b>18</b>
            <b>
              <Value state={state} privateValue>
                52 800 €
              </Value>
            </b>
            <b className={styles.cGood}>+4,2 %</b>
            <b>Data Scientist</b>
            <b>15</b>
            <b>
              <Value state={state} privateValue>
                64 100 €
              </Value>
            </b>
            <b className={styles.cGood}>+5,4 %</b>
          </div>
        </section>
      </div>
    </>
  );
}

function VariantCAdmin({ state }: { state: PrototypeState }) {
  return (
    <>
      <CHeading
        eyebrow="ADMINISTRATION / OPÉRATIONS"
        title="Centre de contrôle"
        action="+ IMPORTER"
      />
      <div className={styles.cToolbar}>
        <span className={styles.cGood}>● AUTOMATISMES ACTIFS</span>
        <span>
          QUOTA DU JOUR <b>36 / 100</b>
        </span>
        <span>
          RÉSERVE <b>20</b>
        </span>
      </div>
      <div className={styles.cAdminLayout}>
        <section className={styles.cOpsTable}>
          <header>
            <b>FILE D’OPÉRATIONS</b>
            <button type="button">FILTRES · 2</button>
          </header>
          <div className={styles.cOpsHead}>
            <span>PRIORITÉ</span>
            <span>TYPE</span>
            <span>DÉTAIL</span>
            <span>ÉCHÉANCE</span>
            <span>STATUT</span>
          </div>
          {[
            ["P1", "Suppression", "1 compte", "17 août", "À traiter"],
            ["P2", "Taxonomie", "8 propositions", "—", "En attente"],
            ["P3", "Invitations", "25 destinataires", "12 août", "Planifié"],
            ["P3", "Rappels", "20 destinataires", "13 août", "Automatique"],
            ["P4", "Import", "4 anomalies / 102", "—", "À vérifier"],
          ].map((row) => (
            <article key={`${row[1]}-${row[2]}`}>
              <span className={row[0] === "P1" ? styles.cCritical : undefined}>{row[0]}</span>
              <b>{row[1]}</b>
              <span>{row[2]}</span>
              <span>{row[3]}</span>
              <span>{row[4]}</span>
            </article>
          ))}
        </section>
        <aside className={styles.cAdminSide}>
          <section>
            <span className={styles.cPanelLabel}>COMPTES</span>
            <dl>
              <div>
                <dt>Actifs</dt>
                <dd>184</dd>
              </div>
              <div>
                <dt>Éligibles</dt>
                <dd>72</dd>
              </div>
              <div>
                <dt>Suspendus</dt>
                <dd>2</dd>
              </div>
            </dl>
          </section>
          <section>
            <span className={styles.cPanelLabel}>EMAILS / JOUR</span>
            <div className={styles.cQuotaBar}>
              <i style={{ width: "36%" }} />
            </div>
            <p>36 envoyés · 44 disponibles · 20 réservés</p>
          </section>
          <section>
            <span className={styles.cPanelLabel}>ACCÈS ADMIN</span>
            <p>Réauthentifié il y a 8 minutes.</p>
            <b className={styles.cGood}>SESSION SENSIBLE VALIDE</b>
          </section>
          <StateBanner state={state} variant="C" />
        </aside>
      </div>
    </>
  );
}

export default function AlumniPrototype() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const variantParam = searchParams.get("variant");
  const viewParam = searchParams.get("view");
  const stateParam = searchParams.get("state");
  const variant: PrototypeVariant = isVariant(variantParam) ? variantParam : "A";
  const view: PrototypeView = isView(viewParam) ? viewParam : "cockpit";
  const state: PrototypeState = isState(stateParam) ? stateParam : "default";

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className={styles.prototypeRoot}>
      {variant === "A" &&
        (view === "public" ? (
          <VariantAPublic state={state} />
        ) : view === "cockpit" ? (
          <VariantACockpit state={state} />
        ) : view === "contribution" ? (
          <VariantAContribution state={state} />
        ) : view === "explorer" ? (
          <VariantAExplorer state={state} />
        ) : (
          <VariantAAdmin state={state} />
        ))}
      {variant === "B" && <VariantB view={view} state={state} />}
      {variant === "C" && <VariantC view={view} state={state} />}

      <PrototypeSwitcher
        variant={variant}
        view={view}
        state={state}
        onVariantChange={(next) => updateParam("variant", next)}
        onViewChange={(next) => updateParam("view", next)}
        onStateChange={(next) => updateParam("state", next)}
      />
    </div>
  );
}
