"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, RotateCcw, Trophy, Sparkles, BrainCircuit, PartyPopper } from "lucide-react";
import { isAudioMuted } from "@/lib/audio";

const GRID_SIZE = 3;
const CELLS = GRID_SIZE * GRID_SIZE;
const SHOW_MS = 450;
const GAP_MS = 180;

// Musical Pentatonic frequencies for the 9 pads
const PAD_FREQUENCIES = [
  261.63, // C4
  293.66, // D4
  329.63, // E4
  349.23, // F4
  392.00, // G4
  440.00, // A4
  493.88, // B4
  523.25, // C5
  587.33, // D5
];

// Color themes per pad
const PAD_COLORS = [
  { bg: "bg-[#4285f4]", glow: "shadow-[0_0_25px_rgba(66,133,244,0.9)]", border: "border-sky-300" },
  { bg: "bg-[#4285f4]", glow: "shadow-[0_0_25px_rgba(66,133,244,0.9)]", border: "border-sky-300" },
  { bg: "bg-[#4285f4]", glow: "shadow-[0_0_25px_rgba(66,133,244,0.9)]", border: "border-sky-300" },
  { bg: "bg-[#ea4335]", glow: "shadow-[0_0_25px_rgba(234,67,53,0.9)]", border: "border-rose-300" },
  { bg: "bg-[#fbbc04]", glow: "shadow-[0_0_25px_rgba(251,188,4,0.9)]", border: "border-amber-200" },
  { bg: "bg-[#ea4335]", glow: "shadow-[0_0_25px_rgba(234,67,53,0.9)]", border: "border-rose-300" },
  { bg: "bg-[#34a853]", glow: "shadow-[0_0_25px_rgba(52,168,83,0.9)]", border: "border-emerald-300" },
  { bg: "bg-[#34a853]", glow: "shadow-[0_0_25px_rgba(52,168,83,0.9)]", border: "border-emerald-300" },
  { bg: "bg-[#34a853]", glow: "shadow-[0_0_25px_rgba(52,168,83,0.9)]", border: "border-emerald-300" },
];

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

  // Web Audio Synth
  const playTone = useCallback((freq: number, duration = 0.25, type: OscillatorType = "sine") => {
    if (typeof window === "undefined" || isAudioMuted()) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio fallback
    }
  }, []);

  const playSequence = useCallback(
    (seq: number[]) => {
      setPhase("showing");
      setActiveCell(null);
      setInputIndex(0);
      seq.forEach((cell, i) => {
        timersRef.current.push(
          setTimeout(() => {
            setActiveCell(cell);
            playTone(PAD_FREQUENCIES[cell], 0.3);
          }, i * (SHOW_MS + GAP_MS))
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
    [playTone]
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
    playTone(PAD_FREQUENCIES[cell], 0.2);
    timersRef.current.push(setTimeout(() => setFlashCell(null), 200));

    if (cell !== sequence[inputIndex]) {
      setPhase("gameover");
      playTone(130, 0.4, "sawtooth");
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
      timersRef.current.push(setTimeout(() => playSequence(newSeq), 700));
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
    <div className="flex flex-col items-center gap-6 select-none max-w-md w-full">
      {/* Top Status Bar */}
      <div className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface px-6 py-3.5 shadow-sm">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted">Cấp độ hiện tại</div>
          <div className="tabular-nums text-3xl font-extrabold text-google-blue">
            {level > 0 ? `Level ${level}` : "—"}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <BrainCircuit className="h-6 w-6 text-primary animate-pulse" />
        </div>

        <div className="text-right">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted">Kỷ lục</div>
          <div className="flex items-center justify-end gap-1 tabular-nums text-2xl font-extrabold text-google-yellow">
            <Trophy className="h-5 w-5" />
            <span>{best > 0 ? `Lv ${best}` : "0"}</span>
          </div>
        </div>
      </div>

      {/* Arcade Launchpad Console */}
      <div className="relative flex flex-col items-center p-5 rounded-3xl bg-zinc-900 border-4 border-zinc-800 shadow-2xl overflow-hidden w-full">
        {/* Status prompt */}
        <div className="mb-4 text-xs font-bold uppercase tracking-wider text-center h-5">
          {phase === "idle" && (
            <span className="text-zinc-400">Nhấn Bắt đầu để thử thách trí nhớ</span>
          )}
          {phase === "showing" && (
            <span className="text-google-yellow flex items-center gap-1.5 justify-center animate-pulse">
              <Sparkles className="h-4 w-4" /> Quan sát chuỗi sáng...
            </span>
          )}
          {phase === "input" && (
            <span className="text-google-green">Đến lượt bạn ({inputIndex}/{sequence.length})</span>
          )}
          {phase === "gameover" && (
            <span className="text-google-red">Thử thách kết thúc!</span>
          )}
        </div>

        {/* 3x3 Tactile Pad Grid */}
        <div
          className="grid gap-3.5 p-2 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 shadow-inner"
          style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
        >
          {Array.from({ length: CELLS }, (_, i) => {
            const isActive = activeCell === i;
            const isFlash = flashCell === i;
            const colorDef = PAD_COLORS[i];

            return (
              <button
                key={i}
                disabled={phase !== "input"}
                onClick={() => handleCellClick(i)}
                onMouseDown={(e) => e.preventDefault()}
                aria-label={`Ô số ${i + 1}`}
                className={`relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border-2 transition-all duration-150 flex items-center justify-center overflow-hidden ${
                  isActive || isFlash
                    ? `${colorDef.bg} ${colorDef.glow} ${colorDef.border} scale-95 ring-2 ring-white/60`
                    : "border-zinc-800 bg-zinc-900/90 hover:bg-zinc-800/90 shadow-[0_4px_8px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)] active:scale-95 disabled:cursor-default"
                }`}
              >
                {/* Pad Center Glass Core */}
                <div
                  className={`h-4 w-4 rounded-full border transition-all ${
                    isActive || isFlash
                      ? "bg-white shadow-[0_0_10px_#ffffff] scale-125"
                      : "bg-zinc-700/50 border-zinc-600/40"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Game Over Modal Overlay */}
        {phase === "gameover" && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-sm p-6 text-center animate-in zoom-in">
            <PartyPopper className="h-14 w-14 text-google-yellow mb-2 drop-shadow" />
            <h3 className="text-2xl font-black text-white">Kết Thúc Lượt Chơi!</h3>
            <p className="mt-1 text-sm text-zinc-300">
              Bạn đã ghi nhớ chính xác đến <strong className="text-google-yellow">Level {level}</strong>.
            </p>

            {level >= best && level > 1 && (
              <div className="mt-3 rounded-full bg-google-yellow/20 border border-google-yellow/40 px-4 py-1 text-xs font-bold text-google-yellow">
                Kỷ lục mới của bạn!
              </div>
            )}

            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={start}
              className="mt-6 flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-bold text-on-primary shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              <RotateCcw className="h-4 w-4" />
              Thử lại ngay
            </button>
          </div>
        )}
      </div>

      {/* Action button */}
      {phase === "idle" && (
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={start}
          className="flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-base font-bold text-on-primary shadow-lg transition-all hover:scale-105 active:scale-95"
        >
          <Play className="h-5 w-5 fill-current" />
          Bắt đầu ghi nhớ
        </button>
      )}

      {phase !== "idle" && phase !== "gameover" && (
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={reset}
          aria-label="Chơi lại"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface transition-colors hover:bg-surface-hover shadow-sm"
        >
          <RotateCcw className="h-5 w-5 text-muted" />
        </button>
      )}
    </div>
  );
}
