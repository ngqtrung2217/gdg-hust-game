"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Flag, PartyPopper, Skull, Trophy, Pickaxe, Smile, Frown, Sparkles, ShieldCheck } from "lucide-react";
import { triggerConfetti } from "@/lib/confetti";
import { isAudioMuted } from "@/lib/audio";
import {
  DIFFICULTIES,
  checkWin,
  chordCell,
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
  "text-google-blue font-black",
  "text-google-green font-black",
  "text-google-red font-black",
  "text-indigo-600 dark:text-indigo-400 font-black",
  "text-amber-600 dark:text-amber-400 font-black",
  "text-teal-600 dark:text-teal-400 font-black",
  "text-purple-600 dark:text-purple-400 font-black",
  "text-pink-600 dark:text-pink-400 font-black",
];

type Status = "playing" | "won" | "lost";
type ActionMode = "dig" | "flag";

function LedDisplay({ value }: { value: number }) {
  const clamped = Math.max(-99, Math.min(999, value));
  const formatted =
    clamped < 0
      ? `-${String(Math.abs(clamped)).padStart(2, "0")}`
      : String(clamped).padStart(3, "0");

  return (
    <div className="flex items-center rounded-xl bg-zinc-950 px-3 py-1 border-2 border-zinc-800 shadow-[inset_0_2px_5px_rgba(0,0,0,0.9)]">
      <span className="font-mono text-xl sm:text-2xl font-black text-rose-500 tracking-widest [text-shadow:0_0_8px_rgba(244,63,94,0.7)] select-none">
        {formatted}
      </span>
    </div>
  );
}

function NavalMine({ exploded = false }: { exploded?: boolean }) {
  return (
    <div className={`relative flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center ${exploded ? "scale-110" : ""}`}>
      {/* Detonation Spikes */}
      <div className="absolute h-full w-[2px] rounded-full bg-zinc-600" />
      <div className="absolute h-[2px] w-full rounded-full bg-zinc-600" />
      <div className="absolute h-full w-[2px] rounded-full bg-zinc-600 rotate-45" />
      <div className="absolute h-full w-[2px] rounded-full bg-zinc-600 -rotate-45" />
      {/* Mine Body */}
      <div className="relative flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-gradient-to-br from-zinc-600 via-zinc-800 to-black shadow-[0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.4)]">
        {/* Core LED diode */}
        <div className={`h-1.5 w-1.5 rounded-full ${exploded ? "bg-amber-400 animate-ping" : "bg-red-500 shadow-[0_0_4px_#ef4444]"}`} />
      </div>
    </div>
  );
}

function MineFlag() {
  return (
    <div className="flex items-center justify-center h-6 w-6">
      <div className="relative flex flex-col items-center">
        <div className="flex items-start">
          <div className="h-5 w-[2px] bg-gradient-to-b from-zinc-200 to-zinc-500 rounded-t shadow-sm" />
          <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[9px] border-l-google-red drop-shadow-sm -ml-[1px] mt-0.5" />
        </div>
        <div className="h-[2px] w-3 rounded-full bg-zinc-600 -mt-[1px] shadow-inner" />
      </div>
    </div>
  );
}

export function Minesweeper() {
  const [difficulty, setDifficulty] = useState<Difficulty>(DIFFICULTIES[0]);
  const [board, setBoard] = useState<Board>(() =>
    createEmptyBoard(DIFFICULTIES[0].rows, DIFFICULTIES[0].cols)
  );
  const [status, setStatus] = useState<Status>("playing");
  const [minesPlaced, setMinesPlaced] = useState(false);
  const [time, setTime] = useState(0);
  const [bestTime, setBestTime] = useState(0);
  const [actionMode, setActionMode] = useState<ActionMode>("dig");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const saved = Number(localStorage.getItem("minesweeper-best") ?? 0);
    setBestTime(saved);
  }, []);

  // Web Audio Synth
  const playSound = useCallback((type: "dig" | "flag" | "explode" | "win") => {
    if (typeof window === "undefined" || isAudioMuted()) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      if (type === "dig") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.04);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === "flag") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.06);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === "explode") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === "win") {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + i * 0.09);
          gain.gain.setValueAtTime(0.12, now + i * 0.09);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.09);
          osc.stop(now + i * 0.09 + 0.25);
        });
      }
    } catch {
      // Audio fallback
    }
  }, []);

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
    if (board[row][col].state === "flagged") return;

    // Chord clicking on already-revealed cell with satisfied flags
    if (board[row][col].state === "revealed") {
      if (board[row][col].adjacent > 0) {
        setBoard((prevBoard) => {
          const next = chordCell(prevBoard, row, col);
          if (next === prevBoard) return prevBoard;

          // Check if any revealed cell is a mine
          let hitMine = false;
          for (let r = 0; r < next.length; r++) {
            for (let c = 0; c < next[0].length; c++) {
              if (next[r][c].state === "revealed" && next[r][c].mine) {
                hitMine = true;
                break;
              }
            }
            if (hitMine) break;
          }

          if (hitMine) {
            setStatus("lost");
            stopTimer();
            playSound("explode");
            return revealAllMines(next);
          }

          playSound("dig");

          if (checkWin(next)) {
            setStatus("won");
            stopTimer();
            playSound("win");
            triggerConfetti({ particleCount: 140, spread: 90, origin: { x: 0.5, y: 0.4 } });
            setTime((curTime) => {
              setBestTime((prev) => {
                if (prev === 0 || (curTime > 0 && curTime < prev)) {
                  localStorage.setItem("minesweeper-best", String(curTime));
                  return curTime;
                }
                return prev;
              });
              return curTime;
            });
          }
          return next;
        });
      }
      return;
    }

    setBoard((prevBoard) => {
      let currentBoard = prevBoard;
      if (!minesPlaced) {
        currentBoard = placeMines(prevBoard, difficulty.mines, row, col);
        setMinesPlaced(true);
        startTimer();
      }

      const next = revealCell(currentBoard, row, col);
      if (next[row][col].mine) {
        setStatus("lost");
        stopTimer();
        playSound("explode");
        return revealAllMines(next);
      }

      playSound("dig");

      if (checkWin(next)) {
        setStatus("won");
        stopTimer();
        playSound("win");
        triggerConfetti({ particleCount: 140, spread: 90, origin: { x: 0.5, y: 0.4 } });
        setTime((curTime) => {
          setBestTime((prev) => {
            if (prev === 0 || (curTime > 0 && curTime < prev)) {
              localStorage.setItem("minesweeper-best", String(curTime));
              return curTime;
            }
            return prev;
          });
          return curTime;
        });
      }
      return next;
    });
  };

  const handleFlag = (row: number, col: number) => {
    if (status !== "playing") return;
    if (board[row][col].state === "revealed") return;
    playSound("flag");
    setBoard((b) => toggleFlag(b, row, col));
  };

  const handleCellClick = (r: number, c: number) => {
    if (actionMode === "flag") {
      handleFlag(r, c);
    } else {
      handleReveal(r, c);
    }
  };

  const minesLeft = difficulty.mines - countFlags(board);

  return (
    <div className="flex flex-col items-center gap-5 select-none max-w-full">
      {/* Difficulty Selector Bar */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {DIFFICULTIES.map((d) => (
          <button
            key={d.name}
            onClick={() => reset(d)}
            className={`rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all active:scale-95 ${
              difficulty.name === d.name
                ? "bg-primary text-on-primary shadow-md"
                : "border border-border bg-surface hover:bg-surface-hover text-muted hover:text-foreground"
            }`}
          >
            {d.name} ({d.rows}×{d.cols})
          </button>
        ))}
      </div>

      {/* Retro Arcade Control Console */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border-4 border-border bg-surface p-4 shadow-xl w-full max-w-lg">
        {/* LED Mines Counter */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Số mìn</span>
          <LedDisplay value={minesLeft} />
        </div>

        {/* Iconic Classic Smiley Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => reset()}
            aria-label="Khởi động lại"
            className="relative flex h-12 w-12 items-center justify-center rounded-2xl border-t-2 border-l-2 border-white/60 border-b-4 border-r-2 border-black/40 bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 shadow-lg hover:brightness-105 active:translate-y-1 active:border-b-2 active:shadow-sm transition-all"
          >
            {status === "won" ? (
              <Sparkles className="h-6 w-6 text-zinc-950 fill-zinc-950" />
            ) : status === "lost" ? (
              <Frown className="h-6 w-6 text-zinc-950" />
            ) : (
              <Smile className="h-6 w-6 text-zinc-950 fill-zinc-950/20" />
            )}
          </button>

          {/* Mode Switch Button (Mobile / Desktop) */}
          <button
            onClick={() => setActionMode((m) => (m === "dig" ? "flag" : "dig"))}
            title={actionMode === "dig" ? "Chuyển sang cắm cờ" : "Chuyển sang đào ô"}
            className={`flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-bold transition-all shadow-sm ${
              actionMode === "flag"
                ? "bg-google-red/20 text-google-red border-2 border-google-red/50 shadow-[0_0_10px_rgba(234,67,53,0.3)]"
                : "bg-surface-hover text-foreground border-2 border-border"
            }`}
          >
            {actionMode === "flag" ? (
              <>
                <Flag className="h-4 w-4 fill-current" />
                <span>Cắm cờ</span>
              </>
            ) : (
              <>
                <Pickaxe className="h-4 w-4 text-google-blue" />
                <span>Đào ô</span>
              </>
            )}
          </button>
        </div>

        {/* LED Timer Display */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Thời gian</span>
          <LedDisplay value={time} />
        </div>
      </div>

      {bestTime > 0 && (
        <div className="flex items-center gap-1.5 rounded-full border border-google-yellow/30 bg-google-yellow/10 px-4 py-1 text-xs font-bold text-google-yellow shadow-sm">
          <Trophy className="h-4 w-4" />
          <span>Kỷ lục dò sạch: {bestTime} giây</span>
        </div>
      )}

      {/* Minesweeper Grid Board */}
      <div className="relative p-3.5 rounded-3xl bg-surface border-4 border-border shadow-2xl overflow-x-auto max-w-full">
        <div
          className="grid gap-1.5 p-1 rounded-2xl bg-surface-hover/40"
          style={{
            gridTemplateColumns: `repeat(${difficulty.cols}, minmax(0, 1fr))`,
          }}
        >
          {board.map((row, r) =>
            row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleFlag(r, c);
                }}
                aria-label={`Ô ${r + 1}, ${c + 1}`}
                className={`relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-sm transition-all select-none ${
                  cell.state === "revealed"
                    ? cell.mine
                      ? "bg-google-red/25 border border-google-red shadow-inner animate-pulse"
                      : "bg-surface/90 border border-border/40 shadow-inner"
                    : "bg-gradient-to-br from-surface via-surface to-surface-hover border-t-2 border-l-2 border-white/50 border-b-2 border-r-2 border-black/30 shadow-[0_2px_4px_rgba(0,0,0,0.15)] hover:brightness-110 active:border-t-black/30 active:border-b-white/50 active:translate-y-[1px]"
                }`}
              >
                {cell.state === "revealed" &&
                  (cell.mine ? (
                    status === "won" ? (
                      <ShieldCheck className="h-5 w-5 text-google-green animate-pulse drop-shadow" />
                    ) : (
                      <NavalMine exploded={status === "lost"} />
                    )
                  ) : (
                    cell.adjacent > 0 && (
                      <span className={`drop-shadow-sm ${NUMBER_COLORS[cell.adjacent]}`}>
                        {cell.adjacent}
                      </span>
                    )
                  ))}
                {cell.state === "flagged" && <MineFlag />}
              </button>
            ))
          )}
        </div>

        {/* Win Modal Overlay */}
        {status === "won" && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm p-6 text-center animate-in zoom-in rounded-3xl">
            <PartyPopper className="h-16 w-16 text-google-yellow mb-2 drop-shadow" />
            <h3 className="text-2xl font-black text-foreground">Bạn Đã Phá Đảo Thành Công!</h3>
            <p className="mt-1 text-sm text-muted">
              Dò sạch toàn bộ bãi mìn trong thời gian <strong className="text-google-green">{time} giây</strong>.
            </p>
            {time <= bestTime && (
              <div className="mt-2.5 rounded-full bg-google-yellow/20 border border-google-yellow/40 px-4 py-1 text-xs font-bold text-google-yellow">
                Kỷ lục mới của bạn!
              </div>
            )}
            <button
              onClick={() => reset()}
              className="mt-6 flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-bold text-on-primary shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              <Smile className="h-4 w-4" />
              Chơi ván tiếp theo
            </button>
          </div>
        )}

        {/* Lost Modal Overlay */}
        {status === "lost" && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm p-6 text-center animate-in zoom-in rounded-3xl">
            <Skull className="h-16 w-16 text-google-red mb-2 drop-shadow" />
            <h3 className="text-2xl font-black text-foreground">Dẫm Phải Mìn!</h3>
            <p className="mt-1 text-sm text-muted">
              Rất tiếc, bạn đã kích hoạt một quả mìn. Hãy cẩn thận hơn ở lượt tới!
            </p>
            <button
              onClick={() => reset()}
              className="mt-6 flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-bold text-on-primary shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              <Smile className="h-4 w-4" />
              Thử lại ngay
            </button>
          </div>
        )}
      </div>

      {/* Hint */}
      <div className="text-xs text-muted text-center max-w-sm leading-relaxed">
        <p>
          Click chuột trái để đào ô, click chuột phải (hoặc nút Cắm cờ) để ghim cờ đánh dấu mìn.
        </p>
      </div>
    </div>
  );
}
