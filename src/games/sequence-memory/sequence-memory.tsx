"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, RotateCcw } from "lucide-react";

const GRID_SIZE = 3;
const CELLS = GRID_SIZE * GRID_SIZE;
const SHOW_MS = 500;
const GAP_MS = 200;

type Phase = "idle" | "showing" | "input" | "gameover";

export function SequenceMemory() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [sequence, setSequence] = useState<number[]>([]);
  const [activeCell, setActiveCell] = useState<number | null>(null);
  const [inputIndex, setInputIndex] = useState(0);
  const [level, setLevel] = useState(0);
  const [best, setBest] = useState(0);
  const [flashCell, setFlashCell] = useState<number | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const stored = Number(localStorage.getItem("sequence-memory-best") ?? 0);
    setBest(stored);
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const playSequence = useCallback(
    (seq: number[]) => {
      setPhase("showing");
      setActiveCell(null);
      setInputIndex(0);
      seq.forEach((cell, i) => {
        timersRef.current.push(
          setTimeout(() => setActiveCell(cell), i * (SHOW_MS + GAP_MS))
        );
        timersRef.current.push(
          setTimeout(() => setActiveCell(null), i * (SHOW_MS + GAP_MS) + SHOW_MS)
        );
      });
      timersRef.current.push(
        setTimeout(
          () => {
            setActiveCell(null);
            setPhase("input");
          },
          seq.length * (SHOW_MS + GAP_MS)
        )
      );
    },
    []
  );

  const start = () => {
    clearTimers();
    const first = Math.floor(Math.random() * CELLS);
    setSequence([first]);
    setLevel(1);
    setFlashCell(null);
    setPhase("showing");
    playSequence([first]);
  };

  const handleCellClick = (cell: number) => {
    if (phase !== "input") return;
    setFlashCell(cell);
    timersRef.current.push(setTimeout(() => setFlashCell(null), 200));

    if (cell !== sequence[inputIndex]) {
      setPhase("gameover");
      if (level > best) {
        setBest(level);
        localStorage.setItem("sequence-memory-best", String(level));
      }
      return;
    }

    const nextIndex = inputIndex + 1;
    if (nextIndex === sequence.length) {
      const newSeq = [...sequence, Math.floor(Math.random() * CELLS)];
      setSequence(newSeq);
      setLevel((l) => l + 1);
      setPhase("showing");
      setActiveCell(null);
      timersRef.current.push(
        setTimeout(() => playSequence(newSeq), 800)
      );
    } else {
      setInputIndex(nextIndex);
    }
  };

  const reset = () => {
    clearTimers();
    setPhase("idle");
    setSequence([]);
    setActiveCell(null);
    setFlashCell(null);
    setInputIndex(0);
    setLevel(0);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-6">
        <div className="text-center">
          <div className="text-sm text-muted">Level</div>
          <div className="tabular-nums text-2xl font-bold">{level}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-muted">Kỷ lục</div>
          <div className="tabular-nums text-2xl font-bold text-google-yellow">
            {best}
          </div>
        </div>
      </div>

      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
      >
        {Array.from({ length: CELLS }, (_, i) => {
          const isActive = activeCell === i;
          const isFlash = flashCell === i;
          return (
            <button
              key={i}
              onClick={() => handleCellClick(i)}
              aria-label={`Ô ${i + 1}`}
              className={`h-20 w-20 rounded-xl border-2 transition-all duration-150 sm:h-24 sm:w-24 ${
                isActive
                  ? "scale-105 border-google-blue bg-google-blue"
                  : isFlash
                    ? "border-google-green bg-google-green"
                    : "border-border bg-surface hover:bg-surface-hover"
              }`}
            />
          );
        })}
      </div>

      <div className="h-6 text-sm font-medium text-muted">
        {phase === "idle" && "Nhớ thứ tự các ô sáng lên"}
        {phase === "showing" && "Quan sát kỹ..."}
        {phase === "input" && "Lặp lại thứ tự!"}
        {phase === "gameover" && (
          <span className="text-google-red">Sai rồi! Đạt level {level}</span>
        )}
      </div>

      {phase === "idle" && (
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={start}
          className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-on-primary transition-colors hover:opacity-90"
        >
          <Play className="h-5 w-5" aria-hidden="true" />
          Bắt đầu
        </button>
      )}

      {phase === "gameover" && (
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={start}
          className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-on-primary transition-colors hover:opacity-90"
        >
          <RotateCcw className="h-5 w-5" aria-hidden="true" />
          Chơi lại
        </button>
      )}

      {phase !== "idle" && phase !== "gameover" && (
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={reset}
          aria-label="Chơi lại"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface transition-colors hover:bg-surface-hover"
        >
          <RotateCcw className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
