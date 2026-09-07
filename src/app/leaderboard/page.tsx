"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Trophy,
  Medal,
  Award,
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Flame,
  Globe,
  Gamepad2,
  User,
  KeyRound,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";
import { GAMES, type GameMeta } from "@/lib/games";
import { GameIcon } from "@/components/ui/game-icon";
import {
  getActivePlayer,
  getAllLocalScores,
  type PlayerProfile,
} from "@/lib/player";
import { AuthModal } from "@/components/player/auth-modal";

interface GameScoreInfo {
  slug: string;
  best: number;
  unit: string;
  displayValue: string;
  hasPlayed: boolean;
}

interface OverallLeaderboardItem {
  rank: number;
  name: string;
  maskedCode: string;
  isMe?: boolean;
  totalScore: number;
  gamesPlayed: number;
  lastActive: string;
}

interface GameLeaderboardItem {
  rank: number;
  name: string;
  maskedCode: string;
  isMe?: boolean;
  score: number;
  updatedAt: string;
}

const SCORE_CONFIGS: Record<
  string,
  { key: string; unit: string; format: (val: number) => string }
> = {
  minesweeper: {
    key: "minesweeper-best",
    unit: "giây",
    format: (v) => `${v}s`,
  },
  wordle: {
    key: "wordle-best",
    unit: "chuỗi thắng",
    format: (v) => `${v} ván`,
  },
  "sequence-memory": {
    key: "sequence-memory-best",
    unit: "Level",
    format: (v) => `Level ${v}`,
  },
  "dino-run": {
    key: "dino-run-best",
    unit: "điểm",
    format: (v) => `${v} điểm`,
  },
  othello: {
    key: "othello-best",
    unit: "trận thắng",
    format: (v) => `${v} trận`,
  },
  "guess-who": {
    key: "guess-who-best",
    unit: "điểm",
    format: (v) => `${v} điểm`,
  },
  tetris: {
    key: "tetris-best",
    unit: "điểm",
    format: (v) => `${v} điểm`,
  },
  "math-blaster": {
    key: "math-blaster-best",
    unit: "điểm",
    format: (v) => `${v} điểm`,
  },
  "stroop-test": {
    key: "stroop-test-best",
    unit: "điểm",
    format: (v) => `${v} điểm`,
  },
};

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<"overall" | "by-game" | "personal">("overall");
  const [selectedGame, setSelectedGame] = useState<string>("tetris");
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<"create" | "login" | "profile">("create");
  const [copied, setCopied] = useState(false);

  // Leaderboard data
  const [overallList, setOverallList] = useState<OverallLeaderboardItem[]>([]);
  const [gameList, setGameList] = useState<GameLeaderboardItem[]>([]);
  const [loadingOverall, setLoadingOverall] = useState(false);
  const [loadingGame, setLoadingGame] = useState(false);

  // Personal scores
  const [personalScores, setPersonalScores] = useState<Record<string, GameScoreInfo>>({});
  const [mounted, setMounted] = useState(false);

  // Load personal scores from storage
  const refreshPersonalScores = useCallback(() => {
    const scoreMap: Record<string, GameScoreInfo> = {};
    const localScores = getAllLocalScores();

    GAMES.forEach((game) => {
      const config = SCORE_CONFIGS[game.slug];
      if (!config) return;
      const val = localScores[game.slug] ?? 0;
      scoreMap[game.slug] = {
        slug: game.slug,
        best: val,
        unit: config.unit,
        displayValue: val > 0 ? config.format(val) : "Chưa có điểm",
        hasPlayed: val > 0,
      };
    });
    setPersonalScores(scoreMap);
  }, []);

  // Fetch overall leaderboard
  const fetchOverall = useCallback(async () => {
    setLoadingOverall(true);
    try {
      const curPlayer = getActivePlayer();
      const codeParam = curPlayer?.code ? `&myCode=${encodeURIComponent(curPlayer.code)}` : "";
      const res = await fetch(`/api/leaderboard?game=overall${codeParam}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.leaderboard)) {
        setOverallList(data.leaderboard);
      }
    } catch (e) {
      console.error("Error fetching overall leaderboard:", e);
    } finally {
      setLoadingOverall(false);
    }
  }, []);

  // Fetch per-game leaderboard
  const fetchGameLeaderboard = useCallback(async (slug: string) => {
    setLoadingGame(true);
    try {
      const curPlayer = getActivePlayer();
      const codeParam = curPlayer?.code ? `&myCode=${encodeURIComponent(curPlayer.code)}` : "";
      const res = await fetch(`/api/leaderboard?game=${slug}${codeParam}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.leaderboard)) {
        setGameList(data.leaderboard);
      }
    } catch (e) {
      console.error("Error fetching game leaderboard:", e);
    } finally {
      setLoadingGame(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    setPlayer(getActivePlayer());
    refreshPersonalScores();
    fetchOverall();

    const onPlayerChange = (e: Event) => {
      const customEvent = e as CustomEvent<PlayerProfile | null>;
      setPlayer(customEvent.detail ?? null);
      refreshPersonalScores();
      fetchOverall();
    };

    const onScoreUpdate = () => {
      refreshPersonalScores();
      fetchOverall();
    };

    window.addEventListener("gdg-player-changed", onPlayerChange);
    window.addEventListener("gdg-score-updated", onScoreUpdate);

    return () => {
      window.removeEventListener("gdg-player-changed", onPlayerChange);
      window.removeEventListener("gdg-score-updated", onScoreUpdate);
    };
  }, [refreshPersonalScores, fetchOverall]);

  useEffect(() => {
    if (activeTab === "by-game") {
      fetchGameLeaderboard(selectedGame);
    }
  }, [activeTab, selectedGame, fetchGameLeaderboard]);

  const handleCopyCode = (codeToCopy: string) => {
    if (!codeToCopy) return;
    navigator.clipboard.writeText(codeToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearData = () => {
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ kỷ lục lưu trên máy này không?")) {
      Object.values(SCORE_CONFIGS).forEach((cfg) => {
        localStorage.removeItem(cfg.key);
      });
      refreshPersonalScores();
    }
  };

  const totalPlayed = Object.values(personalScores).filter((s) => s.hasPlayed).length;
  const totalPoints = Object.values(personalScores).reduce(
    (sum, s) => sum + (s.hasPlayed ? s.best : 0),
    0
  );

  // Find user's rank in overall leaderboard
  const userOverallRank = overallList.find((item) => item.isMe)?.rank;

  if (!mounted) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-surface mb-8" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl border border-border bg-surface" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 select-none">
      {/* Account / Registration Banner */}
      {player?.code ? (
        /* Logged In Player Banner */
        <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/5 via-surface to-background p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-inner">
              <User className="h-8 w-8" />
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-black text-foreground">{player.name}</h1>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-0.5 text-xs font-mono font-black text-primary">
                  <span>#{player.code}</span>
                  <button
                    onClick={() => handleCopyCode(player.code)}
                    className="text-primary/70 hover:text-primary active:scale-95"
                    title="Sao chép mã 6 số"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-google-green" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                <span className="flex items-center gap-1 text-google-green font-medium">
                  <span className="h-2 w-2 rounded-full bg-google-green animate-pulse" />
                  Đã kết nối Supabase Cloud
                </span>
                <span>•</span>
                {userOverallRank ? (
                  <span className="font-bold text-foreground">
                    Hạng #{userOverallRank} Toàn Cầu
                  </span>
                ) : (
                  <span>Đang cập nhật xếp hạng</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-2">
              <CheckCircle2 className="h-4 w-4 text-google-green" />
              <div className="text-left">
                <div className="text-[10px] uppercase font-bold text-muted">Đã tham gia</div>
                <div className="tabular-nums text-sm font-extrabold text-foreground">
                  {totalPlayed} / 9 Game
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-2">
              <Flame className="h-4 w-4 text-google-red" />
              <div className="text-left">
                <div className="text-[10px] uppercase font-bold text-muted">Tổng điểm tích lũy</div>
                <div className="tabular-nums text-sm font-extrabold text-foreground">
                  {totalPoints.toLocaleString()}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setAuthInitialTab("profile");
                setIsAuthOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-2xl border border-border bg-surface px-4 py-2.5 text-xs font-bold text-foreground transition-all hover:bg-surface-hover active:scale-95"
            >
              <KeyRound className="h-4 w-4 text-primary" />
              <span>Quản lý mã</span>
            </button>
          </div>
        </div>
      ) : (
        /* Guest Banner - Prompt to get 6-digit code */
        <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 rounded-3xl border-2 border-dashed border-primary/40 bg-gradient-to-r from-primary/10 via-surface to-background p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-google-blue via-google-red to-google-yellow p-0.5 shadow-md">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-surface">
                <Trophy className="h-8 w-8 text-google-yellow drop-shadow-sm" />
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary mb-1">
                <Sparkles className="h-3 w-3" />
                <span>Hệ thống Tích điểm GDG Arcade</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-foreground">
                Đăng ký nhận Mã 6 Số & Đua Top
              </h1>
              <p className="text-xs text-muted mt-1 max-w-xl">
                Tạo tên để nhận mã cá nhân 6 số duy nhất. Mọi điểm số của bạn sẽ được lưu vĩnh viễn trên đám mây và thi đua trên Bảng Xếp Hạng Toàn Cầu!
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setAuthInitialTab("create");
                setIsAuthOpen(true);
              }}
              className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-xs font-bold text-on-primary transition-all hover:opacity-90 active:scale-95 shadow-md shadow-primary/25"
            >
              <Sparkles className="h-4 w-4" />
              <span>Nhận mã 6 số ngay</span>
            </button>

            <button
              onClick={() => {
                setAuthInitialTab("login");
                setIsAuthOpen(true);
              }}
              className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-xs font-bold text-foreground transition-all hover:bg-surface-hover active:scale-95"
            >
              <KeyRound className="h-4 w-4 text-muted" />
              <span>Đã có mã 6 số</span>
            </button>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-2 rounded-2xl bg-surface p-1.5 border border-border">
          <button
            onClick={() => setActiveTab("overall")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "overall"
                ? "bg-primary text-on-primary shadow-xs"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Globe className="h-4 w-4" />
            <span>Toàn Cầu (Tổng Điểm)</span>
          </button>

          <button
            onClick={() => setActiveTab("by-game")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "by-game"
                ? "bg-primary text-on-primary shadow-xs"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Gamepad2 className="h-4 w-4" />
            <span>Theo Trò Chơi</span>
          </button>

          <button
            onClick={() => setActiveTab("personal")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "personal"
                ? "bg-primary text-on-primary shadow-xs"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Award className="h-4 w-4" />
            <span>Kỷ Lục Cá Nhân ({totalPlayed}/9)</span>
          </button>
        </div>

        {activeTab === "overall" && (
          <button
            onClick={fetchOverall}
            disabled={loadingOverall}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-bold text-muted hover:text-foreground active:scale-95 disabled:opacity-50"
            title="Làm mới bảng xếp hạng"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingOverall ? "animate-spin" : ""}`} />
            <span>Cập nhật</span>
          </button>
        )}
      </div>

      {/* TAB 1: OVERALL GLOBAL LEADERBOARD */}
      {activeTab === "overall" && (
        <div className="space-y-6">
          {/* Top 3 Podium Cards */}
          {overallList.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              {/* 2nd Place */}
              <div className="order-2 md:order-1 flex flex-col items-center justify-end rounded-3xl border border-border bg-surface p-6 text-center shadow-sm">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-black text-lg shadow-sm">
                  🥈 #2
                </div>
                <h4 className="text-base font-black text-foreground truncate max-w-[180px]">
                  {overallList[1].name}
                </h4>
                <span className="text-[11px] font-mono text-muted">{overallList[1].maskedCode}</span>
                <div className="mt-3 text-xl font-black text-foreground tabular-nums">
                  {overallList[1].totalScore.toLocaleString()} <span className="text-xs font-normal text-muted">điểm</span>
                </div>
                <span className="text-[10px] text-muted mt-1">{overallList[1].gamesPlayed}/9 trò chơi</span>
              </div>

              {/* 1st Place (Winner) */}
              <div className="order-1 md:order-2 flex flex-col items-center justify-end rounded-3xl border-2 border-google-yellow/40 bg-gradient-to-b from-google-yellow/10 via-surface to-surface p-6 sm:p-8 text-center shadow-lg relative -translate-y-2">
                <div className="absolute -top-3 rounded-full bg-google-yellow px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-black shadow-sm">
                  Quán Quân Arcade
                </div>
                <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-google-yellow/20 text-google-yellow font-black text-2xl shadow-inner">
                  👑 #1
                </div>
                <h4 className="text-lg font-black text-foreground truncate max-w-[200px]">
                  {overallList[0].name}
                </h4>
                <span className="text-xs font-mono font-bold text-google-yellow">{overallList[0].maskedCode}</span>
                <div className="mt-3 text-2xl font-black text-google-yellow tabular-nums">
                  {overallList[0].totalScore.toLocaleString()} <span className="text-xs font-normal text-muted">điểm</span>
                </div>
                <span className="text-[10px] text-muted mt-1">{overallList[0].gamesPlayed}/9 trò chơi</span>
              </div>

              {/* 3rd Place */}
              <div className="order-3 flex flex-col items-center justify-end rounded-3xl border border-border bg-surface p-6 text-center shadow-sm">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-600/15 text-amber-600 font-black text-lg shadow-sm">
                  🥉 #3
                </div>
                <h4 className="text-base font-black text-foreground truncate max-w-[180px]">
                  {overallList[2].name}
                </h4>
                <span className="text-[11px] font-mono text-muted">{overallList[2].maskedCode}</span>
                <div className="mt-3 text-xl font-black text-foreground tabular-nums">
                  {overallList[2].totalScore.toLocaleString()} <span className="text-xs font-normal text-muted">điểm</span>
                </div>
                <span className="text-[10px] text-muted mt-1">{overallList[2].gamesPlayed}/9 trò chơi</span>
              </div>
            </div>
          )}

          {/* Leaderboard Table */}
          <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                <Trophy className="h-4 w-4 text-google-yellow" />
                Bảng Tổng Sắp GDG Arcade
              </h3>
              <span className="text-xs text-muted">
                {overallList.length} tuyển thủ tham gia
              </span>
            </div>

            {loadingOverall ? (
              <div className="p-12 text-center text-sm text-muted animate-pulse">
                Đang tải dữ liệu từ máy chủ Supabase...
              </div>
            ) : overallList.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm font-semibold text-foreground">Chưa có tuyển thủ nào trên bảng xếp hạng!</p>
                <p className="text-xs text-muted mt-1">Hãy là người đầu tiên đăng ký mã 6 số và lập kỷ lục!</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {overallList.map((item) => {
                  const isYou = !!item.isMe;
                  return (
                    <div
                      key={`${item.rank}-${item.maskedCode}`}
                      className={`flex items-center justify-between p-4 sm:px-6 transition-colors ${
                        isYou
                          ? "bg-primary/10 border-l-4 border-l-primary"
                          : "hover:bg-surface-hover/60"
                      }`}
                    >
                      {/* Left: Rank & Name */}
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div
                          className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl font-black text-xs sm:text-sm ${
                            item.rank === 1
                              ? "bg-google-yellow text-black font-black"
                              : item.rank === 2
                              ? "bg-zinc-300 dark:bg-zinc-700 text-foreground"
                              : item.rank === 3
                              ? "bg-amber-600/20 text-amber-600"
                              : "bg-surface-hover text-muted"
                          }`}
                        >
                          #{item.rank}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm sm:text-base font-extrabold text-foreground truncate">
                              {item.name}
                            </span>
                            {isYou && (
                              <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-black text-on-primary">
                                BẠN
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-muted">
                            <span className="font-mono">{isYou && player?.code ? `#${player.code}` : item.maskedCode}</span>
                            <span>•</span>
                            <span>{item.gamesPlayed}/9 trò chơi</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Total Score */}
                      <div className="text-right shrink-0">
                        <div className="text-base sm:text-lg font-black text-foreground tabular-nums">
                          {item.totalScore.toLocaleString()}
                        </div>
                        <div className="text-[10px] uppercase font-bold text-muted">Tổng điểm</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PER-GAME LEADERBOARDS */}
      {activeTab === "by-game" && (
        <div className="space-y-6">
          {/* Game Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {GAMES.map((game) => (
              <button
                key={game.slug}
                onClick={() => setSelectedGame(game.slug)}
                className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all ${
                  selectedGame === game.slug
                    ? "bg-primary text-on-primary shadow-xs"
                    : "border border-border bg-surface text-muted hover:text-foreground"
                }`}
              >
                <GameIcon name={game.icon} className="h-4 w-4" />
                <span>{game.name}</span>
              </button>
            ))}
          </div>

          {/* Game Leaderboard Table */}
          <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-black text-foreground">
                  Kỷ lục trò chơi: {GAMES.find((g) => g.slug === selectedGame)?.name}
                </span>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                  {selectedGame === "minesweeper" ? "Thời gian ít nhất" : "Điểm cao nhất"}
                </span>
              </div>
              <Link
                href={`/games/${selectedGame}`}
                className="flex items-center gap-1 rounded-xl bg-primary/10 px-3 py-1 text-xs font-bold text-primary hover:bg-primary hover:text-on-primary transition-colors"
              >
                Chơi ngay
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {loadingGame ? (
              <div className="p-12 text-center text-sm text-muted animate-pulse">
                Đang tải kỷ lục trò chơi...
              </div>
            ) : gameList.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm font-semibold text-foreground">Chưa có ai đạt điểm trong trò này!</p>
                <p className="text-xs text-muted mt-1">Hãy chơi ngay để trở thành người đứng đầu!</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {gameList.map((item) => {
                  const isYou = !!item.isMe;
                  const cfg = SCORE_CONFIGS[selectedGame];
                  const formattedScore = cfg ? cfg.format(item.score) : `${item.score} điểm`;

                  return (
                    <div
                      key={`${item.rank}-${item.maskedCode}`}
                      className={`flex items-center justify-between p-4 sm:px-6 transition-colors ${
                        isYou
                          ? "bg-primary/10 border-l-4 border-l-primary"
                          : "hover:bg-surface-hover/60"
                      }`}
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div
                          className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl font-black text-xs sm:text-sm ${
                            item.rank === 1
                              ? "bg-google-yellow text-black"
                              : item.rank === 2
                              ? "bg-zinc-300 dark:bg-zinc-700 text-foreground"
                              : item.rank === 3
                              ? "bg-amber-600/20 text-amber-600"
                              : "bg-surface-hover text-muted"
                          }`}
                        >
                          #{item.rank}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm sm:text-base font-extrabold text-foreground">
                              {item.name}
                            </span>
                            {isYou && (
                              <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-black text-on-primary">
                                BẠN
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-muted">
                            {isYou && player?.code ? `#${player.code}` : item.maskedCode}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-base sm:text-lg font-black text-foreground tabular-nums">
                          {formattedScore}
                        </div>
                        <div className="text-[10px] text-muted">
                          {new Date(item.updatedAt).toLocaleDateString("vi-VN")}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PERSONAL RECORDS & BADGES */}
      {activeTab === "personal" && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-google-blue" />
              Kỷ lục 9 trò chơi cá nhân
            </h2>

            <button
              onClick={handleClearData}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-bold text-muted hover:text-google-red hover:border-google-red/40 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Xóa kỷ lục trên máy</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {GAMES.map((game: GameMeta) => {
              const scoreInfo = personalScores[game.slug];
              const hasScore = scoreInfo?.hasPlayed;

              return (
                <div
                  key={game.slug}
                  className="group flex flex-col justify-between rounded-3xl border border-border bg-surface p-6 shadow-sm transition-all duration-150 hover:-translate-y-1 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                        <GameIcon name={game.icon} className={`h-6 w-6 ${game.color}`} />
                      </div>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {game.category}
                      </span>
                    </div>

                    <h3 className={`text-xl font-bold ${game.color}`}>{game.name}</h3>
                    <p className="mt-1 text-xs text-muted line-clamp-2">{game.description}</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-wider text-muted">
                        Kỷ lục cá nhân
                      </div>
                      <div
                        className={`tabular-nums text-lg font-black ${
                          hasScore ? "text-foreground" : "text-muted/60"
                        }`}
                      >
                        {scoreInfo?.displayValue ?? "Chưa có điểm"}
                      </div>
                    </div>

                    <Link
                      href={`/games/${game.slug}`}
                      className="flex items-center gap-1 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary transition-all hover:bg-primary hover:text-on-primary active:scale-95"
                    >
                      Chơi
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hall of Fame Badges */}
          <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-sm">
            <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-google-yellow" />
              Danh hiệu & Huy hiệu Arcade
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div
                className={`flex flex-col items-center text-center p-4 rounded-2xl border transition-all ${
                  (personalScores["guess-who"]?.best ?? 0) > 0
                    ? "border-google-blue/40 bg-google-blue/5"
                    : "border-border/60 bg-background/50 opacity-40 grayscale"
                }`}
              >
                <Medal className="h-8 w-8 text-google-blue mb-2" />
                <h4 className="text-xs font-bold text-foreground">Học Giả Google</h4>
                <p className="text-[11px] text-muted mt-1">Đoán đúng nhân vật trong Guess Who</p>
              </div>

              <div
                className={`flex flex-col items-center text-center p-4 rounded-2xl border transition-all ${
                  (personalScores["othello"]?.best ?? 0) > 0 ||
                  (personalScores["minesweeper"]?.best ?? 0) > 0
                    ? "border-google-green/40 bg-google-green/5"
                    : "border-border/60 bg-background/50 opacity-40 grayscale"
                }`}
              >
                <Medal className="h-8 w-8 text-google-green mb-2" />
                <h4 className="text-xs font-bold text-foreground">Bậc Thầy Logic</h4>
                <p className="text-[11px] text-muted mt-1">Thắng Minesweeper hoặc Othello</p>
              </div>

              <div
                className={`flex flex-col items-center text-center p-4 rounded-2xl border transition-all ${
                  (personalScores["dino-run"]?.best ?? 0) >= 300 ||
                  (personalScores["math-blaster"]?.best ?? 0) >= 500
                    ? "border-google-red/40 bg-google-red/5"
                    : "border-border/60 bg-background/50 opacity-40 grayscale"
                }`}
              >
                <Medal className="h-8 w-8 text-google-red mb-2" />
                <h4 className="text-xs font-bold text-foreground">Tốc Độ Tia Chớp</h4>
                <p className="text-[11px] text-muted mt-1">Đạt điểm cao trong Dino Run / Math</p>
              </div>

              <div
                className={`flex flex-col items-center text-center p-4 rounded-2xl border transition-all ${
                  (personalScores["stroop-test"]?.best ?? 0) >= 800
                    ? "border-google-yellow/40 bg-google-yellow/5"
                    : "border-border/60 bg-background/50 opacity-40 grayscale"
                }`}
              >
                <Medal className="h-8 w-8 text-google-yellow mb-2" />
                <h4 className="text-xs font-bold text-foreground">Phản Xạ Thần Thánh</h4>
                <p className="text-[11px] text-muted mt-1">Đạt trên 800 điểm Stroop Test</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auth & Player Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialTab={authInitialTab}
      />
    </div>
  );
}
