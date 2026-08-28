"use client";

import Link from "next/link";
import { Trophy, Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";

export function Header() {
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-border bg-background/80 backdrop-blur">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tight">
            <span className="text-google-blue">G</span>
            <span className="text-google-red">D</span>
            <span className="text-google-yellow">G</span>
            <span className="text-google-green"> Arcade</span>
          </span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/leaderboard"
            className="flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            <Trophy className="h-4 w-4" aria-hidden="true" />
            Bảng xếp hạng
          </Link>
          <button
            onClick={toggle}
            aria-label="Đổi theme"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface transition-colors hover:bg-surface-hover"
          >
            {theme === "light" ? (
              <Moon className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Sun className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
