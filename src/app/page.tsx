import { NilLogo } from "@/components/ui/NilLogo";

import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.current} aria-hidden="true" />

      <header className={styles.header}>
        <NilLogo priority />
        <span>Réseau alumni</span>
      </header>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>Une nouvelle expérience se prépare</p>
        <h1>
          Les parcours
          <em>continuent.</em>
        </h1>
        <p className={styles.introduction}>
          NIL construit un espace permettant à chaque alumni de tenir sa situation professionnelle à
          jour et de mieux comprendre les trajectoires de la communauté.
        </p>

        {process.env.NODE_ENV !== "production" && (
          <a className={styles.prototypeLink} href="/prototype/alumni/cockpit-clair?variant=E">
            Consulter la direction retenue
          </a>
        )}
      </section>

      <footer className={styles.footer}>
        <span>Panorama des carrières</span>
        <span>Données anonymisées · confidentialité dès la conception</span>
      </footer>
    </main>
  );
}
