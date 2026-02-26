import { useState } from "react";
import LoginScreen from "@/components/LoginScreen";
import BlockGame from "@/components/BlockGame";
import Leaderboard from "@/components/Leaderboard";

type Screen = "login" | "game" | "leaderboard";

const Index = () => {
  const [screen, setScreen] = useState<Screen>("login");
  const [playerEmail, setPlayerEmail] = useState("");
  const [playerName, setPlayerName] = useState("");

  const handleStart = (email: string, name: string) => {
    setPlayerEmail(email);
    setPlayerName(name);
    setScreen("game");
  };

  if (screen === "leaderboard") {
    return <Leaderboard onBack={() => setScreen("login")} />;
  }

  if (screen === "game") {
    return (
      <BlockGame
        email={playerEmail}
        displayName={playerName}
        onBack={() => setScreen("login")}
        onViewLeaderboard={() => setScreen("leaderboard")}
      />
    );
  }

  return (
    <LoginScreen
      onStart={handleStart}
      onViewLeaderboard={() => setScreen("leaderboard")}
    />
  );
};

export default Index;
