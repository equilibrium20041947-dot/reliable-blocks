import { useRef, useEffect, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import peepalLogo from "@/assets/peepal-logo.png";

interface BlockGameProps {
  email: string;
  displayName: string;
  onBack: () => void;
  onViewLeaderboard: () => void;
}

interface Block {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

interface FallingPiece {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  vy: number;
  vx: number;
  rotation: number;
  rotationSpeed: number;
}

const BLOCK_HEIGHT = 28;
const INITIAL_WIDTH = 200;
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;

const getBlockColor = (i: number) => {
  const hue = (30 + i * 8) % 360;
  return `hsl(${hue}, 80%, 55%)`;
};

const BlockGame = ({ email, displayName, onBack, onViewLeaderboard }: BlockGameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef({
    stack: [] as Block[],
    fallingPieces: [] as FallingPiece[],
    currentBlock: null as Block | null,
    direction: 1,
    speed: 2,
    score: 0,
    streak: 0,
    gameOver: false,
    cameraY: 0,
    targetCameraY: 0,
    shakeAmount: 0,
    started: false,
    scoreSubmitted: false,
    bonusTexts: [] as { text: string; x: number; y: number; life: number }[],
  });
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const animRef = useRef<number>(0);

  const initGame = useCallback(() => {
    const gs = gameStateRef.current;
    const baseBlock: Block = {
      x: (CANVAS_WIDTH - INITIAL_WIDTH) / 2,
      y: CANVAS_HEIGHT - BLOCK_HEIGHT - 20,
      width: INITIAL_WIDTH,
      height: BLOCK_HEIGHT,
      color: getBlockColor(0),
    };
    gs.stack = [baseBlock];
    gs.fallingPieces = [];
    gs.score = 0;
    gs.streak = 0;
    gs.gameOver = false;
    gs.cameraY = 0;
    gs.targetCameraY = 0;
    gs.shakeAmount = 0;
    gs.started = false;
    gs.scoreSubmitted = false;
    gs.bonusTexts = [];
    gs.speed = 2;
    gs.direction = 1;
    spawnBlock(gs);
    setScore(0);
    setStreak(0);
    setGameOver(false);
  }, []);

  const spawnBlock = (gs: typeof gameStateRef.current) => {
    const lastBlock = gs.stack[gs.stack.length - 1];
    const newBlock: Block = {
      x: 0,
      y: lastBlock.y - BLOCK_HEIGHT,
      width: lastBlock.width,
      height: BLOCK_HEIGHT,
      color: getBlockColor(gs.stack.length),
    };
    gs.currentBlock = newBlock;
    gs.direction = 1;
    gs.speed = Math.min(2 + gs.stack.length * 0.15, 8);
    gs.started = true;
  };

  const placeBlock = useCallback(async () => {
    const gs = gameStateRef.current;
    if (!gs.currentBlock || gs.gameOver) return;

    const current = gs.currentBlock;
    const lastBlock = gs.stack[gs.stack.length - 1];

    const overlapLeft = Math.max(current.x, lastBlock.x);
    const overlapRight = Math.min(
      current.x + current.width,
      lastBlock.x + lastBlock.width
    );
    const overlapWidth = overlapRight - overlapLeft;

    if (overlapWidth <= 0) {
      // Miss — block falls
      gs.fallingPieces.push({
        x: current.x,
        y: current.y,
        width: current.width,
        height: current.height,
        color: current.color,
        vy: 0,
        vx: gs.direction * 2,
        rotation: 0,
        rotationSpeed: gs.direction * 0.05,
      });
      gs.gameOver = true;
      gs.currentBlock = null;
      gs.shakeAmount = 10;
      setGameOver(true);

      // Submit score
      if (!gs.scoreSubmitted) {
        gs.scoreSubmitted = true;
        await supabase.from("scores").insert({
          email,
          display_name: displayName,
          score: gs.score,
        });
      }
      return;
    }

    const isPerfect = Math.abs(overlapWidth - lastBlock.width) < 2;

    if (isPerfect) {
      // Perfect placement
      const placed: Block = {
        x: lastBlock.x,
        y: current.y,
        width: lastBlock.width,
        height: BLOCK_HEIGHT,
        color: current.color,
      };
      gs.stack.push(placed);
      gs.streak++;
      gs.score += 1 + gs.streak;
      gs.shakeAmount = 3;
      gs.bonusTexts.push({
        text: gs.streak > 1 ? `PERFECT x${gs.streak}!` : "PERFECT!",
        x: placed.x + placed.width / 2,
        y: placed.y,
        life: 60,
      });
    } else {
      // Partial overlap
      const placed: Block = {
        x: overlapLeft,
        y: current.y,
        width: overlapWidth,
        height: BLOCK_HEIGHT,
        color: current.color,
      };
      gs.stack.push(placed);

      // Create falling overhang piece
      if (current.x < lastBlock.x) {
        gs.fallingPieces.push({
          x: current.x,
          y: current.y,
          width: lastBlock.x - current.x,
          height: BLOCK_HEIGHT,
          color: current.color,
          vy: 0,
          vx: -1.5,
          rotation: 0,
          rotationSpeed: -0.03,
        });
      }
      if (current.x + current.width > lastBlock.x + lastBlock.width) {
        gs.fallingPieces.push({
          x: lastBlock.x + lastBlock.width,
          y: current.y,
          width: current.x + current.width - (lastBlock.x + lastBlock.width),
          height: BLOCK_HEIGHT,
          color: current.color,
          vy: 0,
          vx: 1.5,
          rotation: 0,
          rotationSpeed: 0.03,
        });
      }

      gs.streak = 0;
      gs.score += 1;
      gs.shakeAmount = 2;
    }

    setScore(gs.score);
    setStreak(gs.streak);

    // Camera tracking
    if (gs.stack.length > 10) {
      gs.targetCameraY = (gs.stack.length - 10) * BLOCK_HEIGHT;
    }

    spawnBlock(gs);
  }, [email, displayName]);

  useEffect(() => {
    initGame();

    const handleInput = (e: KeyboardEvent | MouseEvent | TouchEvent) => {
      if (e instanceof KeyboardEvent && e.key !== " ") return;
      e.preventDefault();
      if (gameStateRef.current.gameOver) {
        initGame();
      } else {
        placeBlock();
      }
    };

    window.addEventListener("keydown", handleInput);
    const canvas = canvasRef.current;
    canvas?.addEventListener("click", handleInput);
    canvas?.addEventListener("touchstart", handleInput, { passive: false });

    return () => {
      window.removeEventListener("keydown", handleInput);
      canvas?.removeEventListener("click", handleInput);
      canvas?.removeEventListener("touchstart", handleInput);
    };
  }, [initGame, placeBlock]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const render = () => {
      const gs = gameStateRef.current;
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Camera interpolation
      gs.cameraY += (gs.targetCameraY - gs.cameraY) * 0.08;

      // Shake decay
      const shakeX = gs.shakeAmount > 0 ? (Math.random() - 0.5) * gs.shakeAmount : 0;
      const shakeY = gs.shakeAmount > 0 ? (Math.random() - 0.5) * gs.shakeAmount : 0;
      gs.shakeAmount *= 0.9;

      ctx.save();
      ctx.translate(shakeX, shakeY + gs.cameraY);

      // Draw stack
      for (const block of gs.stack) {
        ctx.fillStyle = block.color;
        ctx.fillRect(block.x, block.y, block.width, block.height);
        ctx.strokeStyle = "rgba(0,0,0,0.3)";
        ctx.lineWidth = 1;
        ctx.strokeRect(block.x, block.y, block.width, block.height);
        // Highlight
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fillRect(block.x, block.y, block.width, block.height * 0.4);
      }

      // Draw current moving block
      if (gs.currentBlock && !gs.gameOver) {
        const cb = gs.currentBlock;
        // Move
        cb.x += gs.speed * gs.direction;
        if (cb.x + cb.width > CANVAS_WIDTH) {
          gs.direction = -1;
          cb.x = CANVAS_WIDTH - cb.width;
        }
        if (cb.x < 0) {
          gs.direction = 1;
          cb.x = 0;
        }

        ctx.globalAlpha = 0.7;
        ctx.fillStyle = cb.color;
        ctx.fillRect(cb.x, cb.y, cb.width, cb.height);
        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.lineWidth = 2;
        ctx.strokeRect(cb.x, cb.y, cb.width, cb.height);
        ctx.globalAlpha = 1;
      }

      // Draw falling pieces
      for (let i = gs.fallingPieces.length - 1; i >= 0; i--) {
        const fp = gs.fallingPieces[i];
        fp.vy += 0.4;
        fp.y += fp.vy;
        fp.x += fp.vx;
        fp.rotation += fp.rotationSpeed;

        ctx.save();
        ctx.translate(fp.x + fp.width / 2, fp.y + fp.height / 2);
        ctx.rotate(fp.rotation);
        ctx.globalAlpha = Math.max(0, 1 - fp.vy / 20);
        ctx.fillStyle = fp.color;
        ctx.fillRect(-fp.width / 2, -fp.height / 2, fp.width, fp.height);
        ctx.restore();

        if (fp.y > CANVAS_HEIGHT + 200) {
          gs.fallingPieces.splice(i, 1);
        }
      }

      // Draw bonus texts
      for (let i = gs.bonusTexts.length - 1; i >= 0; i--) {
        const bt = gs.bonusTexts[i];
        bt.y -= 1;
        bt.life--;
        ctx.globalAlpha = bt.life / 60;
        ctx.fillStyle = "#ff8800";
        ctx.font = "bold 18px Orbitron, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(bt.text, bt.x, bt.y);
        ctx.globalAlpha = 1;
        if (bt.life <= 0) gs.bonusTexts.splice(i, 1);
      }

      ctx.restore();

      // Game over - just darken canvas, HTML overlay handles the rest
      if (gs.gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.85)";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center bg-background py-4">
      <div className="mb-4 flex w-full max-w-[400px] items-center justify-between px-4">
        <button
          onClick={onBack}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Exit
        </button>
        <img src={peepalLogo} alt="Peepal" className="h-8" />
        <div className="text-right">
          <div className="font-display text-xl font-bold text-primary">{score}</div>
          {streak > 1 && (
            <div className="text-xs text-primary/70">🔥 x{streak}</div>
          )}
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="rounded-lg border border-border"
          style={{ touchAction: "none", maxWidth: "100%", background: "#0a0a0a" }}
        />

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
            <span className="text-4xl mb-4">🎯</span>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center leading-tight mb-1">
              Experience the Reliable Way of Hiring with
            </h2>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-primary text-center mb-6">
              Peepal Consulting
            </h2>

            <a
              href="https://peepalconsulting.com/the-peepal-way-of-hiring/"
              target="_blank"
              rel="noopener noreferrer"
              className="mb-8 rounded-lg bg-primary px-10 py-4 font-display text-lg font-bold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90"
            >
              Learn More
            </a>

            <p className="text-muted-foreground text-sm mb-1">
              Final Score: <span className="font-display font-bold text-primary">{score}</span>
            </p>

            <div className="mt-6 flex gap-4">
              <button
                onClick={() => initGame()}
                className="rounded-lg border border-border px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-foreground transition-colors hover:bg-secondary"
              >
                Play Again
              </button>
              <button
                onClick={onViewLeaderboard}
                className="rounded-lg border border-primary px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-primary transition-colors hover:bg-primary/10"
              >
                🏆 Leaderboard
              </button>
            </div>
          </div>
        )}
      </div>

      {!gameOver && (
        <p className="mt-4 text-sm text-muted-foreground">
          Tap or press Space to place the block
        </p>
      )}
    </div>
  );
};

export default BlockGame;
