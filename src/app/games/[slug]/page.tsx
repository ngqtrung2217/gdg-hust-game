import Link from "next/link";
import { notFound } from "next/navigation";
import { getGame } from "@/lib/games";
import { GameIcon } from "@/components/ui/game-icon";
import { Minesweeper } from "@/games/minesweeper/minesweeper";
import { Wordle } from "@/games/wordle/wordle";
import { SequenceMemory } from "@/games/sequence-memory/sequence-memory";
import { DinoRun } from "@/games/dino-run/dino-run";
import { Othello } from "@/games/othello/othello";
import { GuessWho } from "@/games/guess-who/guess-who";
import { Tetris } from "@/games/tetris/tetris";
import { MathBlaster } from "@/games/math-blaster/math-blaster";
import { StroopTest } from "@/games/stroop-test/stroop-test";
import { GameGuideModal } from "@/components/ui/game-guide-modal";
import { ArrowLeft } from "lucide-react";

export function generateStaticParams() {
  return [
    { slug: "minesweeper" },
    { slug: "wordle" },
    { slug: "sequence-memory" },
    { slug: "dino-run" },
    { slug: "othello" },
    { slug: "guess-who" },
    { slug: "tetris" },
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
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl flex-col px-4 py-4 md:px-6">
      {/* Top Breadcrumb & Game Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-xs font-semibold transition-colors hover:bg-surface-hover hover:text-foreground active:scale-95"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Trang chủ
          </Link>

          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <GameIcon name={game.icon} className={`h-4 w-4 ${game.color}`} />
            </span>
            <h1 className={`text-lg font-bold tracking-tight ${game.color}`}>
              {game.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <GameGuideModal slug={slug} />
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {game.category}
          </span>
          <p className="hidden text-xs text-muted md:inline-block max-w-md truncate">
            {game.description}
          </p>
        </div>
      </div>

      {/* Game Stage Area */}
      <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-border bg-surface/50 p-4 sm:p-6 md:p-8 shadow-sm">
        {slug === "minesweeper" && <Minesweeper />}
        {slug === "wordle" && <Wordle />}
        {slug === "sequence-memory" && <SequenceMemory />}
        {slug === "dino-run" && <DinoRun />}
        {slug === "othello" && <Othello />}
        {slug === "guess-who" && <GuessWho />}
        {slug === "tetris" && <Tetris />}
        {slug === "math-blaster" && <MathBlaster />}
        {slug === "stroop-test" && <StroopTest />}
      </div>
    </div>
  );
}
