"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Trophy,
  Sparkles,
  Gamepad2,
  Medal,
  Flame,
  Search,
} from "lucide-react";
import { GAMES, type GameCategory } from "@/lib/games";
import { GameIcon } from "@/components/ui/game-icon";

const SCORE_KEYS: Record<string, { key: string; format: (v: number) => string }> = {
  minesweeper: {
    key: "minesweeper-best",
    format: (v) => `${v}s`,
  },
  wordle: {
    key: "wordle-best",
    format: (v) => `${v} ván`,
  },
  "sequence-memory": {
    key: "sequence-memory-best",
    format: (v) => `Lv ${v}`,
  },
  "dino-run": {
    key: "dino-run-best",
    format: (v) => `${v} đ`,
  },
  othello: {
    key: "othello-best",
    format: (v) => `${v} thắng`,
  },
  "guess-who": {
    key: "guess-who-best",
    format: (v) => `${v} đ`,
  },
  tetris: {
    key: "tetris-best",
    format: (v) => `${v} đ`,
  },
  "math-blaster": {
    key: "math-blaster-best",
    format: (v) => `${v} đ`,
  },
  "stroop-test": {
    key: "stroop-test-best",
    format: (v) => `${v} đ`,
  },
};

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [bestScores, setBestScores] = useState<Record<string, number>>({});

  useEffect(() => {
    const scores: Record<string, number> = {};
    Object.entries(SCORE_KEYS).forEach(([slug, def]) => {
      const val = Number(localStorage.getItem(def.key) ?? 0);
      if (val > 0) {
        scores[slug] = val;
      }
    });
    setBestScores(scores);
  }, []);

  const playedCount = useMemo(() => {
    return Object.keys(bestScores).length;
  }, [bestScores]);

  const categories = useMemo(() => {
    const set = new Set<GameCategory>();
    GAMES.forEach((g) => set.add(g.category));
    return ["all", ...Array.from(set)];
  }, []);

  const filteredGames = useMemo(() => {
    return GAMES.filter((game) => {
      const matchesCategory =
        activeCategory === "all" || game.category === activeCategory;
      const matchesSearch =
        game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 select-none">
      {/* Hero Section */}
      <section className="mb-10 flex flex-col items-start gap-4">
        <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1 text-xs font-semibold text-muted shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-google-yellow" />
          <span>Nền tảng Mini-Game chính thức của GDG on Campus</span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
          <span className="text-google-blue">G</span>
          <span className="text-google-red">D</span>
          <span className="text-google-yellow">G</span>
          <span className="text-google-green"> Game Arcade</span>
        </h1>

        <p className="max-w-2xl text-base text-muted sm:text-lg">
          Tổ hợp 9 trò chơi giải đố, chiến thuật và rèn luyện phản xạ theo phong cách Google Material Design 3. Chơi ngay trên trình duyệt, không cần cài đặt!
        </p>

        {/* Action Buttons & Progress Bar */}
        <div className="flex flex-wrap items-center gap-3 w-full">
          <a
            href="#games-grid"
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-on-primary shadow-md transition-all hover:scale-105 active:scale-95"
          >
            <Gamepad2 className="h-4 w-4" />
            Khám phá 9 trò chơi
          </a>
          <Link
            href="/leaderboard"
            className="flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-surface-hover hover:border-primary/40 active:scale-95"
          >
            <Trophy className="h-4 w-4 text-google-yellow" />
            Xem Bảng xếp hạng
          </Link>
        </div>

        {/* Player Personal Progress Widget */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full max-w-xl rounded-2xl border border-border bg-surface/80 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-google-yellow/10 text-google-yellow">
              <Medal className="h-5 w-5" />
            </span>
            <div>
              <div className="text-xs font-bold text-foreground">
                Tiến độ của bạn: <span className="text-google-blue">{playedCount}/9 trò chơi</span> đã ghi điểm
              </div>
              <div className="mt-1.5 h-2 w-48 sm:w-64 rounded-full bg-surface-hover overflow-hidden border border-border/50">
                <div
                  className="h-full bg-gradient-to-r from-google-blue via-google-yellow to-google-green transition-all duration-500 rounded-full"
                  style={{ width: `${(playedCount / 9) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-muted sm:text-right">
            <Flame className="h-4 w-4 text-google-red" />
            <span>{playedCount === 9 ? "Hoàn thành 100%!" : `Còn ${9 - playedCount} game`}</span>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section id="games-grid" className="scroll-mt-20">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                  activeCategory === cat
                    ? "bg-primary text-on-primary shadow-sm"
                    : "border border-border bg-surface text-muted hover:bg-surface-hover hover:text-foreground"
                }`}
              >
                {cat === "all" ? "Tất cả (9)" : cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              placeholder="Tìm kiếm game..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-border bg-surface pl-10 pr-4 py-1.5 text-xs font-medium focus:border-primary focus:outline-none shadow-sm"
            />
          </div>
        </div>

        {/* 9 Games Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGames.map((game) => {
            const hasBest = Boolean(bestScores[game.slug]);
            const bestFormatted = hasBest
              ? SCORE_KEYS[game.slug]?.format(bestScores[game.slug])
              : null;

            return (
              <Link
                key={game.slug}
                href={`/games/${game.slug}`}
                className="group relative flex min-h-[230px] flex-col justify-between rounded-3xl border border-border bg-surface p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg"
              >
                <div>
                  <div className="mb-4 flex items-start justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 transition-transform duration-200 group-hover:scale-110">
                      <GameIcon name={game.icon} className={`h-6 w-6 ${game.color}`} />
                    </span>
                    <div className="flex items-center gap-1.5">
                      {hasBest && (
                        <span className="flex items-center gap-1 rounded-full bg-google-yellow/15 border border-google-yellow/30 px-2.5 py-0.5 text-[11px] font-bold text-google-yellow shadow-sm">
                          <Trophy className="h-3 w-3" />
                          <span>{bestFormatted}</span>
                        </span>
                      )}
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {game.category}
                      </span>
                    </div>
                  </div>

                  <h3 className={`text-xl font-bold tracking-tight ${game.color}`}>
                    {game.name}
                  </h3>
                  <p className="mt-2 text-sm text-muted leading-relaxed">
                    {game.description}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between pt-2 border-t border-border/40">
                  <span className="text-[11px] font-semibold text-muted">
                    {hasBest ? "Đã có kỷ lục" : "Chưa chơi"}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-bold text-primary opacity-80 transition-all group-hover:opacity-100 group-hover:translate-x-1">
                    Chơi ngay
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {filteredGames.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Gamepad2 className="h-12 w-12 text-muted mb-2 opacity-50" />
            <p className="text-sm font-semibold text-foreground">Không tìm thấy trò chơi nào</p>
            <p className="text-xs text-muted mt-1">Hãy thử tìm kiếm với từ khóa khác</p>
          </div>
        )}
      </section>
    </div>
  );
}
