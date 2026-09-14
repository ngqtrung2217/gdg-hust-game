"use client";

import { useEffect, useState, ReactNode } from "react";
import {
  Shield,
  ShieldCheck,
  Sparkles,
  KeyRound,
  User,
  ArrowRight,
  Loader2,
  Copy,
  Check,
  Trophy,
  LogOut,
} from "lucide-react";
import {
  getActivePlayer,
  registerPlayerAccount,
  loginWithCode,
  logoutPlayer,
  type PlayerProfile,
} from "@/lib/player";
import { initGameSession } from "@/lib/game-session";

interface TeamGateProps {
  gameSlug: string;
  gameName: string;
  gameColor?: string;
  children: ReactNode;
}

export function TeamGate({ gameSlug, gameName, gameColor = "text-google-blue", children }: TeamGateProps) {
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"register" | "login">("register");

  // Form states
  const [teamName, setTeamName] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdPlayer, setCreatedPlayer] = useState<PlayerProfile | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const cur = getActivePlayer();
    setPlayer(cur);
    setIsLoading(false);

    if (cur?.code) {
      initGameSession(gameSlug).catch(() => {});
    }

    const onPlayerChange = (e: Event) => {
      const customEvent = e as CustomEvent<PlayerProfile | null>;
      const nextPlayer = customEvent.detail ?? null;
      setPlayer(nextPlayer);
      if (nextPlayer?.code) {
        initGameSession(gameSlug).catch(() => {});
      }
    };

    window.addEventListener("gdg-player-changed", onPlayerChange);
    return () => {
      window.removeEventListener("gdg-player-changed", onPlayerChange);
    };
  }, [gameSlug]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = teamName.trim();
    if (!trimmed) {
      setErrorMsg("Vui lòng nhập tên Đội hoặc biệt danh tuyển thủ!");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await registerPlayerAccount(trimmed);
    setIsSubmitting(false);

    if (res.success && res.player) {
      setCreatedPlayer(res.player);
      setPlayer(res.player);
      initGameSession(gameSlug).catch(() => {});
    } else {
      setErrorMsg(res.error || "Không thể tạo đội lúc này. Vui lòng thử lại!");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = loginCode.replace(/\D/g, "").slice(0, 6);
    if (cleanCode.length !== 6) {
      setErrorMsg("Mã Đội gồm đúng 6 chữ số (ví dụ: 123456)!");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await loginWithCode(cleanCode);
    setIsSubmitting(false);

    if (res.success && res.player) {
      setPlayer(res.player);
      initGameSession(gameSlug).catch(() => {});
    } else {
      setErrorMsg(res.error || "Mã 6 số không chính xác hoặc đội chưa tồn tại!");
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    logoutPlayer();
    setPlayer(null);
    setCreatedPlayer(null);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 1. Success Banner right after creating team
  if (createdPlayer && player) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center rounded-3xl border border-border bg-surface p-6 sm:p-8 text-center shadow-lg animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-google-green/10 text-google-green">
          <Sparkles className="h-8 w-8" />
        </div>

        <span className="rounded-full bg-google-green/15 px-3 py-1 text-xs font-bold text-google-green">
          Tạo Đội Thành Công!
        </span>

        <h2 className="mt-3 text-2xl font-black text-foreground">
          Chào mừng <span className="text-google-blue">{createdPlayer.name}</span>
        </h2>
        <p className="mt-1 text-xs text-muted">
          Đây là Mã 6 số bí mật của Đội. Hãy lưu lại để đăng nhập trên thiết bị khác:
        </p>

        <div className="my-5 flex w-full items-center justify-between rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <KeyRound className="h-5 w-5 text-primary" />
            <span className="font-mono text-2xl font-black tracking-widest text-primary">
              {createdPlayer.code}
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleCopyCode(createdPlayer.code)}
            className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-surface px-3 py-1.5 text-xs font-bold text-primary transition-all hover:bg-surface-hover active:scale-95"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-google-green" />
                <span>Đã sao chép</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Sao chép</span>
              </>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setCreatedPlayer(null)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-bold text-on-primary shadow-md transition-all hover:opacity-90 active:scale-95"
        >
          <span>Vào chơi {gameName} ngay</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // 2. UNLOCKED: Player has an active team -> Render team badge & Game
  if (player?.code) {
    return (
      <div className="flex w-full flex-col gap-4">
        {/* Active Team Verified Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-google-green/10 text-google-green">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted">Đội thi đấu:</span>
              <span className="text-sm font-black text-foreground">{player.name}</span>
              <span className="rounded bg-primary/20 px-2 py-0.5 text-xs font-mono font-bold text-primary">
                #{player.code}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-muted">
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-google-green font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-google-green animate-pulse" />
              Lưu điểm trực tiếp DB
            </span>
            <span className="text-border">|</span>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1 text-xs font-semibold text-muted hover:text-google-red transition-colors"
              title="Đổi đội khác"
            >
              <LogOut className="h-3 w-3" />
              <span>Đổi đội</span>
            </button>
          </div>
        </div>

        {/* Game Stage Content */}
        {children}
      </div>
    );
  }

  // 3. LOCKED: Player has NOT created a team -> Show Mandatory Gate
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center rounded-3xl border border-border bg-surface p-6 sm:p-8 text-center shadow-lg animate-in fade-in duration-200">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-google-blue/10 text-google-blue">
        <Shield className="h-7 w-7" />
      </div>

      <div className="flex items-center gap-1.5 mb-1">
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
          Bắt buộc đăng ký
        </span>
      </div>

      <h2 className="text-2xl font-black tracking-tight text-foreground">
        Tạo Đội để Chơi {gameName}
      </h2>
      <p className="mt-1.5 text-xs text-muted leading-relaxed">
        Để chống gian lận và tự động đồng bộ điểm số vào Database Bảng xếp hạng GDG HUST, vui lòng tạo đội hoặc đăng nhập mã trước khi chơi.
      </p>

      {/* Tabs */}
      <div className="my-5 flex w-full rounded-2xl bg-surface-hover p-1 border border-border">
        <button
          type="button"
          onClick={() => {
            setActiveTab("register");
            setErrorMsg(null);
          }}
          className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
            activeTab === "register"
              ? "bg-surface text-foreground shadow-xs"
              : "text-muted hover:text-foreground"
          }`}
        >
          Tạo Đội Mới
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("login");
            setErrorMsg(null);
          }}
          className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
            activeTab === "login"
              ? "bg-surface text-foreground shadow-xs"
              : "text-muted hover:text-foreground"
          }`}
        >
          Đã Có Mã 6 Số
        </button>
      </div>

      {errorMsg && (
        <div className="mb-4 w-full rounded-xl bg-google-red/10 border border-google-red/20 p-2.5 text-left text-xs font-medium text-google-red">
          {errorMsg}
        </div>
      )}

      {activeTab === "register" ? (
        <form onSubmit={handleRegister} className="flex w-full flex-col gap-3">
          <div className="relative flex items-center">
            <User className="absolute left-3.5 h-4 w-4 text-muted pointer-events-none" />
            <input
              type="text"
              required
              maxLength={25}
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Nhập tên Đội thi đấu (VD: GDG Devs)"
              className="w-full rounded-2xl border border-border bg-background py-3 pl-10 pr-4 text-sm font-medium text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-bold text-on-primary shadow-md transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang tạo đội...</span>
              </>
            ) : (
              <>
                <span>Tạo Đội & Nhận Mã Ngay</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleLogin} className="flex w-full flex-col gap-3">
          <div className="relative flex items-center">
            <KeyRound className="absolute left-3.5 h-4 w-4 text-muted pointer-events-none" />
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={loginCode}
              onChange={(e) => setLoginCode(e.target.value.replace(/\D/g, ""))}
              placeholder="Nhập mã 6 chữ số bí mật"
              className="w-full rounded-2xl border border-border bg-background py-3 pl-10 pr-4 text-center text-lg font-mono font-bold tracking-widest text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-bold text-on-primary shadow-md transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang đăng nhập...</span>
              </>
            ) : (
              <>
                <span>Vào Đội & Mở Khóa Game</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      )}

      <div className="mt-5 flex items-center gap-2 text-[11px] text-muted">
        <Trophy className="h-3.5 w-3.5 text-google-yellow" />
        <span>Điểm số sẽ được đồng bộ thẳng vào Database & Bảng xếp hạng.</span>
      </div>
    </div>
  );
}
