import { useState } from "react";
import { z } from "zod";
import peepalLogo from "@/assets/peepal-logo.png";

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email").max(255),
  displayName: z.string().trim().max(50).optional(),
});

interface LoginScreenProps {
  onStart: (email: string, displayName: string) => void;
  onViewLeaderboard: () => void;
}

const LoginScreen = ({ onStart, onViewLeaderboard }: LoginScreenProps) => {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const result = loginSchema.safeParse({ email, displayName: displayName || undefined });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }
    onStart(email.trim(), displayName.trim() || email.split("@")[0]);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <img
        src={peepalLogo}
        alt="Peepal - 20 Years of Trust"
        className="mb-12 h-24 w-auto animate-float"
      />

      <h2 className="mb-8 font-display text-2xl font-bold tracking-wider text-primary">
        Block Stacking Challenge
      </h2>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg border border-border bg-card p-8"
      >
        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Email Address *
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="mb-6 w-full rounded-md border border-border bg-input px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />

        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Display Name (Optional)
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name for the leaderboard"
          className="mb-6 w-full rounded-md border border-border bg-input px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />

        {error && (
          <p className="mb-4 text-sm text-destructive">{error}</p>
        )}

        <button
          type="submit"
          className="w-full rounded-md bg-primary py-4 font-display text-lg font-bold uppercase tracking-wider text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98]"
        >
          Start Playing 🎯
        </button>
      </form>

      <button
        onClick={onViewLeaderboard}
        className="mt-6 font-body text-primary transition-colors hover:brightness-125"
      >
        🏆 View Leaderboard
      </button>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Stack blocks as high as you can • Best score wins!
      </p>
    </div>
  );
};

export default LoginScreen;
