"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  RotateCcw,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Trophy,
  PartyPopper,
  Skull,
  Search,
  EyeOff,
  Eye,
  Send,
  Sparkles,
  Layers,
  Cpu,
  Target,
  SlidersHorizontal,
  Palette,
  Clock,
  Info,
  Calendar,
} from "lucide-react";
import { CHARACTERS, type Character } from "./characters";
import {
  QUESTIONS,
  calculateScore,
  evaluateQuestion,
  matchFreeformQuestion,
  pickRandomTarget,
  type AnswerResult,
  type QuestionCategory,
} from "./logic";
import { BRAND_LOGOS } from "./logos";
import { isAudioMuted } from "@/lib/audio";
import { triggerConfetti } from "@/lib/confetti";
import { recordGameScore } from "@/lib/player";

export function GuessWho() {
  const [target, setTarget] = useState<Character>(() => pickRandomTarget());
  const [eliminatedIds, setEliminatedIds] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<AnswerResult[]>([]);
  const [activeCategoryTab, setActiveCategoryTab] = useState<QuestionCategory>("all");
  const [customQuery, setCustomQuery] = useState("");
  const [searchNotice, setSearchNotice] = useState<string | null>(null);
  const [strikes, setStrikes] = useState(0);
  const [gameState, setGameState] = useState<"playing" | "won" | "lost">("playing");
  const [suspectToGuess, setSuspectToGuess] = useState<Character | null>(null);
  const [bestScore, setBestScore] = useState(0);
  const [hideEliminated, setHideEliminated] = useState(false);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load high score from local storage
  useEffect(() => {
    const saved = Number(localStorage.getItem("guess-who-best") ?? 0);
    setBestScore(saved);
  }, []);

  const remainingCount = useMemo(() => {
    return CHARACTERS.length - eliminatedIds.size;
  }, [eliminatedIds]);

  // Restart game
  const handleRestart = useCallback(() => {
    setTarget(pickRandomTarget());
    setEliminatedIds(new Set());
    setHistory([]);
    setCustomQuery("");
    setSearchNotice(null);
    setStrikes(0);
    setGameState("playing");
    setSuspectToGuess(null);
  }, []);

  // Web Audio card flip and clue sounds
  const playSound = useCallback((type: "flip_down" | "flip_up" | "correct" | "wrong" | "win" | "strike") => {
    if (typeof window === "undefined" || isAudioMuted()) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === "flip_down") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(360, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.08);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === "flip_up") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(480, now + 0.08);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === "correct") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === "strike") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.25);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === "win") {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = "triangle";
          o.frequency.value = freq;
          g.gain.setValueAtTime(0.09, now + i * 0.08);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);
          o.connect(g);
          g.connect(ctx.destination);
          o.start(now + i * 0.08);
          o.stop(now + i * 0.08 + 0.2);
        });
      }
    } catch {
      // Ignore audio failure
    }
  }, []);

  // Toggle card elimination manually
  const toggleEliminate = (id: string) => {
    if (gameState !== "playing") return;
    const isNowEliminated = !eliminatedIds.has(id);
    playSound(isNowEliminated ? "flip_down" : "flip_up");
    setEliminatedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Submit predefined question
  const askQuestion = (qId: string) => {
    if (!qId || gameState !== "playing") return;
    const res = evaluateQuestion(qId, target);
    if (!res) return;

    setHistory((prev) => [res, ...prev]);
    playSound("correct");
  };

  // Quick auto-eliminate from deduction
  const handleQuickEliminate = (clue: AnswerResult) => {
    if (gameState !== "playing") return;
    playSound("flip_down");
    setEliminatedIds((prev) => {
      const next = new Set(prev);
      clue.eliminatedIds.forEach((id) => next.add(id));
      return next;
    });
  };

  // Questions filtered by category and search keyword
  const filteredQuestions = useMemo(() => {
    let list = QUESTIONS;
    if (activeCategoryTab !== "all") {
      list = list.filter((q) => q.category === activeCategoryTab);
    }
    if (customQuery.trim()) {
      const q = customQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.text.toLowerCase().includes(q) ||
          item.categoryLabel.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeCategoryTab, customQuery]);

  // Display characters (all 24 cards uniform, optionally filtered by hide-eliminated)
  const displayCharacters = useMemo(() => {
    if (hideEliminated) {
      return CHARACTERS.filter((c) => !eliminatedIds.has(c.id));
    }
    return CHARACTERS;
  }, [hideEliminated, eliminatedIds]);

  // Submit freeform question or search
  const handleCustomQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim() || gameState !== "playing") return;

    const matched = matchFreeformQuestion(customQuery);
    if (matched) {
      askQuestion(matched.id);
      setCustomQuery("");
      setSearchNotice(null);
    } else {
      if (filteredQuestions.length > 0) {
        askQuestion(filteredQuestions[0].id);
        setCustomQuery("");
        setSearchNotice(null);
      } else {
        setSearchNotice("Chưa tìm thấy câu hỏi phù hợp. Hãy chọn trực tiếp các gợi ý bên dưới nhé!");
        if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
        noticeTimerRef.current = setTimeout(() => setSearchNotice(null), 4000);
      }
    }
  };

  // Confirm guess
  const confirmGuess = (char: Character) => {
    if (gameState !== "playing") return;

    if (char.id === target.id) {
      // Won!
      setGameState("won");
      playSound("win");
      triggerConfetti();
      const currentScore = calculateScore(history.length, strikes);
      if (currentScore > bestScore) {
        setBestScore(currentScore);
        recordGameScore("guess-who", currentScore);
      }
    } else {
      // Wrong guess (Strike)
      const nextStrikes = strikes + 1;
      setStrikes(nextStrikes);
      playSound("strike");
      setEliminatedIds((prev) => new Set(prev).add(char.id));
      setSuspectToGuess(null);

      if (nextStrikes >= 3) {
        setGameState("lost");
      }
    }
  };

  // Detective Rating Title
  const getDetectiveTitle = () => {
    if (strikes === 0 && history.length <= 4) return "Huyền Thoại Trí Tuệ (Sherlock Holmes)";
    if (strikes === 0 && history.length <= 6) return "Thám Tử Thượng Thừa (Senior Detective)";
    if (strikes <= 1 && history.length <= 8) return "Chuyên Viên Điều Tra Giỏi";
    return "Thám Tử Tập Sự Xuất Sắc";
  };

  return (
    <div className="flex w-full flex-col items-center gap-5 select-none max-w-7xl mx-auto px-1 sm:px-2">
      {/* Top Detective Command Console */}
      <div className="w-full rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Target Dossier Badge & Progress */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0 shadow-2xs">
                <Target className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-google-blue opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-google-blue" />
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Hồ sơ bí mật</span>
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.2 text-[9px] font-bold text-primary">
                    Classified
                  </span>
                </div>
                <div className="text-sm sm:text-base font-bold text-foreground flex items-center gap-1.5">
                  <span>Đối tượng bí ẩn #???</span>
                  <span className="text-xs font-medium text-muted">(1 trong 24)</span>
                </div>
              </div>
            </div>

            <div className="hidden sm:block h-8 w-px bg-border" />

            {/* Candidates Progress */}
            <div className="flex flex-col gap-1 min-w-[170px] sm:min-w-[210px]">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-muted">Nghi phạm còn lại:</span>
                <span className="font-bold tabular-nums text-foreground">
                  {remainingCount} <span className="text-muted/70 font-normal">/ 24</span>
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-surface-hover overflow-hidden border border-border/50">
                <div
                  className="h-full transition-all duration-300 rounded-full bg-primary"
                  style={{
                    width: `${Math.max(4, ((24 - remainingCount) / 23) * 100)}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted font-medium">
                <span>Thu hẹp diện nghi vấn</span>
                <span className="font-bold text-primary">
                  {Math.round(((24 - remainingCount) / 24) * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Right: Stats, Strikes & Actions */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 sm:gap-5">
            {/* Questions Asked */}
            <div className="flex flex-col items-center sm:items-start">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Đã hỏi</span>
              <div className="tabular-nums text-lg font-bold text-foreground">
                {history.length} <span className="text-xs text-muted font-normal">câu</span>
              </div>
            </div>

            {/* Strikes Warning Pips */}
            <div className="flex flex-col items-center sm:items-start">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Cảnh cáo sai</span>
              <div className="flex items-center gap-1.5 pt-1">
                {[0, 1, 2].map((i) => {
                  const isStruck = i < strikes;
                  return (
                    <div
                      key={i}
                      title={isStruck ? "Đã nhận 1 cảnh cáo sai" : "Chưa có cảnh cáo"}
                      className={`flex h-6 w-6 items-center justify-center rounded-lg border transition-all ${
                        isStruck
                          ? "border-danger/40 bg-danger/10 text-danger animate-shake shadow-xs"
                          : "border-border/60 bg-surface-hover/50 text-muted/30"
                      }`}
                    >
                      {isStruck ? (
                        <XCircle className="h-3.5 w-3.5 text-google-red" />
                      ) : (
                        <div className="h-1.5 w-1.5 rounded-full bg-muted/40" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* High Score Badge */}
            {bestScore > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 shadow-2xs">
                <Trophy className="h-3.5 w-3.5" />
                <span>Kỷ lục: {bestScore}đ</span>
              </div>
            )}

            {/* Reset Button */}
            <button
              type="button"
              onClick={handleRestart}
              className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground hover:bg-surface-hover active:scale-95 transition-all shadow-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Ván mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Deduction Stage (12 Columns Layout) */}
      <div className="grid w-full grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT / CENTER: Character Cards Grid (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-3.5">
          {/* Card Controls Bar: Consistent Header & Hide-Eliminated Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-border/80 bg-surface px-4 py-2.5 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <Layers className="h-4 w-4 text-primary" />
              <span>Danh sách 24 đối tượng nghi vấn</span>
            </div>

            {/* Toggle Hide Eliminated & Reset Eliminated */}
            <div className="flex items-center gap-3 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer text-muted hover:text-foreground transition-colors">
                <input
                  type="checkbox"
                  checked={hideEliminated}
                  onChange={(e) => setHideEliminated(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                />
                <span className="text-[11px] font-medium">Ẩn thẻ đã úp</span>
              </label>

              {eliminatedIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    playSound("flip_up");
                    setEliminatedIds(new Set());
                  }}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  Mở lại tất cả ({eliminatedIds.size})
                </button>
              )}
            </div>
          </div>

          {/* Prompt Banner when candidate pool narrows */}
          {remainingCount <= 3 && remainingCount > 1 && (
            <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-3.5 py-2 text-xs text-primary font-semibold">
              <span className="flex items-center gap-1.5">
                <Target className="h-4 w-4 shrink-0 text-primary" />
                <span>Chỉ còn {remainingCount} nghi phạm trong danh sách! Hãy bấm &quot;Đoán&quot; đối tượng bạn nghi ngờ nhất!</span>
              </span>
            </div>
          )}
          {remainingCount === 1 && (
            <div className="flex items-center justify-between rounded-xl border border-google-green/40 bg-google-green/10 px-3.5 py-2 text-xs text-google-green font-bold shadow-xs">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 shrink-0 text-google-green" />
                <span>Chỉ còn duy nhất 1 ứng viên! Hãy chọn đối tượng này để kết thúc vụ án!</span>
              </span>
            </div>
          )}

          {/* 24 Suspect Dossier Cards Grid (All 24 completely uniform) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {displayCharacters.map((char) => {
              const isEliminated = eliminatedIds.has(char.id);
              const LogoComponent = BRAND_LOGOS[char.id];

              return (
                <div
                  key={char.id}
                  onClick={() => toggleEliminate(char.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleEliminate(char.id);
                    }
                  }}
                  className={`group relative flex min-h-[195px] flex-col justify-between rounded-2xl border p-3.5 transition-all duration-200 cursor-pointer select-none text-left ${
                    isEliminated
                      ? "border-border/60 bg-surface/40 opacity-35 grayscale-[90%] hover:opacity-75 shadow-none"
                      : "border-border bg-surface shadow-xs hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5"
                  }`}
                >
                  {/* Top Row: Logo, Launch Year Badge & Flip Button */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      {/* Logo Frame */}
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-hover/80 p-2 border border-border/50 shadow-2xs">
                        {LogoComponent ? (
                          <LogoComponent className="h-7 w-7" />
                        ) : (
                          <Sparkles className="h-6 w-6 text-primary" />
                        )}
                      </div>

                      {/* Launch Year Badge & Flip Toggle */}
                      <div className="flex items-center gap-1.5">
                        <span className="flex items-center gap-1 rounded-full bg-surface-hover border border-border px-2 py-0.5 text-[10px] font-semibold text-muted">
                          <Calendar className="h-2.5 w-2.5" />
                          <span>{char.launchYear}</span>
                        </span>

                        <div
                          title={isEliminated ? "Bấm để mở lại thẻ" : "Bấm để úp thẻ"}
                          className={`flex h-6 w-6 items-center justify-center rounded-full border transition-all ${
                            isEliminated
                              ? "border-border bg-surface-hover text-muted"
                              : "border-transparent text-muted/40 group-hover:border-border group-hover:bg-surface-hover group-hover:text-muted"
                          }`}
                        >
                          {isEliminated ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Character Name */}
                    <h4 className="text-xs sm:text-sm font-bold text-foreground leading-tight line-clamp-1">
                      {char.name}
                    </h4>

                    {/* Category Label (Uniform on all cards) */}
                    <div className="mt-1">
                      <span className="inline-block rounded-md bg-primary/8 border border-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary line-clamp-1">
                        {char.categoryLabel}
                      </span>
                    </div>

                    {/* Summary / Tagline */}
                    <p className="mt-1.5 text-[11px] text-muted line-clamp-2 leading-relaxed">
                      {char.tagline}
                    </p>
                  </div>

                  {/* Bottom Action Row: Hint & Guess Button */}
                  <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between gap-1">
                    <span className="text-[10px] text-muted/70 font-medium">
                      {isEliminated ? "Đã úp" : "Bấm để úp"}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSuspectToGuess(char);
                      }}
                      className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-on-primary transition-all active:scale-95 shadow-2xs"
                    >
                      <Target className="h-3 w-3" />
                      <span>Đoán</span>
                    </button>
                  </div>

                  {/* Eliminated Watermark Overlay */}
                  {isEliminated && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-surface/60 backdrop-blur-[1px]">
                      <span className="flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-[10px] font-bold text-muted shadow-xs">
                        <EyeOff className="h-3 w-3" />
                        <span>ĐÃ LOẠI TRỪ</span>
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Questions Console & Clues History (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Question Selector Console */}
          <div className="flex flex-col gap-3.5 rounded-2xl border border-border bg-surface p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                <HelpCircle className="h-4 w-4 text-primary" />
                <span>Hỏi manh mối điều tra</span>
              </h3>
              <span className="text-[10px] font-semibold text-muted bg-surface-hover px-2 py-0.5 rounded-full border border-border">
                -50đ / câu
              </span>
            </div>

            {/* Category Filter Chips */}
            <div className="flex flex-wrap items-center gap-1 border-b border-border/60 pb-2.5">
              {[
                { id: "all", label: "Tất cả", icon: Layers },
                { id: "tier", label: "Đối tượng", icon: SlidersHorizontal },
                { id: "domain", label: "Lĩnh vực & AI", icon: Cpu },
                { id: "brand", label: "Thương hiệu", icon: Palette },
                { id: "timeline", label: "Thời đại", icon: Clock },
                { id: "special", label: "Đặc thù", icon: Sparkles },
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isSelected = activeCategoryTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveCategoryTab(tab.id as QuestionCategory);
                      setCustomQuery("");
                    }}
                    className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all ${
                      isSelected
                        ? "bg-primary text-on-primary shadow-xs"
                        : "text-muted hover:bg-surface-hover hover:text-foreground"
                    }`}
                  >
                    <TabIcon className="h-3 w-3" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Smart Question Filter Input */}
            <form onSubmit={handleCustomQuery} className="relative">
              <input
                type="text"
                placeholder="Gõ tìm kiếm câu hỏi (vd: AI, mã nguồn mở, đỏ)..."
                value={customQuery}
                onChange={(e) => {
                  setCustomQuery(e.target.value);
                  if (searchNotice) setSearchNotice(null);
                }}
                disabled={gameState !== "playing"}
                className="w-full rounded-xl border border-border bg-background pl-8 pr-10 py-2 text-xs text-foreground placeholder:text-muted focus:border-primary focus:outline-none transition-colors"
              />
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted" />
              <button
                type="submit"
                disabled={!customQuery.trim() || gameState !== "playing"}
                className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-on-primary transition-opacity disabled:opacity-30"
                title="Hỏi câu này"
              >
                <Send className="h-3 w-3" />
              </button>
            </form>

            {/* Inline Friendly Hint Notice */}
            {searchNotice && (
              <div className="flex items-start gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-[11px] text-amber-700 dark:text-amber-300">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{searchNotice}</span>
              </div>
            )}

            {/* Questions List (No Right/Wrong Counts) */}
            <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto pr-1">
              {filteredQuestions.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted">
                  Không tìm thấy câu hỏi phù hợp. Hãy thử xóa từ khóa tìm kiếm.
                </div>
              ) : (
                filteredQuestions.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => askQuestion(q.id)}
                    disabled={gameState !== "playing"}
                    className="group flex flex-col items-start gap-1 rounded-xl border border-border/80 bg-background p-2.5 text-left text-xs font-medium text-foreground transition-all hover:bg-surface-hover hover:border-primary/40 active:scale-[0.99] disabled:opacity-50 shadow-2xs"
                  >
                    <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
                      {q.categoryLabel}
                    </span>
                    <span className="line-clamp-2 leading-relaxed text-[11px] font-semibold text-foreground group-hover:text-primary transition-colors">
                      {q.text}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Clues History Deck & Assistant */}
          <div className="flex flex-1 flex-col rounded-2xl border border-border bg-surface p-4 shadow-xs min-h-[290px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <span>Nhật ký manh mối</span>
                <span className="rounded-full bg-surface-hover px-2 py-0.2 text-[10px] font-bold text-foreground">
                  {history.length}
                </span>
              </h3>

              {history.length > 0 && (
                <span className="text-[10px] text-muted font-medium">Mới nhất ở trên</span>
              )}
            </div>

            {history.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center text-xs text-muted p-6">
                <HelpCircle className="h-8 w-8 text-muted/30 mb-2" />
                <p>Chọn câu hỏi đầu tiên ở bảng trên để bắt đầu thu thập manh mối điều tra!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[380px] pr-1">
                {history.map((h, i) => {
                  const uneliminatedNonMatches = h.eliminatedIds.filter((id) => !eliminatedIds.has(id));

                  return (
                    <div key={i} className="rounded-xl border border-border/80 bg-background p-3 text-xs shadow-2xs">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-bold text-foreground line-clamp-1">{h.questionText}</span>
                        {h.answer ? (
                          <span className="shrink-0 flex items-center gap-1 font-bold text-google-green bg-google-green/10 border border-google-green/30 px-2 py-0.5 rounded-full text-[10px]">
                            <CheckCircle2 className="h-3 w-3" /> ĐÚNG
                          </span>
                        ) : (
                          <span className="shrink-0 flex items-center gap-1 font-bold text-google-red bg-google-red/10 border border-google-red/30 px-2 py-0.5 rounded-full text-[10px]">
                            <XCircle className="h-3 w-3" /> SAI
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-muted leading-relaxed mb-2">{h.explanation}</p>

                      {/* Quick Auto-Eliminate Assistant Button */}
                      {uneliminatedNonMatches.length > 0 && gameState === "playing" && (
                        <button
                          type="button"
                          onClick={() => handleQuickEliminate(h)}
                          className="flex items-center gap-1 rounded-lg bg-surface hover:bg-surface-hover border border-border px-2.5 py-1 text-[10px] font-bold text-primary transition-all active:scale-95"
                        >
                          <EyeOff className="h-3 w-3" />
                          <span>Úp nhanh {uneliminatedNonMatches.length} thẻ không khớp</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Guess Modal */}
      {suspectToGuess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="flex w-full max-w-sm flex-col items-center rounded-3xl border border-border bg-surface p-6 shadow-2xl text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
              <Target className="h-6 w-6" />
            </div>

            <h3 className="text-lg font-bold text-foreground">Xác nhận nghi phạm</h3>
            <p className="text-xs text-muted mt-1">
              Bạn có chắc chắn đây là đối tượng bí ẩn của hồ sơ?
            </p>

            <div className="my-4 flex flex-col items-center gap-2 rounded-2xl border border-border/80 bg-background p-4 w-full">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface p-2 shadow-2xs border border-border/50">
                {BRAND_LOGOS[suspectToGuess.id] ? (
                  (() => {
                    const Logo = BRAND_LOGOS[suspectToGuess.id];
                    return <Logo className="h-8 w-8" />;
                  })()
                ) : (
                  <Sparkles className="h-8 w-8 text-primary" />
                )}
              </div>
              <span className="text-base font-bold text-foreground">{suspectToGuess.name}</span>
              <div className="flex items-center gap-2 text-[10px] text-muted">
                <span className="rounded-md bg-primary/8 border border-primary/15 px-1.5 py-0.5 text-primary font-medium">
                  {suspectToGuess.categoryLabel}
                </span>
                <span>•</span>
                <span>Năm {suspectToGuess.launchYear}</span>
              </div>
              <p className="text-xs text-muted leading-relaxed mt-1">{suspectToGuess.tagline}</p>
              {suspectToGuess.techLore && (
                <p className="text-[10px] text-muted italic mt-1 border-t border-border/40 pt-1.5">
                  &ldquo;{suspectToGuess.techLore}&rdquo;
                </p>
              )}
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs text-muted mb-5">
              <span>Đoán sai sẽ bị 1 cảnh cáo</span>
              <span className="font-bold text-google-red">({strikes + 1}/3 lần)</span>
            </div>

            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={() => setSuspectToGuess(null)}
                className="flex-1 rounded-full border border-border py-2.5 text-xs font-semibold text-muted hover:bg-surface-hover transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => confirmGuess(suspectToGuess)}
                className="flex-1 rounded-full bg-primary py-2.5 text-xs font-bold text-on-primary shadow-sm hover:opacity-90 active:scale-95 transition-all"
              >
                Xác nhận đoán
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Win Modal */}
      {gameState === "won" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
          <div className="flex w-full max-w-md flex-col items-center rounded-3xl border border-border bg-surface p-7 sm:p-8 shadow-2xl text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 mb-3 shadow-inner">
              <PartyPopper className="h-8 w-8" />
            </div>

            <h2 className="text-2xl font-bold text-foreground">Phá Án Thành Công!</h2>
            <div className="inline-flex items-center gap-1 mt-1 rounded-full bg-primary/10 border border-primary/20 px-3 py-0.5 text-xs font-bold text-primary">
              <Sparkles className="h-3 w-3" />
              <span>{getDetectiveTitle()}</span>
            </div>

            {/* Target Card Highlight */}
            <div className="my-5 flex flex-col items-center gap-2 rounded-2xl border border-google-green/30 bg-google-green/5 p-4 w-full">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface p-2 shadow-sm border border-border">
                {BRAND_LOGOS[target.id] ? (
                  (() => {
                    const Logo = BRAND_LOGOS[target.id];
                    return <Logo className="h-10 w-10" />;
                  })()
                ) : (
                  <Sparkles className="h-10 w-10 text-primary" />
                )}
              </div>
              <span className="text-xl font-bold text-foreground">{target.name}</span>
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="rounded-md bg-primary/8 border border-primary/15 px-2 py-0.5 text-primary font-medium">
                  {target.categoryLabel}
                </span>
                <span>•</span>
                <span>Năm {target.launchYear}</span>
              </div>
              <p className="text-xs text-muted">{target.tagline}</p>
              {target.techLore && (
                <p className="text-[11px] text-muted italic bg-surface/80 rounded-xl p-2.5 border border-border/50 mt-1">
                  &ldquo;{target.techLore}&rdquo;
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 w-full mb-6">
              <div className="rounded-xl border border-border bg-background p-3 text-center">
                <div className="text-[10px] text-muted uppercase font-bold">Số câu hỏi đã dùng</div>
                <div className="text-xl font-bold text-google-blue">{history.length}</div>
              </div>
              <div className="rounded-xl border border-border bg-background p-3 text-center">
                <div className="text-[10px] text-muted uppercase font-bold">Điểm điều tra</div>
                <div className="text-xl font-bold text-google-green">
                  {calculateScore(history.length, strikes)}đ
                </div>
              </div>
            </div>

            <button
              onClick={handleRestart}
              className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-bold text-on-primary shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Chơi ván tiếp theo</span>
            </button>
          </div>
        </div>
      )}

      {/* Lost Modal */}
      {gameState === "lost" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
          <div className="flex w-full max-w-md flex-col items-center rounded-3xl border border-border bg-surface p-7 sm:p-8 shadow-2xl text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-google-red/15 text-google-red mb-3">
              <Skull className="h-8 w-8" />
            </div>

            <h2 className="text-2xl font-bold text-foreground">Hồ Sơ Chưa Được Phá Giải</h2>
            <p className="mt-1 text-xs text-muted">
              Bạn đã nhận 3 cảnh cáo đoán sai. Đối tượng bí ẩn chính xác là:
            </p>

            <div className="my-4 flex flex-col items-center gap-2 rounded-2xl border border-border/80 bg-background p-4 w-full">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface p-2 shadow-sm border border-border/50">
                {BRAND_LOGOS[target.id] ? (
                  (() => {
                    const Logo = BRAND_LOGOS[target.id];
                    return <Logo className="h-8 w-8" />;
                  })()
                ) : (
                  <Sparkles className="h-8 w-8 text-primary" />
                )}
              </div>
              <span className="text-lg font-bold text-foreground">{target.name}</span>
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="rounded-md bg-primary/8 border border-primary/15 px-1.5 py-0.5 text-primary font-medium">
                  {target.categoryLabel}
                </span>
                <span>•</span>
                <span>Năm {target.launchYear}</span>
              </div>
              <p className="text-xs text-muted">{target.tagline}</p>
            </div>

            <button
              onClick={handleRestart}
              className="mt-3 flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-bold text-on-primary shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Thử lại ván mới</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


