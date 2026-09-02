"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, RotateCcw, Zap, Timer, Trophy, Flame } from "lucide-react";
import { generateQuestion, getMultiplier, type MathQuestion } from "./logic";
import { isAudioMuted } from "@/lib/audio";
import { triggerConfetti } from "@/lib/confetti";

const INITIAL_TIME = 25.0; // 25 seconds
const MAX_TIME = 35.0;

export function MathBlaster() {
  const [phase, setPhase] = useState<"idle" | "playing" | "gameover">("idle");
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [question, setQuestion] = useState<MathQuestion | null>(null);
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [flashResult, setFlashResult] = useState<"correct" | "wrong" | null>(null);
  const [floatingText, setFloatingText] = useState<{ text: string; id: number } | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load high score
  useEffect(() => {
    const saved = Number(localStorage.getItem("math-blaster-best") ?? 0);
    setBestScore(saved);
  }, []);

  // Web Audio Synth
  const playSound = (type: "correct" | "wrong" | "combo" | "gameover") => {
    if (typeof window === "undefined" || isAudioMuted()) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      if (type === "correct") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.1);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === "wrong") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.18);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === "combo") {
        [659.25, 880].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now + i * 0.08);
          gain.gain.setValueAtTime(0.12, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.15);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.15);
        });
      } else if (type === "gameover") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.4);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch {
      // Audio fallback
    }
  };

  const handleGameOver = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("gameover");
    playSound("gameover");

    setScore((currentScore) => {
      setBestScore((currentBest) => {
        if (currentScore > currentBest) {
          localStorage.setItem("math-blaster-best", String(currentScore));
          triggerConfetti({ particleCount: 120, spread: 80, origin: { x: 0.5, y: 0.4 } });
          return currentScore;
        }
        return currentBest;
      });
      return currentScore;
    });
  }, []);

  // Timer interval countdown
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
    setCorrectCount(0);
    setTimeLeft(INITIAL_TIME);
    setQuestion(generateQuestion(0));
    setFlashResult(null);
    setSelectedOption(null);
    setPhase("playing");
  }, []);

  // Handle option selection
  const selectOption = useCallback((val: number) => {
    if (phase !== "playing" || !question || selectedOption !== null) return;

    setSelectedOption(val);

    if (val === question.correctAnswer) {
      // Correct!
      const currentStreak = streak + 1;
      setStreak(currentStreak);
      if (currentStreak > maxStreak) setMaxStreak(currentStreak);
      setCorrectCount((c) => c + 1);

      const multiplier = getMultiplier(currentStreak);
      const points = 100 * multiplier * question.tier;
      setScore((s) => s + points);

      const comboLabel = multiplier > 1 ? `+${points} (Combo x${multiplier}! 🔥)` : `+${points} 🎉`;
      setFloatingText({ text: comboLabel, id: Date.now() });

      // Add time bonus (+2.5s)
      setTimeLeft((t) => Math.min(MAX_TIME, t + 2.5));

      setFlashResult("correct");
      if (currentStreak >= 2) {
        playSound("combo");
      } else {
        playSound("correct");
      }

      setTimeout(() => {
        setQuestion(generateQuestion(score + points));
        setSelectedOption(null);
        setFlashResult(null);
        setFloatingText(null);
      }, 400);
    } else {
      // Wrong!
      setStreak(0);
      setTimeLeft((t) => Math.max(0, t - 3.5));
      setFlashResult("wrong");
      playSound("wrong");

      setTimeout(() => {
        setQuestion(generateQuestion(score));
        setSelectedOption(null);
        setFlashResult(null);
      }, 400);
    }
  }, [phase, question, selectedOption, streak, maxStreak, score]);

  // Keyboard shortcut listener for 1, 2, 3, 4
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (phase === "playing" && question) {
        if (e.key === "1" && question.options[0] !== undefined) {
          selectOption(question.options[0]);
        } else if (e.key === "2" && question.options[1] !== undefined) {
          selectOption(question.options[1]);
        } else if (e.key === "3" && question.options[2] !== undefined) {
          selectOption(question.options[2]);
        } else if (e.key === "4" && question.options[3] !== undefined) {
          selectOption(question.options[3]);
        }
      } else if (phase === "idle" || phase === "gameover") {
        if (e.code === "Space" || e.code === "Enter") {
          e.preventDefault();
          startGame();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, question, selectOption, startGame]);

  const multiplier = getMultiplier(streak);
  const timePercent = (timeLeft / MAX_TIME) * 100;

  return (
    <div className="flex w-full flex-col items-center gap-6 select-none max-w-xl">
      {/* Top Bar: Score, Multiplier Streak, Best Score */}
      <div className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface px-6 py-3.5 shadow-sm">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted">Điểm số</div>
          <div className="tabular-nums text-3xl font-extrabold text-foreground">{score}</div>
        </div>

        {/* Combo Multiplier */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1">
            <Flame className={`h-5 w-5 ${streak >= 3 ? "text-google-red animate-bounce" : "text-muted"}`} />
            <span
              className={`tabular-nums text-2xl font-black ${
                multiplier > 1 ? "text-google-red" : "text-muted"
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
          <div className="flex items-center gap-1 tabular-nums text-2xl font-extrabold text-google-yellow">
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
                timeLeft < 6 ? "text-google-red animate-pulse" : "text-foreground"
              }`}
            >
              {timeLeft.toFixed(1)}s
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-border/60">
            <div
              className={`h-full transition-all duration-100 ${
                timeLeft < 6
                  ? "bg-google-red"
                  : timeLeft < 12
                  ? "bg-google-yellow"
                  : "bg-google-green"
              }`}
              style={{ width: `${Math.max(0, Math.min(100, timePercent))}%` }}
            />
          </div>
        </div>

        {/* Question Equation Display */}
        {phase === "playing" && question && (
          <div className="flex flex-col items-center my-3 w-full">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-google-red/10 border border-google-red/20 px-3 py-1 text-xs font-bold text-google-red uppercase tracking-wider">
                <Zap className="h-3.5 w-3.5 inline mr-1" /> Cấp độ {question.tier}
              </span>
              {floatingText && (
                <span className="rounded-full bg-google-yellow border border-white/60 px-3 py-1 text-xs font-black text-black shadow-lg animate-bounce">
                  {floatingText.text}
                </span>
              )}
            </div>

            {/* Futuristic Arcade Math Display */}
            <div
              className={`relative flex items-center justify-center rounded-3xl border-2 bg-gradient-to-b from-background via-surface to-background px-8 py-7 w-full shadow-inner transition-all overflow-hidden ${
                flashResult === "correct"
                  ? "border-google-green bg-google-green/10 shadow-[0_0_20px_rgba(52,168,83,0.3)]"
                  : flashResult === "wrong"
                  ? "border-google-red bg-google-red/10 shadow-[0_0_20px_rgba(234,67,53,0.3)] animate-shake"
                  : "border-border shadow-md"
              }`}
            >
              <span className="tabular-nums text-4xl sm:text-5xl font-black text-foreground tracking-wider drop-shadow-sm">
                {question.expression} = <span className="text-google-yellow drop-shadow animate-pulse">?</span>
              </span>
            </div>

            {/* 4 Tactile Arcade Choices Grid */}
            <div className="grid grid-cols-2 gap-3.5 mt-6 w-full">
              {question.options.map((opt, idx) => {
                const isSelected = selectedOption === opt;
                const isCorrect = opt === question.correctAnswer;

                let btnClass =
                  "border-border bg-gradient-to-b from-surface to-surface-hover text-foreground hover:border-primary/40 shadow-[0_4px_0_rgba(0,0,0,0.12)]";
                if (selectedOption !== null) {
                  if (isSelected && isCorrect) {
                    btnClass =
                      "border-google-green bg-google-green text-white font-black shadow-[0_4px_0_#1e7e34]";
                  } else if (isSelected && !isCorrect) {
                    btnClass =
                      "border-google-red bg-google-red text-white font-black animate-shake shadow-[0_4px_0_#991b1b]";
                  } else if (isCorrect) {
                    btnClass =
                      "border-google-green bg-google-green/20 text-google-green font-black shadow-[0_4px_0_rgba(52,168,83,0.3)]";
                  }
                }

                return (
                  <button
                    key={`${question.id}-${idx}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectOption(opt)}
                    className={`relative flex items-center justify-center rounded-2xl border-2 py-4 text-2xl font-black transition-all active:translate-y-1 active:shadow-none sm:py-5 ${btnClass}`}
                  >
                    <span className="absolute top-2 left-3 flex h-5 w-5 items-center justify-center rounded-md bg-background/60 border border-border text-[10px] font-mono font-bold text-muted">
                      {idx + 1}
                    </span>
                    <span className="tabular-nums drop-shadow-sm">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Start Overlay */}
        {phase === "idle" && (
          <div className="flex flex-col items-center py-10 text-center">
            <Zap className="h-16 w-16 text-google-red mb-3 drop-shadow animate-pulse" />
            <h2 className="text-3xl font-black text-foreground">Math Blaster</h2>
            <p className="mt-2 text-sm text-muted max-w-sm">
              Tính toán thật nhanh trước khi hết giờ! Đúng liên tiếp để nhân combo x2, x3, x4, x5 và kéo dài thời gian.
            </p>

            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={startGame}
              className="mt-6 flex items-center gap-2 rounded-full bg-google-red px-8 py-3.5 text-base font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              <Play className="h-5 w-5 fill-current" />
              Bắt đầu tính nhẩm
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {phase === "gameover" && (
          <div className="flex flex-col items-center py-6 text-center w-full animate-in zoom-in">
            <Trophy className="h-14 w-14 text-google-yellow mb-2 drop-shadow" />
            <h3 className="text-2xl font-black text-foreground">Hết Giờ! Game Over</h3>
            <p className="text-xs text-muted mt-1">Kết quả chung cuộc của bạn:</p>

            <div className="my-5 grid grid-cols-3 gap-3 w-full">
              <div className="rounded-2xl border border-border bg-background p-3">
                <div className="text-[10px] text-muted uppercase font-bold">Tổng điểm</div>
                <div className="tabular-nums text-xl font-black text-google-red">{score}</div>
              </div>
              <div className="rounded-2xl border border-border bg-background p-3">
                <div className="text-[10px] text-muted uppercase font-bold">Số câu đúng</div>
                <div className="tabular-nums text-xl font-black text-google-green">{correctCount}</div>
              </div>
              <div className="rounded-2xl border border-border bg-background p-3">
                <div className="text-[10px] text-muted uppercase font-bold">Streak lớn nhất</div>
                <div className="flex items-center justify-center gap-1 tabular-nums text-xl font-black text-google-yellow">
                  <span>{maxStreak}</span>
                  <Flame className="h-4 w-4 fill-google-yellow" />
                </div>
              </div>
            </div>

            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={startGame}
              className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-bold text-on-primary shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              <RotateCcw className="h-4 w-4" />
              Chơi lại (SPACE)
            </button>
          </div>
        )}
      </div>

      {/* Keyboard hints */}
      <div className="hidden md:flex items-center gap-4 text-xs text-muted">
        <span>Phím tắt: <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono">1</kbd> <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono">2</kbd> <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono">3</kbd> <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono">4</kbd> tương ứng 4 đáp án</span>
        <span><kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono">SPACE</kbd> : Chơi lại</span>
      </div>
    </div>
  );
}
