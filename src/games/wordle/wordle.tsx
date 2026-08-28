"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Delete, CornerDownLeft, RotateCcw, PartyPopper, Lightbulb } from "lucide-react";
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
  correct: "bg-google-green text-white border-google-green",
  present: "bg-google-yellow text-white border-google-yellow",
  absent: "bg-surface-hover text-muted border-surface-hover",
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
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dailyNumber = useMemo(() => getDailyNumber(), []);

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
      showMessage("Chưa đủ 5 chữ cái");
      return;
    }
    if (!isValidWord(currentGuess)) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      showMessage("Từ không hợp lệ");
      return;
    }

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
      return;
    }

    if (currentRow >= ROWS - 1) {
      setGameOver(true);
      return;
    }

    setCurrentRow((r) => r + 1);
    setCurrentGuess("");
  }, [board, currentGuess, currentRow, gameOver, keyStates, target]);

  const handleKey = useCallback(
    (key: string) => {
      if (gameOver) return;
      if (key === "enter") {
        submitGuess();
      } else if (key === "backspace") {
        setCurrentGuess((g) => g.slice(0, -1));
      } else if (/^[a-z]$/.test(key) && currentGuess.length < COLS) {
        setCurrentGuess((g) => g + key);
      }
    },
    [currentGuess.length, gameOver, submitGuess]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") handleKey("enter");
      else if (e.key === "Backspace") handleKey("backspace");
      else if (/^[a-zA-Z]$/.test(e.key)) handleKey(e.key.toLowerCase());
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleKey]);

  const keyClass = (key: string) => {
    const state = keyStates[key];
    if (state === "correct") return "bg-google-green text-white";
    if (state === "present") return "bg-google-yellow text-white";
    if (state === "absent") return "bg-surface-hover text-muted";
    return "bg-surface border border-border";
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2">
        {(["daily", "unlimited"] as GameMode[]).map((m) => (
          <button
            key={m}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => reset(m)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              mode === m
                ? "bg-primary text-on-primary"
                : "border border-border bg-surface hover:bg-surface-hover"
            }`}
          >
            {m === "daily" ? `Hằng ngày #${dailyNumber}` : "Không giới hạn"}
          </button>
        ))}
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => reset(mode)}
          aria-label="Chơi lại"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface transition-colors hover:bg-surface-hover"
        >
          <RotateCcw className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="h-6 text-sm font-medium text-google-red">{message}</div>

      <div className={`grid gap-1.5 ${shake ? "animate-shake" : ""}`}>
        {board.map((row, r) => (
          <div key={r} className="flex gap-1.5">
            {row.map((tile, c) => {
              const char =
                r === currentRow && !gameOver
                  ? currentGuess[c] ?? ""
                  : tile.char;
              return (
                <div
                  key={c}
                  className={`flex h-14 w-14 items-center justify-center rounded-lg border-2 text-2xl font-bold uppercase transition-colors duration-150 sm:h-16 sm:w-16 ${STATE_CLASSES[tile.state]}`}
                >
                  {char}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        {KEY_ROWS.map((row, i) => (
          <div key={row} className="flex justify-center gap-1.5">
            {i === 2 && (
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleKey("enter")}
                className="flex h-12 items-center justify-center rounded-lg bg-surface px-2 text-xs font-semibold uppercase transition-colors hover:bg-surface-hover"
              >
                <CornerDownLeft className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
            {row.split("").map((key) => (
              <button
                key={key}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleKey(key)}
                className={`flex h-12 w-9 items-center justify-center rounded-lg text-sm font-semibold uppercase transition-colors sm:w-10 ${keyClass(key)}`}
              >
                {key}
              </button>
            ))}
            {i === 2 && (
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleKey("backspace")}
                className="flex h-12 items-center justify-center rounded-lg bg-surface px-2 transition-colors hover:bg-surface-hover"
              >
                <Delete className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        ))}
      </div>

      {gameOver && (
        <div
          className={`flex items-center gap-2 rounded-full px-6 py-2 text-sm font-semibold ${
            won
              ? "bg-google-green/10 text-google-green"
              : "bg-google-red/10 text-google-red"
          }`}
        >
          {won ? (
            <>
              <PartyPopper className="h-4 w-4" aria-hidden="true" />
              Đoán đúng sau {currentRow + 1} lượt!
            </>
          ) : (
            <>
              <Lightbulb className="h-4 w-4" aria-hidden="true" />
              Từ đúng là: {target.toUpperCase()}
            </>
          )}
        </div>
      )}
    </div>
  );
}
