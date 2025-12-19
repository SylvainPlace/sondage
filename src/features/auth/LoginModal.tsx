"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import styles from "./LoginModal.module.css";

interface LoginModalProps {
  onSuccess?: (token: string) => void;
}

export default function LoginModal({ onSuccess }: LoginModalProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur de connexion");
      }

      login(data.token);
      if (onSuccess) {
        onSuccess(data.token);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erreur inconnue";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <h2 className={styles.title}>🔐 Accès Restreint</h2>
        <p className={styles.text}>
          Veuillez vous identifier pour accéder aux données.
        </p>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              type="email"
              id="email"
              required
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              required
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            style={{ width: "100%", padding: "0.75rem" }}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </Button>
          {error && <div className={styles.error}>{error}</div>}
        </form>
      </div>
    </div>
  );
}
