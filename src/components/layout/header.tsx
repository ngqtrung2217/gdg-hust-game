"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Moon, Sun, Volume2, VolumeX, Sparkles } from "lucide-react";
import { useTheme } from "./theme-provider";
import { isAudioMuted, toggleAudioMuted } from "@/lib/audio";
import { getActivePlayer, type PlayerProfile } from "@/lib/player";
import { AuthModal } from "@/components/player/auth-modal";
import { GoogleDevLogo } from "@/components/ui/google-dev-logo";

export function Header() {
  const { theme, toggle } = useTheme();
  const [muted, setMuted] = useState(false);
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    setMuted(isAudioMuted());
    setPlayer(getActivePlayer());

    const onAudioChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ muted: boolean }>;
      if (customEvent.detail) {
        setMuted(customEvent.detail.muted);
      }
    };

    const onPlayerChange = (e: Event) => {
      const customEvent = e as CustomEvent<PlayerProfile | null>;
      setPlayer(customEvent.detail ?? null);
    };

    const onOpenAuth = () => {
      setIsAuthOpen(true);
    };

    window.addEventListener("gdg-audio-change", onAudioChange);
    window.addEventListener("gdg-player-changed", onPlayerChange);
    window.addEventListener("gdg-open-auth-modal", onOpenAuth);

    return () => {
      window.removeEventListener("gdg-audio-change", onAudioChange);
      window.removeEventListener("gdg-player-changed", onPlayerChange);
      window.removeEventListener("gdg-open-auth-modal", onOpenAuth);
    };
  }, []);

  const handleToggleAudio = () => {
    const next = toggleAudioMuted();
    setMuted(next);
  };

  return (
    <>
      <header className="sticky top-0 z-50 h-16 border-b border-border bg-background/80 backdrop-blur select-none">
        <div className="flex h-full items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group transition-transform active:scale-95 shrink-0">
            <GoogleDevLogo className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 transition-transform duration-200 group-hover:scale-105" />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight leading-none text-foreground whitespace-nowrap">
                  GDG on Campus <span className="text-google-blue font-black">- HUST</span>
                </span>
                <span className="hidden sm:inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary leading-none">
                  Arcade
                </span>
              </div>
              <span className="text-[10px] font-semibold text-muted tracking-wide mt-0.5 whitespace-nowrap">
                Google Developer Groups • ĐH Bách khoa Hà Nội
              </span>
            </div>
          </Link>
          <nav className="flex items-center gap-1.5 sm:gap-3">
            <Link
              href="/leaderboard"
              className="flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground mr-1"
            >
              <Trophy className="h-4 w-4 text-google-yellow" aria-hidden="true" />
              <span className="hidden sm:inline">Bảng xếp hạng</span>
            </Link>

            {/* Player Account Button */}
            {player?.code ? (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-all hover:bg-primary/20 active:scale-95"
                title={`Tuyển thủ: ${player.name} (#${player.code})`}
              >
                <span className="h-2 w-2 rounded-full bg-google-green animate-pulse" />
                <span className="max-w-[100px] truncate">{player.name}</span>
                <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-mono text-primary font-black">
                  #{player.code}
                </span>
              </button>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary px-3 py-1.5 text-xs font-bold text-on-primary transition-all hover:opacity-90 active:scale-95 shadow-xs shadow-primary/20"
                title="Tạo tên hoặc đăng nhập mã 6 số để lưu điểm"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Mã 6 số</span>
              </button>
            )}

            {/* Global Audio Mute Toggle Button */}
            <button
              onClick={handleToggleAudio}
              aria-label={muted ? "Bật âm thanh" : "Tắt âm thanh"}
              title={muted ? "Bật âm thanh (Đang tắt)" : "Tắt âm thanh (Đang bật)"}
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-border bg-surface text-muted transition-colors hover:bg-surface-hover hover:text-foreground active:scale-95"
            >
              {muted ? (
                <VolumeX className="h-4 w-4 sm:h-5 sm:w-5 text-google-red" aria-hidden="true" />
              ) : (
                <Volume2 className="h-4 w-4 sm:h-5 sm:w-5 text-google-green" aria-hidden="true" />
              )}
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggle}
              aria-label="Đổi giao diện Sáng / Tối"
              title="Đổi giao diện Sáng / Tối"
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-border bg-surface text-muted transition-colors hover:bg-surface-hover hover:text-foreground active:scale-95"
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              ) : (
                <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-google-yellow" aria-hidden="true" />
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Auth & Player Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
