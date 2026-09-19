import { NilLogo } from "@/components/ui/NilLogo";
import ProfileEditor from "@/features/profile/ProfileEditor";

import styles from "./page.module.css";

export default function ProfilePage() {
  return (
    <main className={styles.page}>
      <aside className={styles.sidebar}>
        <NilLogo priority size="compact" />
        <div className={styles.marker} aria-hidden="true">
          <span>Mon profil</span>
        </div>
        <p>
          Votre parcours reste le vôtre. Vous choisissez ce que vous complétez et quand vous le
          mettez à jour.
        </p>
        <a href="/">← Retour à l’accueil</a>
      </aside>

      <div className={styles.content}>
        <header className={styles.header}>
          <p>Espace personnel · Profil alumni</p>
          <h1>
            Quelques repères, <em>à votre rythme.</em>
          </h1>
          <span>Les préférences de contact restent privées dans cette version.</span>
        </header>
        <ProfileEditor />
      </div>
    </main>
  );
}
