"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import type { Idea, IdeaFormData } from "@/types";
import styles from "./IdeaBox.module.css";

export default function IdeaBox() {
  const { token } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<IdeaFormData>({
    title: "",
    description: "",
  });

  const fetchIdeas = useCallback(async () => {
    if (!token) return;

    try {
      const res = await fetch("/api/ideas", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch ideas");
      const data = (await res.json()) as { ideas: Idea[] };
      setIdeas(data.ideas);
    } catch (err) {
      console.error("Error fetching ideas:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !formData.title.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error: string };
        throw new Error(data.error || "Failed to submit idea");
      }

      const data = (await res.json()) as { idea: Idea };
      setIdeas([data.idea, ...ideas]);
      setFormData({ title: "", description: "" });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error submitting idea");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (ideaId: string) => {
    if (!token) return;

    try {
      const res = await fetch(`/api/ideas/${ideaId}/vote`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = (await res.json()) as { error: string };
        throw new Error(data.error || "Failed to vote");
      }

      const data = (await res.json()) as { idea: Idea | null };
      if (data.idea) {
        setIdeas(
          ideas
            .map((idea) => (idea.id === ideaId ? data.idea : idea))
            .filter((idea): idea is Idea => idea !== null),
        );
      }
    } catch (err) {
      console.error("Error voting:", err);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Boîte à Idées</h3>
        <Button variant="text" size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? "—" : "+"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            placeholder="Titre de l'idée..."
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className={styles.input}
            maxLength={200}
            required
          />
          <textarea
            placeholder="Description (optionnel)..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className={styles.textarea}
            maxLength={2000}
            rows={3}
          />
          {error && <p className={styles.error}>{error}</p>}
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className={styles.submitBtn}
          >
            {isSubmitting ? "Envoi..." : "Soumettre"}
          </Button>
        </form>
      )}

      {isLoading ? (
        <div className={styles.loading}>Chargement...</div>
      ) : ideas.length === 0 ? (
        <p className={styles.empty}>Aucune idée soumise. Soyez le premier !</p>
      ) : (
        <ul className={styles.list}>
          {ideas.map((idea) => (
            <li key={idea.id} className={styles.ideaItem}>
              <div className={styles.ideaContent}>
                <span className={styles.ideaTitle}>{idea.title}</span>
                {idea.description && <span className={styles.ideaDesc}>{idea.description}</span>}
                <span className={styles.ideaDate}>{formatDate(idea.created_at)}</span>
              </div>
              <button
                className={`${styles.voteBtn} ${idea.userHasVoted ? styles.voted : ""}`}
                onClick={() => !idea.userHasVoted && handleVote(idea.id)}
                disabled={idea.userHasVoted}
                aria-label={idea.userHasVoted ? "Déjà voted" : "Voter pour cette idée"}
              >
                <span className={styles.voteCount}>{idea.upvotes}</span>
                <span className={styles.voteIcon}>▲</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
