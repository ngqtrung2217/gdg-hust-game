"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  Send,
  Zap,
  Crown,
  Sparkles,
  Layers,
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

export function GuessWho() {
  const [target, setTarget] = useState<Character>(() => pickRandomTarget());
  const [eliminatedIds, setEliminatedIds] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<AnswerResult[]>([]);
  const [activeCategoryTab, setActiveCategoryTab] = useState<QuestionCategory>("all");
  const [customQuery, setCustomQuery] = useState("");
  const [strikes, setStrikes] = useState(0);
  const [gameState, setGameState] = useState<"playing" | "won" | "lost">("playing");
  const [suspectToGuess, setSuspectToGuess] = useState<Character | null>(null);
  const [bestScore, setBestScore] = useState(0);
  const [selectedFilterTier, setSelectedFilterTier] = useState<"all" | "consumer" | "developer" | "boss">("all");

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
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.06);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === "flip_up") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(540, now + 0.06);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === "correct") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === "strike") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.linearRampToValueAtTime(90, now + 0.25);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === "win") {
        // Arpeggio C - E - G - C6
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = "triangle";
          o.frequency.value = freq;
          g.gain.setValueAtTime(0.1, now + i * 0.08);
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

  // Toggle card face manual
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

  // Submit freeform question
  const handleCustomQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim() || gameState !== "playing") return;

    const matched = matchFreeformQuestion(customQuery);
    if (matched) {
      askQuestion(matched.id);
      setCustomQuery("");
    } else {
      alert("Hệ thống chưa hiểu câu hỏi này. Bạn hãy chọn câu hỏi tương ứng trong các danh mục gợi ý bên dưới nhé!");
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
      const currentScore = calculateScore(history.length, strikes, target.isBoss);
      if (currentScore > bestScore) {
        setBestScore(currentScore);
        localStorage.setItem("guess-who-best", String(currentScore));
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

  // Questions filtered by category
  const filteredQuestions = useMemo(() => {
    if (activeCategoryTab === "all") return QUESTIONS;
    return QUESTIONS.filter((q) => q.category === activeCategoryTab);
  }, [activeCategoryTab]);

  // Display characters filtered by view tab
  const displayCharacters = useMemo(() => {
    if (selectedFilterTier === "all") return CHARACTERS;
    return CHARACTERS.filter((c) => c.tier === selectedFilterTier);
  }, [selectedFilterTier]);

  return (
    <div className="flex w-full flex-col items-center gap-5 select-none max-w-7xl mx-auto px-2">
      {/* Top Header Bar: Stats, Strikes, Best Score, Reset */}
      <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-5 py-3.5 shadow-sm">
        <div className="flex items-center gap-5 sm:gap-7">
          {/* Candidates Counter */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Còn lại</div>
            <div className="tabular-nums text-2xl font-black text-foreground flex items-center gap-1.5">
              <span>{remainingCount}</span>
              <span className="text-xs text-muted font-semibold">/ 24</span>
            </div>
          </div>

          {/* Question Count */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Đã hỏi</div>
            <div className="tabular-nums text-2xl font-black text-google-blue">
              {history.length}
            </div>
          </div>

          {/* Strikes Counter */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Cảnh cáo sai</div>
            <div className="flex items-center gap-1.5 pt-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <XCircle
                  key={i}
                  className={`h-5 w-5 transition-colors ${
                    i < strikes ? "text-google-red fill-google-red/20" : "text-muted/20"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Actions: High Score, Clue Prompt & Restart */}
        <div className="flex items-center gap-3">
          {bestScore > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-google-yellow/15 border border-google-yellow/30 px-3 py-1 text-xs font-bold text-google-yellow shadow-sm">
              <Trophy className="h-3.5 w-3.5" />
              <span>Kỷ lục: {bestScore}đ</span>
            </div>
          )}

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleRestart}
            className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-muted transition-all hover:bg-surface-hover hover:text-foreground active:scale-95 shadow-sm"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Ván mới</span>
          </button>
        </div>
      </div>

      {/* Main Grid & Control Layout (12 columns) */}
      <div className="grid w-full grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT / CENTER: 24 Cards Grid (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          {/* Card Filter Bar & Hint */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            {/* Filter by Tier */}
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <span className="text-muted mr-1 font-bold">Lọc xem:</span>
              {[
                { id: "all", label: "Tất cả (24)", icon: Layers },
                { id: "consumer", label: "Phổ thông (15)", icon: Sparkles },
                { id: "developer", label: "Developer (6)", icon: Zap },
                { id: "boss", label: "Thẻ Boss (3)", icon: Crown },
              ].map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedFilterTier(tab.id as typeof selectedFilterTier)}
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition-all ${
                      selectedFilterTier === tab.id
                        ? "bg-primary text-on-primary shadow-sm"
                        : "border border-border bg-surface text-muted hover:bg-surface-hover"
                    }`}
                  >
                    <TabIcon className="h-3 w-3" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Clue Prompt */}
            {remainingCount <= 3 && remainingCount > 1 && (
              <div className="flex items-center gap-1 text-[11px] font-bold text-google-blue bg-google-blue/10 border border-google-blue/30 px-2.5 py-0.5 rounded-full animate-pulse">
                <span>🎯 Chỉ còn {remainingCount} thẻ! Hãy suy luận để đoán!</span>
              </div>
            )}
            {remainingCount === 1 && (
              <div className="flex items-center gap-1 text-[11px] font-bold text-google-green bg-google-green/10 border border-google-green/30 px-2.5 py-0.5 rounded-full animate-bounce">
                <span>⭐ Chỉ còn 1 ứng viên duy nhất! Bấm ĐOÁN ngay!</span>
              </div>
            )}
          </div>

          {/* 24 Cards Responsive Grid: 6 cols on desktop, 4 cols on md, 3 on sm, 2 on xs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 [perspective:1000px]">
            {displayCharacters.map((char) => {
              const isEliminated = eliminatedIds.has(char.id);
              const LogoComponent = BRAND_LOGOS[char.id];

              // Boss Card Special Styling
              const isBossCard = char.tier === "boss";

              return (
                <div
                  key={char.id}
                  onClick={() => toggleEliminate(char.id)}
                  className={`relative flex min-h-[195px] flex-col justify-between rounded-2xl border p-3 transition-all duration-300 cursor-pointer select-none [transform-style:preserve-3d] ${
                    isBossCard
                      ? isEliminated
                        ? "border-purple-500/20 bg-surface/30 opacity-30 [transform:rotateX(-65deg)] grayscale scale-95"
                        : "border-purple-500/50 bg-surface shadow-md ring-1 ring-purple-500/30 hover:border-purple-400 hover:shadow-purple-500/20 hover:shadow-lg hover:-translate-y-1"
                      : isEliminated
                      ? "border-border/40 bg-surface/30 opacity-30 [transform:rotateX(-65deg)] grayscale scale-95 shadow-none"
                      : "border-border bg-surface shadow-sm hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5"
                  }`}
                >
                  {/* Top: Logo & Tier Badge */}
                  <div>
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-hover/80 p-1.5 shadow-sm border border-border/40">
                        {LogoComponent ? (
                          <LogoComponent className="h-7 w-7" />
                        ) : (
                          <Sparkles className="h-6 w-6 text-primary" />
                        )}
                      </div>

                      {/* Tier Tag */}
                      {isBossCard ? (
                        <span className="flex items-center gap-0.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-1.5 py-0.5 text-[9px] font-black text-white shadow-sm">
                          <Crown className="h-2.5 w-2.5 fill-current" />
                          <span>BOSS</span>
                        </span>
                      ) : char.tier === "developer" ? (
                        <span className="rounded-full bg-blue-500/15 border border-blue-500/30 px-1.5 py-0.5 text-[9px] font-bold text-google-blue">
                          DEV
                        </span>
                      ) : (
                        <span className="rounded-full bg-surface-hover border border-border px-1.5 py-0.5 text-[9px] font-semibold text-muted">
                          {char.launchYear}
                        </span>
                      )}
                    </div>

                    {/* Character Title */}
                    <h4 className="text-xs font-bold text-foreground leading-tight line-clamp-1">
                      {char.name}
                    </h4>
                    <p className="mt-1 text-[10px] text-muted line-clamp-2 leading-relaxed">
                      {char.tagline}
                    </p>
                  </div>

                  {/* Bottom: Action & Year */}
                  <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between">
                    <span className="text-[9px] font-semibold text-muted/80">
                      {char.categoryLabel.split(" ")[0]}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSuspectToGuess(char);
                      }}
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-all active:scale-95 shadow-sm ${
                        isBossCard
                          ? "bg-purple-600 text-white hover:bg-purple-700"
                          : "bg-primary/10 text-primary hover:bg-primary hover:text-on-primary"
                      }`}
                    >
                      Đoán
                    </button>
                  </div>

                  {/* Face down overlay badge */}
                  {isEliminated && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-zinc-900/90 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-md">
                      <EyeOff className="h-2.5 w-2.5" />
                      <span>Đã úp</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Questions Deck & Clues History (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Question Selector Deck */}
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                <HelpCircle className="h-4 w-4 text-google-blue" />
                <span>Chọn câu hỏi thám tử</span>
              </h3>
              <span className="text-[10px] font-bold text-muted bg-surface-hover px-2 py-0.5 rounded-full border border-border">
                -50đ / câu
              </span>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap items-center gap-1 border-b border-border/60 pb-2">
              {[
                { id: "all", label: "Tất cả" },
                { id: "tier", label: "Phân loại" },
                { id: "domain", label: "Lĩnh vực/AI" },
                { id: "brand", label: "Thương hiệu" },
                { id: "timeline", label: "Thời đại" },
                { id: "special", label: "Đặc thù" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategoryTab(tab.id as QuestionCategory)}
                  className={`rounded-lg px-2 py-1 text-[11px] font-bold transition-all ${
                    activeCategoryTab === tab.id
                      ? "bg-primary text-on-primary shadow-sm"
                      : "text-muted hover:bg-surface-hover hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Questions List */}
            <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
              {filteredQuestions.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => askQuestion(q.id)}
                  disabled={gameState !== "playing"}
                  className="group flex flex-col items-start gap-1 rounded-xl border border-border bg-background p-2.5 text-left text-xs font-medium text-foreground transition-all hover:bg-surface-hover hover:border-primary/40 active:scale-95 disabled:opacity-50 shadow-sm"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
                      {q.categoryLabel}
                    </span>
                    <span className="text-[10px] font-semibold text-google-blue bg-google-blue/10 px-1.5 py-0.2 rounded">
                      {q.hintSplit}
                    </span>
                  </div>
                  <span className="line-clamp-2 leading-relaxed text-[11px] font-semibold text-foreground group-hover:text-primary">
                    {q.text}
                  </span>
                </button>
              ))}
            </div>

            {/* Freeform Search / Question Input */}
            <form onSubmit={handleCustomQuery} className="relative mt-1">
              <input
                type="text"
                placeholder="Hoặc gõ câu hỏi (vd: có phải AI, thẻ boss, màu đỏ?)..."
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                disabled={gameState !== "playing"}
                className="w-full rounded-xl border border-border bg-background pl-8 pr-10 py-2.5 text-xs text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
              />
              <Search className="absolute left-2.5 top-3 h-3.5 w-3.5 text-muted" />
              <button
                type="submit"
                disabled={!customQuery.trim() || gameState !== "playing"}
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-on-primary transition-opacity disabled:opacity-30"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>

          {/* Clues History & Detective Assistant */}
          <div className="flex flex-1 flex-col rounded-2xl border border-border bg-surface p-4 shadow-sm min-h-[280px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <span>Manh mối điều tra</span>
                <span className="rounded-full bg-surface-hover px-2 py-0.2 text-[10px] font-bold text-foreground">
                  {history.length}
                </span>
              </h3>

              {history.length > 0 && (
                <span className="text-[10px] text-muted">Mới nhất ở trên</span>
              )}
            </div>

            {history.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center text-xs text-muted p-6">
                <HelpCircle className="h-8 w-8 text-muted/40 mb-2" />
                <p>Hãy chọn câu hỏi đầu tiên ở bảng trên để bắt đầu thu hẹp phạm vi nghi phạm!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[360px] pr-1">
                {history.map((h, i) => {
                  // Calculate how many of the currently uneliminated cards can be eliminated
                  const uneliminatedNonMatches = h.eliminatedIds.filter((id) => !eliminatedIds.has(id));

                  return (
                    <div key={i} className="rounded-xl border border-border bg-background p-3 text-xs shadow-sm">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-bold text-foreground line-clamp-1">{h.questionText}</span>
                        {h.answer ? (
                          <span className="shrink-0 flex items-center gap-1 font-black text-google-green bg-google-green/10 border border-google-green/30 px-2 py-0.5 rounded-full text-[11px]">
                            <CheckCircle2 className="h-3.5 w-3.5" /> ĐÚNG
                          </span>
                        ) : (
                          <span className="shrink-0 flex items-center gap-1 font-black text-google-red bg-google-red/10 border border-google-red/30 px-2 py-0.5 rounded-full text-[11px]">
                            <XCircle className="h-3.5 w-3.5" /> SAI
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="flex w-full max-w-sm flex-col items-center rounded-3xl border border-border bg-surface p-6 shadow-2xl text-center">
            <h3 className="text-lg font-black text-foreground">Bạn có chắc chắn muốn đoán?</h3>

            <div className="my-4 flex flex-col items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-4 w-full">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface p-2 shadow-sm border border-border/40">
                {BRAND_LOGOS[suspectToGuess.id] ? (
                  (() => {
                    const Logo = BRAND_LOGOS[suspectToGuess.id];
                    return <Logo className="h-8 w-8" />;
                  })()
                ) : (
                  <Sparkles className="h-8 w-8 text-primary" />
                )}
              </div>
              <span className="text-lg font-black text-primary">{suspectToGuess.name}</span>
              <p className="text-xs text-muted leading-relaxed">{suspectToGuess.tagline}</p>
              {suspectToGuess.techLore && (
                <p className="text-[10px] text-muted/80 italic mt-1 border-t border-border/40 pt-1">
                  &ldquo;{suspectToGuess.techLore}&rdquo;
                </p>
              )}
            </div>

            <p className="flex items-center justify-center gap-1 text-xs text-muted mb-4">
              Nếu đoán sai, bạn sẽ nhận 1 cảnh cáo <XCircle className="inline h-3.5 w-3.5 text-google-red" /> (tối đa 3 lần).
            </p>

            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={() => setSuspectToGuess(null)}
                className="flex-1 rounded-full border border-border py-2.5 text-xs font-semibold text-muted hover:bg-surface-hover"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => confirmGuess(suspectToGuess)}
                className="flex-1 rounded-full bg-primary py-2.5 text-xs font-bold text-on-primary shadow-md hover:opacity-90 active:scale-95"
              >
                Xác nhận đoán!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Win Modal */}
      {gameState === "won" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in zoom-in">
          <div className="flex w-full max-w-md flex-col items-center rounded-3xl border border-border bg-surface p-8 shadow-2xl text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-google-yellow/20 text-google-yellow mb-3 shadow-inner">
              <PartyPopper className="h-10 w-10" />
            </div>

            <h2 className="text-2xl font-black text-foreground">Xuất Sắc! Bạn Đã Thắng!</h2>
            <p className="text-xs font-bold text-google-blue mt-0.5">
              Danh hiệu: {getDetectiveTitle()}
            </p>

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
              <span className="text-xl font-black text-foreground">{target.name}</span>
              <p className="text-xs text-muted">{target.tagline}</p>
              {target.techLore && (
                <p className="text-[11px] text-muted/90 italic bg-surface/60 rounded-xl p-2.5 border border-border/40 mt-1">
                  &ldquo;{target.techLore}&rdquo;
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 w-full mb-5">
              <div className="rounded-2xl border border-border bg-background p-3 text-center">
                <div className="text-[10px] text-muted uppercase font-bold">Số câu hỏi đã hỏi</div>
                <div className="text-xl font-black text-google-blue">{history.length}</div>
              </div>
              <div className="rounded-2xl border border-border bg-background p-3 text-center">
                <div className="text-[10px] text-muted uppercase font-bold">Điểm đạt được</div>
                <div className="text-xl font-black text-google-green">
                  {calculateScore(history.length, strikes, target.isBoss)}đ
                </div>
              </div>
            </div>

            <button
              onClick={handleRestart}
              className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-bold text-on-primary shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              <RotateCcw className="h-4 w-4" />
              Chơi ván tiếp theo
            </button>
          </div>
        </div>
      )}

      {/* Lost Modal */}
      {gameState === "lost" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in zoom-in">
          <div className="flex w-full max-w-md flex-col items-center rounded-3xl border border-border bg-surface p-8 shadow-2xl text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-google-red/20 text-google-red mb-3">
              <Skull className="h-10 w-10" />
            </div>

            <h2 className="text-2xl font-black text-foreground">Rất tiếc, bạn đã thua!</h2>
            <p className="mt-1 text-xs text-muted">
              Bạn đã nhận 3 cảnh cáo đoán sai. Đối tượng bí ẩn chính xác là:
            </p>

            <div className="my-4 flex flex-col items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-4 w-full">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface p-2 shadow-sm border border-border/40">
                {BRAND_LOGOS[target.id] ? (
                  (() => {
                    const Logo = BRAND_LOGOS[target.id];
                    return <Logo className="h-8 w-8" />;
                  })()
                ) : (
                  <Sparkles className="h-8 w-8 text-primary" />
                )}
              </div>
              <span className="text-lg font-black text-primary">{target.name}</span>
              <p className="text-xs text-muted">{target.tagline}</p>
            </div>

            <button
              onClick={handleRestart}
              className="mt-2 flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-bold text-on-primary shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              <RotateCcw className="h-4 w-4" />
              Thử lại ván mới
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
