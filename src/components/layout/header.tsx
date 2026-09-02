"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Moon, Sun, Volume2, VolumeX } from "lucide-react";
import { useTheme } from "./theme-provider";
import { isAudioMuted, toggleAudioMuted } from "@/lib/audio";

export function Header() {
  const { theme, toggle } = useTheme();
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(isAudioMuted());

    const onAudioChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ muted: boolean }>;
      if (customEvent.detail) {
        setMuted(customEvent.detail.muted);
      }
    };

    window.addEventListener("gdg-audio-change", onAudioChange);
    return () => window.removeEventListener("gdg-audio-change", onAudioChange);
  }, []);

  const handleToggleAudio = () => {
    const next = toggleAudioMuted();
    setMuted(next);
  };

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-border bg-background/80 backdrop-blur select-none">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-black tracking-tight leading-none">
              <span className="text-google-blue">G</span>
              <span className="text-google-red">D</span>
              <span className="text-google-yellow">G</span>
              <span className="text-google-green"> Arcade</span>
            </span>
            <span className="text-[10px] font-semibold text-muted tracking-wide mt-0.5">
              Phát triển bởi <strong className="text-foreground">GDG-HUST</strong>
            </span>
          </div>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/leaderboard"
            className="flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground mr-1"
          >
            <Trophy className="h-4 w-4 text-google-yellow" aria-hidden="true" />
            <span className="hidden sm:inline">Bảng xếp hạng</span>
          </Link>

          {/* Global Audio Mute Toggle Button */}
          <button
            onClick={handleToggleAudio}
            aria-label={muted ? "Bật âm thanh" : "Tắt âm thanh"}
            title={muted ? "Bật âm thanh (Đang tắt)" : "Tắt âm thanh (Đang bật)"}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-muted transition-colors hover:bg-surface-hover hover:text-foreground active:scale-95"
          >
            {muted ? (
              <VolumeX className="h-5 w-5 text-google-red" aria-hidden="true" />
            ) : (
              <Volume2 className="h-5 w-5 text-google-green" aria-hidden="true" />
            )}
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggle}
            aria-label="Đổi giao diện Sáng / Tối"
            title="Đổi giao diện Sáng / Tối"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-muted transition-colors hover:bg-surface-hover hover:text-foreground active:scale-95"
          >
            {theme === "light" ? (
              <Moon className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Sun className="h-5 w-5 text-google-yellow" aria-hidden="true" />
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
