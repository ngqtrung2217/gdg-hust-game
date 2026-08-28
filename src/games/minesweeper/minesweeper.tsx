"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Flag, Bomb, RotateCcw, PartyPopper, Skull } from "lucide-react";
import {
  DIFFICULTIES,
  checkWin,
  countFlags,
  createEmptyBoard,
  placeMines,
  revealAllMines,
  revealCell,
  toggleFlag,
  type Board,
  type Difficulty,
} from "./logic";

const NUMBER_COLORS = [
  "",
  "text-google-blue",
  "text-google-green",
  "text-google-red",
  "text-accent",
  "text-google-red",
  "text-google-blue",
  "text-google-green",
  "text-google-yellow",
];

type Status = "playing" | "won" | "lost";

export function Minesweeper() {
  const [difficulty, setDifficulty] = useState<Difficulty>(DIFFICULTIES[0]);
  const [board, setBoard] = useState<Board>(() =>
    createEmptyBoard(DIFFICULTIES[0].rows, DIFFICULTIES[0].cols)
  );
  const [status, setStatus] = useState<Status>("playing");
  const [minesPlaced, setMinesPlaced] = useState(false);
  const [time, setTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => setTime((t) => t + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => stopTimer, [stopTimer]);

  const reset = useCallback(
    (diff?: Difficulty) => {
      const d = diff ?? difficulty;
      stopTimer();
      setDifficulty(d);
      setBoard(createEmptyBoard(d.rows, d.cols));
      setStatus("playing");
      setMinesPlaced(false);
      setTime(0);
    },
    [difficulty, stopTimer]
  );

  const handleReveal = (row: number, col: number) => {
    if (status !== "playing") return;
    if (!minesPlaced) {
      setBoard((b) => placeMines(b, difficulty.mines, row, col));
      setMinesPlaced(true);
      startTimer();
    }
    setBoard((b) => {
      const next = revealCell(b, row, col);
      if (next[row][col].mine) {
        setStatus("lost");
        stopTimer();
        return revealAllMines(next);
      }
      if (checkWin(next)) {
        setStatus("won");
        stopTimer();
      }
      return next;
    });
  };

  const handleFlag = (row: number, col: number) => {
    if (status !== "playing") return;
    setBoard((b) => toggleFlag(b, row, col));
  };

  const minesLeft = difficulty.mines - countFlags(board);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {DIFFICULTIES.map((d) => (
          <button
            key={d.name}
            onClick={() => reset(d)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              difficulty.name === d.name
                ? "bg-primary text-on-primary"
                : "border border-border bg-surface hover:bg-surface-hover"
            }`}
          >
            {d.name}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-6 rounded-2xl border border-border bg-surface px-6 py-3">
        <div className="flex items-center gap-2 tabular-nums">
          <Flag className="h-5 w-5 text-google-red" aria-hidden="true" />
          <span className="text-xl font-bold">{minesLeft}</span>
        </div>
        <div className="tabular-nums text-xl font-bold">{time}s</div>
        <button
          onClick={() => reset()}
          aria-label="Chơi lại"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface transition-colors hover:bg-surface-hover"
        >
          <RotateCcw className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {status !== "playing" && (
        <div
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
            status === "won"
              ? "bg-google-green/10 text-google-green"
              : "bg-google-red/10 text-google-red"
          }`}
        >
          {status === "won" ? (
            <>
              <PartyPopper className="h-4 w-4" aria-hidden="true" />
              Bạn thắng!
            </>
          ) : (
            <>
              <Skull className="h-4 w-4" aria-hidden="true" />
              Bạn thua!
            </>
          )}
        </div>
      )}

      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${difficulty.cols}, minmax(0, 1fr))`,
        }}
      >
        {board.map((row, r) =>
          row.map((cell, c) => (
            <button
              key={`${r}-${c}`}
              onClick={() => handleReveal(r, c)}
              onContextMenu={(e) => {
                e.preventDefault();
                handleFlag(r, c);
              }}
              aria-label={`Ô ${r + 1}, ${c + 1}`}
              className={`flex h-8 w-8 items-center justify-center rounded text-sm font-bold transition-colors sm:h-9 sm:w-9 ${
                cell.state === "revealed"
                  ? "bg-surface-hover"
                  : "border border-border bg-surface hover:bg-surface-hover"
              }`}
            >
              {cell.state === "revealed" &&
                (cell.mine ? (
                  <Bomb className="h-4 w-4 text-google-red" aria-hidden="true" />
                ) : (
                  cell.adjacent > 0 && (
                    <span className={NUMBER_COLORS[cell.adjacent]}>
                      {cell.adjacent}
                    </span>
                  )
                ))}
              {cell.state === "flagged" && (
                <Flag className="h-4 w-4 text-google-red" aria-hidden="true" />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
