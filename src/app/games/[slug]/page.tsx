import Link from "next/link";
import { notFound } from "next/navigation";
import { getGame } from "@/lib/games";
import { GameIcon } from "@/components/ui/game-icon";
import { Minesweeper } from "@/games/minesweeper/minesweeper";
import { Wordle } from "@/games/wordle/wordle";
import { SequenceMemory } from "@/games/sequence-memory/sequence-memory";
import { DinoRun } from "@/games/dino-run/dino-run";

export function generateStaticParams() {
  return [
    { slug: "minesweeper" },
    { slug: "wordle" },
    { slug: "sequence-memory" },
    { slug: "dino-run" },
    { slug: "othello" },
    { slug: "guess-who" },
    { slug: "sokoban" },
    { slug: "math-blaster" },
    { slug: "stroop-test" },
  ];
}

export default async function GamePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const game = getGame(slug);
  if (!game) notFound();

  return (
    <div className="relative flex h-[calc(100vh-4rem)] flex-col px-4 py-4 md:px-6">
      <aside className="absolute left-4 top-4 z-10 flex w-72 flex-col gap-4 md:left-6">
        <Link
          href="/"
          className="flex h-10 items-center rounded-full border border-border bg-surface px-4 text-sm font-medium transition-colors hover:bg-surface-hover"
        >
          ← Trang chủ
        </Link>
        <div>
          <h1 className={`flex items-center gap-2 text-xl font-bold ${game.color}`}>
            <GameIcon name={game.icon} className="h-6 w-6" />
            {game.name}
          </h1>
          <p className="mt-1 text-sm text-muted">{game.description}</p>
        </div>
      </aside>

      <div className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface p-8">
        {slug === "minesweeper" ? (
          <Minesweeper />
        ) : slug === "wordle" ? (
          <Wordle />
        ) : slug === "sequence-memory" ? (
          <SequenceMemory />
        ) : slug === "dino-run" ? (
          <DinoRun />
        ) : (
          <div className="text-center text-muted">Game đang được phát triển...</div>
        )}
      </div>
    </div>
  );
}
