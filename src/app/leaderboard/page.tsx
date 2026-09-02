"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Trophy,
  Medal,
  Award,
  Sparkles,
  ArrowRight,
  RotateCcw,
  User,
  CheckCircle2,
  Flame,
} from "lucide-react";
import { GAMES, type GameMeta } from "@/lib/games";
import { GameIcon } from "@/components/ui/game-icon";

interface GameScoreInfo {
  slug: string;
  best: number;
  unit: string;
  displayValue: string;
  hasPlayed: boolean;
}

const SCORE_CONFIGS: Record<string, { key: string; unit: string; format: (val: number) => string }> = {
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
  const [playerName, setPlayerName] = useState("GDG Gamer");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [scores, setScores] = useState<Record<string, GameScoreInfo>>({});
  const [mounted, setMounted] = useState(false);

  // Load profile and scores from localStorage
  useEffect(() => {
    setMounted(true);
    const savedName = localStorage.getItem("gdg-player-name") || "GDG Gamer";
    setPlayerName(savedName);
    setTempName(savedName);

    const scoreMap: Record<string, GameScoreInfo> = {};
    GAMES.forEach((game) => {
      const config = SCORE_CONFIGS[game.slug];
      if (!config) return;
      const raw = localStorage.getItem(config.key);
      const val = raw !== null ? Number(raw) : 0;
      scoreMap[game.slug] = {
        slug: game.slug,
        best: val,
        unit: config.unit,
        displayValue: val > 0 ? config.format(val) : "Chưa có điểm",
        hasPlayed: val > 0,
      };
    });
    setScores(scoreMap);
  }, []);

  const saveName = () => {
    const trimmed = tempName.trim() || "GDG Gamer";
    setPlayerName(trimmed);
    localStorage.setItem("gdg-player-name", trimmed);
    setIsEditingName(false);
  };

  const handleClearData = () => {
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ kỷ lục đã lưu không?")) {
      Object.values(SCORE_CONFIGS).forEach((cfg) => {
        localStorage.removeItem(cfg.key);
      });
      window.location.reload();
    }
  };

  // Aggregate stats
  const totalPlayed = Object.values(scores).filter((s) => s.hasPlayed).length;
  const totalPoints = Object.values(scores).reduce((sum, s) => sum + (s.hasPlayed ? s.best : 0), 0);

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
      {/* Profile Header & Arcade Banner */}
      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-google-blue via-google-red to-google-yellow p-0.5 shadow-md">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-surface">
              <Trophy className="h-8 w-8 text-google-yellow drop-shadow-sm" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="rounded-lg border border-primary bg-background px-2.5 py-1 text-base font-bold text-foreground focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={saveName}
                    className="rounded-lg bg-primary px-3 py-1 text-xs font-bold text-on-primary"
                  >
                    Lưu
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-foreground">{playerName}</h1>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="rounded-full p-1 text-muted hover:bg-surface-hover hover:text-foreground"
                    title="Đổi tên hiển thị"
                  >
                    <User className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-muted mt-1">
              Bảng thành tích và kỷ lục cá nhân tại GDG Game Arcade
            </p>
          </div>
        </div>

        {/* Stats summary pills */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2">
            <CheckCircle2 className="h-4 w-4 text-google-green" />
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold text-muted">Đã tham gia</div>
              <div className="tabular-nums text-sm font-extrabold text-foreground">
                {totalPlayed} / 9 Game
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2">
            <Flame className="h-4 w-4 text-google-red" />
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold text-muted">Tổng điểm tích lũy</div>
              <div className="tabular-nums text-sm font-extrabold text-foreground">
                {totalPoints.toLocaleString()}
              </div>
            </div>
          </div>

          <button
            onClick={handleClearData}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-background text-muted transition-colors hover:bg-google-red/10 hover:text-google-red"
            title="Đặt lại toàn bộ kỷ lục"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 9 Games Grid */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-google-blue" />
          Kỷ lục 9 trò chơi
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((game: GameMeta) => {
            const scoreInfo = scores[game.slug];
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
              (scores["guess-who"]?.best ?? 0) > 0
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
              (scores["othello"]?.best ?? 0) > 0 || (scores["minesweeper"]?.best ?? 0) > 0
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
              (scores["dino-run"]?.best ?? 0) >= 300 || (scores["math-blaster"]?.best ?? 0) >= 500
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
              (scores["stroop-test"]?.best ?? 0) >= 800
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
  );
}
