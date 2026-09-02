"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Play,
  RotateCcw,
  Palette,
  Timer,
  Flame,
  Trophy,
  Activity,
  Circle,
  Square,
  Triangle,
  Star,
  Target,
  Zap,
  ThumbsUp,
  Dumbbell,
} from "lucide-react";
import {
  GOOGLE_COLORS,
  generateStroopCard,
  getMultiplier,
  getReflexRating,
  type ColorKey,
  type StroopCard,
} from "./logic";
import { isAudioMuted } from "@/lib/audio";

const INITIAL_TIME = 40.0;
const MAX_TIME = 50.0;

export function StroopTest() {
  const [phase, setPhase] = useState<"idle" | "playing" | "gameover">("idle");
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [card, setCard] = useState<StroopCard | null>(null);
  const [level, setLevel] = useState(1);

  // Stats
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [lastReactionTime, setLastReactionTime] = useState<number | null>(null);
  const [cardStartTime, setCardStartTime] = useState<number>(0);
  const [flashFeedback, setFlashFeedback] = useState<"correct" | "wrong" | null>(null);
  const [floatingNotice, setFloatingNotice] = useState<{ text: string; id: number } | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load high score
  useEffect(() => {
    const saved = Number(localStorage.getItem("stroop-test-best") ?? 0);
    setBestScore(saved);
  }, []);

  // Web Audio Synth
  const playTone = (freq: number, type: OscillatorType = "sine", duration = 0.1) => {
    if (typeof window === "undefined" || isAudioMuted()) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio fallback
    }
  };

  const handleGameOver = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("gameover");
    playTone(150, "sawtooth", 0.4);

    setScore((currentScore) => {
      setBestScore((currentBest) => {
        if (currentScore > currentBest) {
          localStorage.setItem("stroop-test-best", String(currentScore));
          return currentScore;
        }
        return currentBest;
      });
      return currentScore;
    });
  }, []);

  // Timer countdown
  useEffect(() => {
    if (phase !== "playing") return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 0.1;
        if (next <= 0) {
          handleGameOver();
          return 0;
        }
        return next;
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, handleGameOver]);

  // Start / restart game
  const startGame = useCallback(() => {
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setLevel(1);
    setTotalAnswered(0);
    setTotalCorrect(0);
    setReactionTimes([]);
    setLastReactionTime(null);
    setTimeLeft(INITIAL_TIME);
    setFlashFeedback(null);

    const firstCard = generateStroopCard(1);
    setCard(firstCard);
    setCardStartTime(performance.now());
    setPhase("playing");
  }, []);

  // Handle color choice
  const handleChoice = useCallback(
    (chosenColor: ColorKey) => {
      if (phase !== "playing" || !card) return;

      const reactionTime = Math.round(performance.now() - cardStartTime);
      setTotalAnswered((a) => a + 1);
      setLastReactionTime(reactionTime);

      if (chosenColor === card.correctColorKey) {
        // Correct
        setReactionTimes((times) => [...times, reactionTime]);
        setTotalCorrect((c) => c + 1);

        const nextStreak = streak + 1;
        setStreak(nextStreak);
        if (nextStreak > maxStreak) setMaxStreak(nextStreak);

        const mult = getMultiplier(nextStreak);
        // Speed bonus
        const speedBonus = reactionTime < 450 ? 150 : reactionTime < 750 ? 100 : 50;
        const points = (100 + speedBonus) * mult;
        setScore((s) => s + points);

        const speedLabel = reactionTime < 380 ? `⚡ ${reactionTime}ms (Siêu tốc!)` : `+${points}đ`;
        setFloatingNotice({ text: speedLabel, id: Date.now() });
        setTimeout(() => setFloatingNotice(null), 500);

        // Add 1.5s time bonus
        setTimeLeft((t) => Math.min(MAX_TIME, t + 1.5));
        setFlashFeedback("correct");
        playTone(600 + Math.min(nextStreak * 25, 400), "sine", 0.08);

        // Advance level every 8 correct
        const nextLevel = Math.floor((totalCorrect + 1) / 8) + 1;
        setLevel(nextLevel);

        // Spawn next card
        const nextCard = generateStroopCard(nextLevel);
        setCard(nextCard);
        setCardStartTime(performance.now());
      } else {
        // Wrong
        setStreak(0);
        setTimeLeft((t) => Math.max(0, t - 3.0));
        setFlashFeedback("wrong");
        playTone(180, "sawtooth", 0.18);

        const nextCard = generateStroopCard(level);
        setCard(nextCard);
        setCardStartTime(performance.now());
      }

      setTimeout(() => setFlashFeedback(null), 250);
    },
    [phase, card, cardStartTime, streak, maxStreak, totalCorrect, level]
  );

  // Keyboard controls: 1, 2, 3, 4 or Q, W, E, R
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (phase === "playing") {
        const key = e.key.toLowerCase();
        if (key === "1" || key === "q") handleChoice("blue");
        else if (key === "2" || key === "w") handleChoice("red");
        else if (key === "3" || key === "e") handleChoice("yellow");
        else if (key === "4" || key === "r") handleChoice("green");
      } else if (phase === "idle" || phase === "gameover") {
        if (e.code === "Space" || e.code === "Enter") {
          e.preventDefault();
          startGame();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, handleChoice, startGame]);

  const multiplier = getMultiplier(streak);
  const timePercent = (timeLeft / MAX_TIME) * 100;
  const avgReactionTime =
    reactionTimes.length > 0
      ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
      : 0;
  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const reflexRating = getReflexRating(avgReactionTime, accuracy);

  return (
    <div className="flex w-full flex-col items-center gap-6 select-none max-w-xl">
      {/* Top Bar: Score, Combo, Best Score */}
      <div className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface px-6 py-3.5 shadow-sm">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted">Điểm số</div>
          <div className="tabular-nums text-3xl font-extrabold text-foreground">{score}</div>
        </div>

        {/* Combo */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1">
            <Flame className={`h-5 w-5 ${streak >= 4 ? "text-google-yellow animate-bounce" : "text-muted"}`} />
            <span
              className={`tabular-nums text-2xl font-black ${
                multiplier > 1 ? "text-google-yellow" : "text-muted"
              }`}
            >
              x{multiplier}
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
            {streak} chuỗi đúng
          </span>
        </div>

        <div className="text-right">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted">Kỷ lục</div>
          <div className="flex items-center gap-1 tabular-nums text-2xl font-extrabold text-google-green">
            <Trophy className="h-5 w-5" /> {bestScore}
          </div>
        </div>
      </div>

      {/* Main Game Box */}
      <div className="relative flex w-full flex-col items-center rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-xl overflow-hidden">
        {/* Timer Bar */}
        <div className="flex w-full flex-col gap-1.5 mb-6">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-1 text-muted">
              <Timer className="h-4 w-4" /> Thời gian còn lại
            </span>
            <span
              className={`tabular-nums text-sm font-extrabold ${
                timeLeft < 8 ? "text-google-red animate-pulse" : "text-foreground"
              }`}
            >
              {timeLeft.toFixed(1)}s
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-border/60">
            <div
              className={`h-full transition-all duration-100 ${
                timeLeft < 8
                  ? "bg-google-red"
                  : timeLeft < 16
                  ? "bg-google-yellow"
                  : "bg-google-blue"
              }`}
              style={{ width: `${Math.max(0, Math.min(100, timePercent))}%` }}
            />
          </div>
        </div>

        {/* Card Display Area */}
        {phase === "playing" && card && (
          <div className="flex flex-col items-center w-full my-2">
            {/* Instruction Banner */}
            <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
              <div
                className={`rounded-full px-5 py-2 text-xs font-extrabold transition-colors shadow-sm ${
                  card.variant === "word_meaning"
                    ? "bg-google-red/15 text-google-red border border-google-red/30 animate-pulse"
                    : card.variant === "shape_color"
                    ? "bg-google-yellow/15 text-google-yellow border border-google-yellow/30"
                    : "bg-google-blue/15 text-google-blue border border-google-blue/30"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Target className="h-4 w-4" />
                  <span>{card.instruction}</span>
                </span>
              </div>
              {floatingNotice && (
                <div
                  key={floatingNotice.id}
                  className="rounded-full bg-google-yellow border border-white/60 px-3.5 py-1 text-xs font-black text-black shadow-lg animate-bounce"
                >
                  {floatingNotice.text}
                </div>
              )}
            </div>

            {/* Stimulus Word / Shape */}
            <div
              className={`flex min-h-[140px] w-full items-center justify-center rounded-3xl border bg-background p-6 shadow-inner transition-all ${
                flashFeedback === "correct"
                  ? "border-google-green bg-google-green/10"
                  : flashFeedback === "wrong"
                  ? "border-google-red bg-google-red/10 animate-shake"
                  : "border-border"
              }`}
            >
              {card.variant === "shape_color" ? (
                <div className="flex flex-col items-center gap-2">
                  {card.shape === "circle" && (
                    <Circle className="h-20 w-20 fill-current drop-shadow-md" style={{ color: card.displayColor.hex }} />
                  )}
                  {card.shape === "square" && (
                    <Square className="h-20 w-20 fill-current drop-shadow-md" style={{ color: card.displayColor.hex }} />
                  )}
                  {card.shape === "triangle" && (
                    <Triangle className="h-20 w-20 fill-current drop-shadow-md" style={{ color: card.displayColor.hex }} />
                  )}
                  {card.shape === "star" && (
                    <Star className="h-20 w-20 fill-current drop-shadow-md" style={{ color: card.displayColor.hex }} />
                  )}
                  <span className="text-xs font-bold text-muted uppercase">Hình dạng</span>
                </div>
              ) : (
                <span
                  className="text-4xl sm:text-6xl font-black tracking-wider drop-shadow-sm select-none"
                  style={{ color: card.displayColor.hex }}
                >
                  {card.displayWord}
                </span>
              )}
            </div>

            {/* Live Reaction Time Pill */}
            {lastReactionTime !== null && (
              <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-muted">
                <Activity className="h-3.5 w-3.5 text-google-blue" />
                Phản xạ:{" "}
                <span
                  className={`tabular-nums ${
                    lastReactionTime < 450
                      ? "text-google-green"
                      : lastReactionTime < 750
                      ? "text-google-yellow"
                      : "text-google-red"
                  }`}
                >
                  {lastReactionTime} ms
                </span>
              </div>
            )}

            {/* 4 Tactile Arcade Color Buttons */}
            <div className="grid grid-cols-2 gap-3.5 mt-5 w-full">
              {GOOGLE_COLORS.map((col, idx) => {
                const shortcuts = ["1 / Q", "2 / W", "3 / E", "4 / R"];
                return (
                  <button
                    key={col.key}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleChoice(col.key)}
                    className={`group relative flex items-center justify-center gap-2 rounded-2xl border-t border-l border-r border-white/20 border-b-4 border-black/30 p-4 font-bold text-white shadow-[0_6px_0_rgba(0,0,0,0.25)] transition-all active:translate-y-1 active:shadow-[0_1px_0_rgba(0,0,0,0.25)] ${col.bgClass} hover:brightness-105 select-none`}
                  >
                    <span className="absolute top-2 left-3 rounded-md bg-black/25 px-1.5 py-0.5 text-[10px] font-mono font-bold text-white/90">
                      {shortcuts[idx]}
                    </span>
                    <span className="text-base sm:text-lg font-black tracking-wide drop-shadow-md">
                      {col.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Idle Start Overlay */}
        {phase === "idle" && (
          <div className="flex flex-col items-center py-10 text-center">
            <Palette className="h-16 w-16 text-google-blue mb-3 drop-shadow animate-pulse" />
            <h2 className="text-3xl font-black text-foreground">Stroop Test</h2>
            <p className="mt-2 text-sm text-muted max-w-sm">
              Kiểm tra phản xạ não bộ! Chữ nói một đằng, màu hiện một nẻo — hãy đọc kỹ yêu cầu để chọn màu chuẩn xác trong chớp mắt.
            </p>

            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={startGame}
              className="mt-6 flex items-center gap-2 rounded-full bg-google-blue px-8 py-3.5 text-base font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              <Play className="h-5 w-5 fill-current" />
              Bắt đầu thử thách
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {phase === "gameover" && (
          <div className="flex flex-col items-center py-6 text-center w-full animate-in zoom-in">
            <Trophy className="h-14 w-14 text-google-yellow mb-2 drop-shadow" />
            <h3 className="text-2xl font-black text-foreground">Hết Giờ! Hoàn Thành Bài Đo</h3>
            <div className={`mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-black ${reflexRating.color}`}>
              {reflexRating.icon === "Zap" && <Zap className="h-4 w-4" />}
              {reflexRating.icon === "Target" && <Target className="h-4 w-4" />}
              {reflexRating.icon === "ThumbsUp" && <ThumbsUp className="h-4 w-4" />}
              {reflexRating.icon === "Dumbbell" && <Dumbbell className="h-4 w-4" />}
              <span>{reflexRating.title}</span>
            </div>

            <div className="my-5 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
              <div className="rounded-2xl border border-border bg-background p-3">
                <div className="text-[10px] text-muted uppercase font-bold">Tổng điểm</div>
                <div className="tabular-nums text-xl font-black text-google-blue">{score}</div>
              </div>
              <div className="rounded-2xl border border-border bg-background p-3">
                <div className="text-[10px] text-muted uppercase font-bold">Thời gian PX</div>
                <div className="tabular-nums text-xl font-black text-google-yellow">{avgReactionTime} ms</div>
              </div>
              <div className="rounded-2xl border border-border bg-background p-3">
                <div className="text-[10px] text-muted uppercase font-bold">Độ chính xác</div>
                <div className="tabular-nums text-xl font-black text-google-green">{accuracy}%</div>
              </div>
              <div className="rounded-2xl border border-border bg-background p-3">
                <div className="text-[10px] text-muted uppercase font-bold">Max Streak</div>
                <div className="flex items-center justify-center gap-1 tabular-nums text-xl font-black text-google-red">
                  <span>{maxStreak}</span>
                  <Flame className="h-4 w-4 fill-google-red" />
                </div>
              </div>
            </div>

            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={startGame}
              className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-bold text-on-primary shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              <RotateCcw className="h-4 w-4" />
              Thử lại (SPACE)
            </button>
          </div>
        )}
      </div>

      {/* Keyboard hints */}
      <div className="hidden md:flex items-center gap-4 text-xs text-muted">
        <span>Phím tắt: <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono">1/Q</kbd> (Xanh dương) · <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono">2/W</kbd> (Đỏ) · <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono">3/E</kbd> (Vàng) · <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono">4/R</kbd> (Xanh lá)</span>
      </div>
    </div>
  );
}
