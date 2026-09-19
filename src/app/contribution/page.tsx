import { NilLogo } from "@/components/ui/NilLogo";
import ActivityEditor from "@/features/activities/ActivityEditor";

import styles from "./page.module.css";

export default function ContributionPage() {
  return (
    <main className={styles.page}>
      <aside className={styles.sidebar}>
        <NilLogo priority size="compact" />
        <nav aria-label="Progression de la contribution">
          <a href="/profil">
            <span>01</span> Profil
          </a>
          <a href="/contribution" aria-current="page">
            <span>02</span> Activité
          </a>
          <span>
            <b>03</b> Rémunération détaillée
          </span>
          <span>
            <b>04</b> Avantages
          </span>
        </nav>
        <p>
          Votre relevé reste privé. Il alimente uniquement les repères agrégés de la communauté.
        </p>
        <a className={styles.homeLink} href="/">
          ← Retour à l’accueil
        </a>
      </aside>

      <div className={styles.content}>
        <header className={styles.header}>
          <div>
            <p>Espace personnel · Contribution</p>
            <h1>
              Votre activité, <em>aujourd’hui.</em>
            </h1>
          </div>
          <span>Étape 2 sur 4</span>
        </header>
        <ActivityEditor />
      </div>
    </main>
  );
}
