"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Delete, CornerDownLeft, RotateCcw, PartyPopper, Lightbulb, Trophy } from "lucide-react";
import { triggerConfetti } from "@/lib/confetti";
import { isAudioMuted } from "@/lib/audio";
import {
  COLS,
  ROWS,
  evaluateGuess,
  getDailyNumber,
  getDailyWord,
  getRandomWord,
  isValidWord,
  type GameMode,
  type LetterState,
} from "./logic";

const KEY_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

const STATE_CLASSES: Record<LetterState, string> = {
  correct: "bg-google-green text-white border-google-green shadow-[0_2px_6px_rgba(52,168,83,0.4)]",
  present: "bg-google-yellow text-white border-google-yellow shadow-[0_2px_6px_rgba(251,188,4,0.4)]",
  absent: "bg-surface-hover text-muted border-border/80",
  empty: "border-border bg-surface",
};

interface TileData {
  char: string;
  state: LetterState;
}

function createEmptyBoard(): TileData[][] {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ char: "", state: "empty" as LetterState }))
  );
}

export function Wordle() {
  const [mode, setMode] = useState<GameMode>("daily");
  const [target, setTarget] = useState<string>(() => getDailyWord());
  const [board, setBoard] = useState<TileData[][]>(createEmptyBoard);
  const [currentRow, setCurrentRow] = useState(0);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [shake, setShake] = useState(false);
  const [keyStates, setKeyStates] = useState<Record<string, LetterState>>({});
  const [message, setMessage] = useState("");
  const [bestStreak, setBestStreak] = useState(0);
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const saved = Number(localStorage.getItem("wordle-best") ?? 0);
    setBestStreak(saved);
  }, []);

  const dailyNumber = useMemo(() => getDailyNumber(), []);

  // Web Audio Synth
  const playSound = useCallback((type: "key" | "delete" | "submit" | "error" | "win") => {
    if (typeof window === "undefined" || isAudioMuted()) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      if (type === "key") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(500, now);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === "delete") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(320, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === "submit") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(650, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === "error") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(140, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === "win") {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + i * 0.08);
          gain.gain.setValueAtTime(0.12, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.22);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.22);
        });
      }
    } catch {
      // Audio fallback
    }
  }, []);

  const reset = useCallback((m: GameMode) => {
    setMode(m);
    setTarget(m === "daily" ? getDailyWord() : getRandomWord());
    setBoard(createEmptyBoard());
    setCurrentRow(0);
    setCurrentGuess("");
    setGameOver(false);
    setWon(false);
    setKeyStates({});
    setMessage("");
    setShake(false);
  }, []);

  const showMessage = (msg: string) => {
    setMessage(msg);
    if (messageTimer.current) clearTimeout(messageTimer.current);
    messageTimer.current = setTimeout(() => setMessage(""), 1500);
  };

  useEffect(() => {
    return () => {
      if (messageTimer.current) clearTimeout(messageTimer.current);
    };
  }, []);

  const submitGuess = useCallback(() => {
    if (gameOver) return;
    if (currentGuess.length < COLS) {
      playSound("error");
      showMessage("Chưa đủ 5 chữ cái");
      return;
    }
    if (!isValidWord(currentGuess)) {
      playSound("error");
      setShake(true);
      setTimeout(() => setShake(false), 400);
      showMessage("Từ không có trong từ điển");
      return;
    }

    playSound("submit");
    const states = evaluateGuess(currentGuess, target);
    const newBoard = board.map((row, r) =>
      r === currentRow
        ? row.map((tile, c) => ({
            char: currentGuess[c],
            state: states[c],
          }))
        : row
    );
    setBoard(newBoard);

    const newKeyStates = { ...keyStates };
    currentGuess.split("").forEach((char, i) => {
      const priority = { correct: 3, present: 2, absent: 1, empty: 0 } as const;
      const current = newKeyStates[char];
      if (!current || priority[states[i]] > priority[current]) {
        newKeyStates[char] = states[i];
      }
    });
    setKeyStates(newKeyStates);

    if (currentGuess.toLowerCase() === target) {
      setWon(true);
      setGameOver(true);
      playSound("win");
      triggerConfetti({ particleCount: 130, spread: 85, origin: { x: 0.5, y: 0.35 } });
      setBestStreak((prev) => {
        const next = prev + 1;
        localStorage.setItem("wordle-best", String(next));
        return next;
      });
      return;
    }

    if (currentRow >= ROWS - 1) {
      setGameOver(true);
      playSound("error");
      return;
    }

    setCurrentRow((r) => r + 1);
    setCurrentGuess("");
  }, [board, currentGuess, currentRow, gameOver, keyStates, playSound, target]);

  const handleKey = useCallback(
    (key: string) => {
      if (gameOver) return;
      if (key === "enter") {
        submitGuess();
      } else if (key === "backspace") {
        playSound("delete");
        setCurrentGuess((g) => g.slice(0, -1));
      } else if (/^[a-z]$/.test(key) && currentGuess.length < COLS) {
        playSound("key");
        setCurrentGuess((g) => g + key);
      }
    },
    [currentGuess.length, gameOver, playSound, submitGuess]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === "enter" || key === "backspace") {
        e.preventDefault();
        handleKey(key);
      } else if (/^[a-z]$/.test(key)) {
        e.preventDefault();
        handleKey(key);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleKey]);

  const keyClass = (key: string) => {
    const state = keyStates[key];
    if (!state) return "bg-surface hover:bg-surface-hover text-foreground border border-border/80 shadow-sm";
    return STATE_CLASSES[state];
  };

  return (
    <div className="relative flex flex-col items-center gap-5 select-none max-w-md w-full">
      {/* Mode Bar & Streak */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {(["daily", "unlimited"] as const).map((m) => (
          <button
            key={m}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => reset(m)}
            className={`rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all active:scale-95 ${
              mode === m
                ? "bg-primary text-on-primary shadow-md"
                : "border border-border bg-surface hover:bg-surface-hover text-muted"
            }`}
          >
            {m === "daily" ? `Hằng ngày #${dailyNumber}` : "Không giới hạn"}
          </button>
        ))}
        {bestStreak > 0 && (
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-bold text-google-yellow shadow-sm">
            <Trophy className="h-4 w-4" />
            <span>{bestStreak} thắng</span>
          </div>
        )}
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => reset(mode)}
          aria-label="Chơi lại"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface transition-colors hover:bg-surface-hover shadow-sm active:scale-95"
        >
          <RotateCcw className="h-4 w-4 text-muted" />
        </button>
      </div>

      {/* Message alert */}
      <div className="h-6 text-sm font-bold text-google-red transition-all">
        {message}
      </div>

      {/* Word Grid */}
      <div className={`grid gap-2 ${shake ? "animate-shake" : ""}`}>
        {board.map((row, r) => (
          <div key={r} className="flex gap-2">
            {row.map((tile, c) => {
              const char =
                r === currentRow && !gameOver ? currentGuess[c] ?? "" : tile.char;
              const isCurrentTyping = r === currentRow && c === currentGuess.length;

              return (
                <div
                  key={c}
                  className={`flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl border-2 text-2xl font-black uppercase transition-all duration-200 select-none ${
                    isCurrentTyping
                      ? "border-primary shadow-md scale-105"
                      : STATE_CLASSES[tile.state]
                  }`}
                >
                  {char}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Virtual Keyboard */}
      <div className="flex flex-col gap-1.5 w-full mt-2">
        {KEY_ROWS.map((row, i) => (
          <div key={row} className="flex justify-center gap-1 sm:gap-1.5 w-full">
            {i === 2 && (
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleKey("enter")}
                className="flex h-12 flex-1 sm:flex-initial sm:w-14 items-center justify-center rounded-xl bg-surface border border-border text-xs font-bold uppercase transition-all hover:bg-surface-hover active:scale-95 shadow-sm"
              >
                <CornerDownLeft className="h-4 w-4 text-foreground" />
              </button>
            )}
            {row.split("").map((key) => (
              <button
                key={key}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleKey(key)}
                className={`flex h-12 flex-1 sm:flex-initial sm:w-10 items-center justify-center rounded-xl text-sm font-bold uppercase transition-all active:scale-95 shadow-sm ${keyClass(
                  key
                )}`}
              >
                {key}
              </button>
            ))}
            {i === 2 && (
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleKey("backspace")}
                className="flex h-12 flex-1 sm:flex-initial sm:w-14 items-center justify-center rounded-xl bg-surface border border-border transition-all hover:bg-surface-hover active:scale-95 shadow-sm"
              >
                <Delete className="h-4 w-4 text-foreground" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Victory / Defeat Modal Overlay */}
      {gameOver && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm p-6 text-center animate-in zoom-in rounded-3xl">
          {won ? (
            <PartyPopper className="h-16 w-16 text-google-yellow mb-2 drop-shadow" />
          ) : (
            <Lightbulb className="h-16 w-16 text-google-red mb-2 drop-shadow" />
          )}

          <h3 className="text-2xl font-black text-foreground">
            {won ? "Chúc Mừng! Bạn Đã Đoán Đúng" : "Hết Lượt Đoán!"}
          </h3>

          <div className="my-4 flex flex-col items-center rounded-2xl border border-primary/20 bg-primary/5 px-6 py-3">
            <span className="text-xs uppercase font-bold text-muted">Từ khóa bí ẩn</span>
            <span className="text-3xl font-black tracking-widest text-primary uppercase">
              {target}
            </span>
          </div>

          <p className="text-xs text-muted mb-4">
            {won
              ? `Bạn đã tìm ra từ khóa sau ${currentRow + 1} lượt đoán xuất sắc!`
              : "Đừng nản lòng, hãy thử lại với một từ mới nhé!"}
          </p>

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => reset(mode === "daily" ? "unlimited" : "unlimited")}
            className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-bold text-on-primary shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            <RotateCcw className="h-4 w-4" />
            Chơi ván tiếp theo
          </button>
        </div>
      )}
    </div>
  );
}
