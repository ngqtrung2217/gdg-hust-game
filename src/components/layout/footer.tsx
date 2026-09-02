import Link from "next/link";
import { Sparkles, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/40 mt-auto select-none">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row md:px-6 text-xs text-muted">
        <div className="flex flex-col items-center md:items-start gap-1">
          <div className="flex items-center gap-1.5 font-bold text-foreground">
            <span className="text-google-blue">G</span>
            <span className="text-google-red">D</span>
            <span className="text-google-yellow">G</span>
            <span className="text-google-green"> Game Arcade</span>
            <Sparkles className="h-3.5 w-3.5 text-google-yellow" />
          </div>
          <p className="text-[11px] text-muted">
            Tổ hợp 9 trò chơi trí tuệ & phản xạ theo ngôn ngữ thiết kế Google Material Design 3.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 font-medium">
          <Link href="/" className="transition-colors hover:text-foreground">
            Trang chủ
          </Link>
          <Link href="/leaderboard" className="transition-colors hover:text-foreground">
            Bảng xếp hạng
          </Link>
          <Link href="/games/tetris" className="transition-colors hover:text-foreground">
            Tetris
          </Link>
          <Link href="/games/minesweeper" className="transition-colors hover:text-foreground">
            Minesweeper
          </Link>
          <Link href="/games/wordle" className="transition-colors hover:text-foreground">
            Wordle
          </Link>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-muted">
          <span>Phát triển bởi</span>
          <span className="font-bold text-foreground">GDG on Campus</span>
          <Heart className="h-3 w-3 text-google-red fill-current" />
        </div>
      </div>
    </footer>
  );
}
