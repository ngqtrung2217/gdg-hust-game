import Link from "next/link";
import { GAMES } from "@/lib/games";
import { GameIcon } from "@/components/ui/game-icon";

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
      <section className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
          <span className="text-google-blue">G</span>
          <span className="text-google-red">D</span>
          <span className="text-google-yellow">G</span>
          <span className="text-google-green"> Game Arcade</span>
        </h1>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((game) => (
          <Link
            key={game.slug}
            href={`/games/${game.slug}`}
            className="group flex min-h-56 flex-col rounded-2xl border border-border bg-surface p-6 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="mb-4 flex items-start justify-between">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <GameIcon name={game.icon} className={`h-6 w-6 ${game.color}`} />
              </span>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {game.category}
              </span>
            </div>
            <h2 className={`text-xl font-semibold ${game.color}`}>{game.name}</h2>
            <p className="mt-2 text-sm text-muted">{game.description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
