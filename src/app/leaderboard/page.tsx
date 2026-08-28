import Link from "next/link";
import { GAMES } from "@/lib/games";
import { GameIcon } from "@/components/ui/game-icon";

export default function LeaderboardPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
      <h1 className="mb-8 text-3xl font-bold">Bảng xếp hạng</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((game) => (
          <Link
            key={game.slug}
            href={`/games/${game.slug}`}
            className="rounded-2xl border border-border bg-surface p-6 transition-all duration-150 hover:shadow-lg"
          >
            <h2 className={`flex items-center gap-2 text-lg font-semibold ${game.color}`}>
              <GameIcon name={game.icon} className="h-5 w-5" />
              {game.name}
            </h2>
            <p className="mt-2 text-sm text-muted">
              Chưa có dữ liệu — chơi game để ghi điểm đầu tiên!
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
