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
  Sparkles,
  Globe,
  Bot,
  PlayCircle,
  Mail,
  Layers,
  MapPin,
  BrainCircuit,
  HardDrive,
  Terminal,
  Footprints,
  Cloud,
  Smartphone,
  Languages,
  Image as ImageIcon,
  Users2,
  Search,
  EyeOff,
  Send,
} from "lucide-react";
import { CHARACTERS, type Character } from "./characters";
import {
  QUESTIONS,
  calculateScore,
  evaluateQuestion,
  matchFreeformQuestion,
  pickRandomTarget,
  type AnswerResult,
} from "./logic";

const ICON_MAP: Record<string, React.ElementType> = {
  Sparkles,
  Globe,
  Bot,
  PlayCircle,
  Mail,
  Layers,
  MapPin,
  BrainCircuit,
  HardDrive,
  Terminal,
  Footprints,
  Cloud,
  Smartphone,
  Languages,
  Image: ImageIcon,
  Users2,
};

export function GuessWho() {
  const [target, setTarget] = useState<Character>(() => pickRandomTarget());
  const [eliminatedIds, setEliminatedIds] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<AnswerResult[]>([]);
  const [activeCategoryTab, setActiveCategoryTab] = useState<"type" | "feature" | "color" | "time">("type");
  const [customQuery, setCustomQuery] = useState("");
  const [strikes, setStrikes] = useState(0);
  const [gameState, setGameState] = useState<"playing" | "won" | "lost">("playing");
  const [suspectToGuess, setSuspectToGuess] = useState<Character | null>(null);
  const [bestScore, setBestScore] = useState(0);

  // Load high score
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

  // Web Audio card flip sound
  const playCardSound = useCallback((down = true) => {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(down ? 440 : 660, now);
      osc.frequency.exponentialRampToValueAtTime(down ? 220 : 880, now + 0.05);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Audio fallback
    }
  }, []);

  // Toggle card face manual
  const toggleEliminate = (id: string) => {
    if (gameState !== "playing") return;
    const isNowEliminated = !eliminatedIds.has(id);
    playCardSound(isNowEliminated);
    setEliminatedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Submit predefined question (System only answers; user manually flips cards based on deduction)
  const askQuestion = (qId: string) => {
    if (!qId || gameState !== "playing") return;
    const res = evaluateQuestion(qId, target);
    if (!res) return;

    setHistory((prev) => [res, ...prev]);
    playCardSound(res.answer);
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
      // Unrecognized question
      alert("Hệ thống chưa hiểu câu hỏi này. Bạn hãy chọn từ danh sách câu hỏi gợi ý bên cạnh nhé!");
    }
  };

  // Guess suspect
  const confirmGuess = (char: Character) => {
    if (gameState !== "playing") return;

    if (char.id === target.id) {
      // Won!
      setGameState("won");
      const currentScore = calculateScore(history.length, strikes);
      if (currentScore > bestScore) {
        setBestScore(currentScore);
        localStorage.setItem("guess-who-best", String(currentScore));
      }
    } else {
      // Wrong guess
      const nextStrikes = strikes + 1;
      setStrikes(nextStrikes);
      // Eliminate this suspect
      setEliminatedIds((prev) => new Set(prev).add(char.id));
      setSuspectToGuess(null);

      if (nextStrikes >= 3) {
        setGameState("lost");
      }
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-6 select-none max-w-5xl">
      {/* Top Bar: Stats, Best score, Restart */}
      <div className="flex w-full flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface px-6 py-3.5 shadow-sm">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted">Còn lại</div>
            <div className="tabular-nums text-2xl font-extrabold text-foreground">
              {remainingCount} / {CHARACTERS.length}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted">Câu hỏi đã hỏi</div>
            <div className="tabular-nums text-2xl font-extrabold text-google-blue">
              {history.length}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted">Cảnh cáo</div>
            <div className="flex items-center gap-1.5 pt-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <XCircle
                  key={i}
                  className={`h-5 w-5 ${
                    i < strikes ? "text-google-red fill-google-red/20" : "text-muted/30"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {bestScore > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-google-yellow/10 px-3.5 py-1.5 text-xs font-bold text-google-yellow">
              <Trophy className="h-4 w-4" /> Kỷ lục: {bestScore}đ
            </div>
          )}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleRestart}
            className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-muted transition-colors hover:bg-surface-hover hover:text-foreground active:scale-95"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Ván mới
          </button>
        </div>
      </div>

      {/* Main Layout: 2 Columns (Left: Card Grid, Right: Question Panel & Log) */}
      <div className="grid w-full grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Character Grid (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-muted">
              Nhấp vào thẻ bài để lật úp / lật mở theo suy luận của bạn:
            </span>
            <span className="text-xs font-bold text-muted">
              Đang mở: <strong className="text-google-blue">{remainingCount}/16</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 [perspective:1000px]">
            {CHARACTERS.map((char) => {
              const isEliminated = eliminatedIds.has(char.id);
              const Icon = ICON_MAP[char.iconName] ?? Sparkles;

              const stripeClass =
                char.primaryColor === "blue"
                  ? "border-t-google-blue"
                  : char.primaryColor === "red"
                  ? "border-t-google-red"
                  : char.primaryColor === "green"
                  ? "border-t-google-green"
                  : char.primaryColor === "yellow"
                  ? "border-t-google-yellow"
                  : "border-t-primary";

              return (
                <div
                  key={char.id}
                  onClick={() => toggleEliminate(char.id)}
                  className={`relative flex min-h-[195px] flex-col justify-between rounded-2xl border-t-4 border p-3.5 transition-all duration-300 cursor-pointer select-none [transform-style:preserve-3d] ${stripeClass} ${
                    isEliminated
                      ? "border-border/40 bg-surface/30 opacity-35 [transform:rotateX(-65deg)] grayscale scale-95 shadow-none"
                      : "border-border bg-surface shadow-sm hover:border-primary/50 hover:shadow-md hover:-translate-y-1"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${char.badgeColor}`}>
                        {char.categoryLabel.split(" ")[0]}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-foreground leading-tight">{char.name}</h4>
                    <p className="mt-1 text-[11px] text-muted line-clamp-2 leading-relaxed">{char.tagline}</p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between">
                    <span className="text-[10px] font-medium text-muted">Năm {char.launchYear}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSuspectToGuess(char);
                      }}
                      className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary transition-all hover:bg-primary hover:text-on-primary active:scale-95 shadow-sm"
                    >
                      Đoán
                    </button>
                  </div>

                  {/* Face down overlay icon */}
                  {isEliminated && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-zinc-900/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                      <EyeOff className="h-3 w-3" />
                      <span>Đã lật</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Question Control & Clue Log (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Question Selector Box */}
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <HelpCircle className="h-4 w-4 text-google-blue" />
              Đặt câu hỏi gợi ý
            </h3>

            {/* Interactive Question Category Tabs */}
            <div className="flex flex-wrap items-center gap-1 border-b border-border/60 pb-2">
              {[
                { id: "type", label: "Phân loại" },
                { id: "feature", label: "Đặc điểm" },
                { id: "color", label: "Màu sắc" },
                { id: "time", label: "Thời gian" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategoryTab(tab.id as "type" | "feature" | "color" | "time")}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                    activeCategoryTab === tab.id
                      ? "bg-primary text-on-primary shadow-sm"
                      : "text-muted hover:bg-surface-hover hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Questions List Deck */}
            <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-1">
              {QUESTIONS.filter((q) => q.category === activeCategoryTab).map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => askQuestion(q.id)}
                  disabled={gameState !== "playing"}
                  className="group flex items-center justify-between gap-2 rounded-xl border border-border bg-background p-2.5 text-left text-xs font-medium text-foreground transition-all hover:bg-surface-hover hover:border-primary/40 active:scale-95 disabled:opacity-50 shadow-sm"
                >
                  <span className="line-clamp-2 leading-relaxed">{q.text}</span>
                  <span className="shrink-0 rounded-md bg-google-red/10 border border-google-red/20 px-1.5 py-0.5 text-[10px] font-bold text-google-red">
                    -60đ
                  </span>
                </button>
              ))}
            </div>

            {/* Freeform Question Form */}
            <form onSubmit={handleCustomQuery} className="relative mt-1">
              <input
                type="text"
                placeholder="Hoặc gõ câu hỏi tự do..."
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

          {/* Clues History */}
          <div className="flex flex-1 flex-col rounded-2xl border border-border bg-surface p-4 shadow-sm min-h-[300px]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">
              Lịch sử manh mối ({history.length})
            </h3>

            {history.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center text-xs text-muted p-6">
                <HelpCircle className="h-8 w-8 text-muted/50 mb-2" />
                Hãy chọn câu hỏi đầu tiên từ danh sách bên trên để bắt đầu loại trừ các đối tượng!
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[360px] pr-1">
                {history.map((h, i) => (
                  <div key={i} className="rounded-xl border border-border bg-background p-3 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-foreground line-clamp-1">{h.questionText}</span>
                      {h.answer ? (
                        <span className="flex items-center gap-1 font-bold text-google-green bg-google-green/10 px-2 py-0.5 rounded-full text-[11px]">
                          <CheckCircle2 className="h-3.5 w-3.5" /> ĐÚNG
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 font-bold text-google-red bg-google-red/10 px-2 py-0.5 rounded-full text-[11px]">
                          <XCircle className="h-3.5 w-3.5" /> SAI
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted">{h.explanation}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Guess Modal */}
      {suspectToGuess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="flex w-full max-w-sm flex-col items-center rounded-3xl border border-border bg-surface p-6 shadow-2xl text-center">
            <h3 className="text-lg font-bold text-foreground">Bạn có chắc chắn muốn đoán?</h3>
            <div className="my-4 flex flex-col items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-4 w-full">
              <span className="text-xl font-extrabold text-primary">{suspectToGuess.name}</span>
              <p className="text-xs text-muted">{suspectToGuess.tagline}</p>
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
            <PartyPopper className="h-16 w-16 text-google-yellow mb-2 drop-shadow" />
            <h2 className="text-2xl font-black text-foreground">Chúc Mừng Bạn Đã Thắng!</h2>
            <p className="mt-1 text-sm text-muted">
              Nhân vật bí ẩn chính là <strong className="text-primary">{target.name}</strong>.
            </p>

            <div className="my-6 grid grid-cols-2 gap-4 w-full">
              <div className="rounded-2xl border border-border bg-background p-3">
                <div className="text-[11px] text-muted uppercase">Số câu hỏi</div>
                <div className="text-xl font-bold text-google-blue">{history.length}</div>
              </div>
              <div className="rounded-2xl border border-border bg-background p-3">
                <div className="text-[11px] text-muted uppercase">Điểm đạt được</div>
                <div className="text-xl font-bold text-google-green">
                  {calculateScore(history.length, strikes)}
                </div>
              </div>
            </div>

            <button
              onClick={handleRestart}
              className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-bold text-on-primary shadow-lg transition-all hover:scale-105 active:scale-95"
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
            <Skull className="h-16 w-16 text-google-red mb-2 drop-shadow" />
            <h2 className="text-2xl font-black text-foreground">Rất tiếc, bạn đã thua!</h2>
            <p className="mt-1 text-sm text-muted">
              Bạn đã đoán sai quá 3 lần. Nhân vật bí ẩn chính xác là:
            </p>
            <div className="my-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 w-full">
              <span className="text-xl font-extrabold text-primary">{target.name}</span>
              <p className="text-xs text-muted mt-1">{target.tagline}</p>
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
