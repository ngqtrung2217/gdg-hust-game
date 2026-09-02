"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";
import { GAMES } from "@/lib/games";
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 select-none">
      <h1 className="sr-only">GDG Arcade - 9 Trò Chơi Trí Tuệ & Phản Xạ</h1>

      {/* 9 Games Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((game) => {
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
    </div>
  );
}
