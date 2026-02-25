import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import peepalLogo from "@/assets/peepal-logo.png";

interface LeaderboardEntry {
  email: string;
  display_name: string | null;
  best_score: number;
}

interface LeaderboardProps {
  onBack: () => void;
}

const Leaderboard = ({ onBack }: LeaderboardProps) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScores = async () => {
      const { data } = await supabase
        .from("scores")
        .select("email, display_name, score")
        .order("score", { ascending: false });

      if (data) {
        // Group by email, keep best score
        const bestScores = new Map<string, LeaderboardEntry>();
        for (const row of data) {
          const existing = bestScores.get(row.email);
          if (!existing || row.score > existing.best_score) {
            bestScores.set(row.email, {
              email: row.email,
              display_name: row.display_name,
              best_score: row.score,
            });
          }
        }
        const sorted = Array.from(bestScores.values()).sort(
          (a, b) => b.best_score - a.best_score
        );
        setEntries(sorted);
      }
      setLoading(false);
    };
    fetchScores();
  }, []);

  const getMedal = (i: number) => {
    if (i === 0) return "🥇";
    if (i === 1) return "🥈";
    if (i === 2) return "🥉";
    return `#${i + 1}`;
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 py-8">
      <img src={peepalLogo} alt="Peepal" className="mb-6 h-16 w-auto" />
      <h1 className="mb-8 font-display text-3xl font-bold text-primary">
        Leaderboard
      </h1>

      <div className="w-full max-w-lg">
        {loading ? (
          <p className="text-center text-muted-foreground">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No scores yet. Be the first!
          </p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, i) => (
              <div
                key={entry.email}
                className={`flex items-center justify-between rounded-md border px-4 py-3 ${
                  i < 3
                    ? "border-primary/40 bg-primary/10"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-10 text-center font-display text-lg">
                    {getMedal(i)}
                  </span>
                  <span className="font-body text-foreground">
                    {entry.display_name || entry.email.split("@")[0]}
                  </span>
                </div>
                <span className="font-display text-lg font-bold text-primary">
                  {entry.best_score}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onBack}
        className="mt-8 rounded-md border border-border px-6 py-2 font-body text-foreground transition-colors hover:bg-secondary"
      >
        ← Back
      </button>
    </div>
  );
};

export default Leaderboard;
