"use client";

import { useState, useEffect } from "react";
import {
  X,
  User,
  KeyRound,
  Check,
  Copy,
  Sparkles,
  LogOut,
  Trophy,
  ArrowRight,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import {
  getActivePlayer,
  registerPlayerAccount,
  loginWithCode,
  logoutPlayer,
  type PlayerProfile,
} from "@/lib/player";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "create" | "login" | "profile";
}

export function AuthModal({ isOpen, onClose, initialTab = "create" }: AuthModalProps) {
  const [tab, setTab] = useState<"create" | "login" | "profile" | "success">("create");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [player, setPlayer] = useState<PlayerProfile | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setCopied(false);
      const cur = getActivePlayer();
      setPlayer(cur);
      if (cur?.code) {
        setTab(initialTab === "login" ? "login" : "profile");
      } else {
        setTab(initialTab === "login" ? "login" : "create");
      }
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Vui lòng nhập tên người chơi");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await registerPlayerAccount(trimmed);
    setLoading(false);

    if (res.success && res.player) {
      setPlayer(res.player);
      setTab("success");
    } else {
      setError(res.error || "Không thể tạo tài khoản, vui lòng thử lại!");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.replace(/\D/g, "").slice(0, 6);
    if (cleanCode.length !== 6) {
      setError("Mã gồm đúng 6 chữ số (ví dụ: 123456)");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await loginWithCode(cleanCode);
    setLoading(false);

    if (res.success && res.player) {
      setPlayer(res.player);
      setTab("profile");
    } else {
      setError(res.error || "Mã 6 số không đúng hoặc chưa tồn tại!");
    }
  };

  const handleCopyCode = (codeToCopy: string) => {
    if (!codeToCopy) return;
    navigator.clipboard.writeText(codeToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    logoutPlayer();
    setPlayer(null);
    setName("");
    setCode("");
    setTab("create");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-hover hover:text-foreground active:scale-95"
          aria-label="Đóng"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Tab: Success Created */}
        {tab === "success" && player && (
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-google-green/10 text-google-green shadow-inner">
              <Sparkles className="h-8 w-8" />
            </div>

            <h3 className="text-xl font-black text-foreground">
              Tạo tài khoản thành công!
            </h3>
            <p className="mt-1 text-xs text-muted">
              Xin chào <strong className="text-foreground">{player.name}</strong>, dưới đây là mã định danh 6 số của bạn:
            </p>

            {/* 6 Digit Display */}
            <div className="my-6 flex items-center justify-center gap-2">
              {player.code.split("").map((digit, idx) => (
                <div
                  key={idx}
                  className="flex h-12 w-10 sm:h-14 sm:w-12 items-center justify-center rounded-2xl border-2 border-primary/30 bg-primary/5 text-2xl sm:text-3xl font-black text-primary shadow-xs"
                >
                  {digit}
                </div>
              ))}
            </div>

            {/* Copy Button */}
            <button
              onClick={() => handleCopyCode(player.code)}
              className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-xs font-bold text-foreground transition-all hover:bg-surface-hover active:scale-95 mb-4"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-google-green" />
                  <span className="text-google-green">Đã sao chép mã!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-muted" />
                  <span>Sao chép mã 6 số</span>
                </>
              )}
            </button>

            {/* Notice box */}
            <div className="mb-6 flex items-start gap-2.5 rounded-2xl border border-google-yellow/30 bg-google-yellow/5 p-3.5 text-left text-xs text-foreground/90">
              <ShieldAlert className="h-5 w-5 text-google-yellow shrink-0 mt-0.5" />
              <span>
                <strong>Lưu ý:</strong> Hãy ghi nhớ mã 6 số này. Khi sang thiết bị khác, bạn chỉ cần nhập mã để tiếp tục tích điểm lên Bảng Xếp Hạng.
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-full rounded-2xl bg-primary py-3 text-sm font-bold text-on-primary transition-all hover:opacity-90 active:scale-95 shadow-md shadow-primary/20"
            >
              Bắt đầu chơi & Tích điểm
            </button>
          </div>
        )}

        {/* Tab: Profile (Logged In) */}
        {tab === "profile" && player && (
          <div className="flex flex-col">
            <div className="flex items-center gap-3.5 mb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <User className="h-7 w-7" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  Tài khoản GDG Arcade
                </span>
                <h3 className="text-xl font-black text-foreground">{player.name}</h3>
                <span className="inline-flex items-center gap-1.5 text-xs text-google-green font-medium">
                  <span className="h-2 w-2 rounded-full bg-google-green animate-pulse" />
                  Đang đồng bộ điểm Cloud
                </span>
              </div>
            </div>

            {/* 6-Digit Code Card */}
            <div className="mb-6 rounded-2xl border border-border bg-background/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-muted tracking-wider">
                    Mã 6 số của bạn
                  </div>
                  <div className="text-2xl font-black tracking-widest text-primary font-mono mt-0.5">
                    {player.code}
                  </div>
                </div>

                <button
                  onClick={() => handleCopyCode(player.code)}
                  className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-bold text-foreground transition-all hover:bg-surface-hover active:scale-95"
                  title="Sao chép mã"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-google-green" />
                      <span className="text-google-green">Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-muted" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-muted mt-2">
                Dùng mã này để đăng nhập lại trên thiết bị khác hoặc phục hồi điểm.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={onClose}
                className="w-full rounded-2xl bg-primary py-3 text-sm font-bold text-on-primary transition-all hover:opacity-90 active:scale-95 shadow-md shadow-primary/20"
              >
                Tiếp tục chơi
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 rounded-2xl border border-border py-2.5 text-xs font-bold text-muted transition-colors hover:bg-google-red/10 hover:text-google-red hover:border-google-red/30 active:scale-95"
              >
                <LogOut className="h-3.5 w-3.5" />
                Đăng xuất / Đổi tài khoản khác
              </button>
            </div>
          </div>
        )}

        {/* Tab: Create Account */}
        {tab === "create" && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-foreground">
                  Tạo tài khoản nhận mã
                </h3>
                <p className="text-xs text-muted">
                  Cấp mã 6 số để lưu kỷ lục và thi đua Leaderboard
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-google-red/30 bg-google-red/10 p-3 text-xs font-semibold text-google-red">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
                  Tên tuyển thủ hiển thị
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: Minh Quân, Alex..."
                    maxLength={30}
                    disabled={loading}
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 pl-11 text-sm font-medium text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    autoFocus
                  />
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-muted" />
                </div>
                <p className="text-[11px] text-muted mt-1.5">
                  Tên này sẽ hiển thị trên Bảng Xếp Hạng toàn cầu.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-on-primary transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 shadow-md shadow-primary/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tạo tài khoản...
                  </>
                ) : (
                  <>
                    Nhận mã 6 số & Tích điểm
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-border/70 text-center">
              <p className="text-xs text-muted">
                Đã có mã 6 số từ trước?{" "}
                <button
                  onClick={() => {
                    setError(null);
                    setTab("login");
                  }}
                  className="font-bold text-primary hover:underline ml-1"
                >
                  Đăng nhập ngay
                </button>
              </p>
            </div>
          </div>
        )}

        {/* Tab: Login with 6-digit Code */}
        {tab === "login" && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-google-blue/10 text-google-blue">
                <KeyRound className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-foreground">
                  Đăng nhập bằng mã 6 số
                </h3>
                <p className="text-xs text-muted">
                  Đồng bộ lại điểm số và tiếp tục chơi
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-google-red/30 bg-google-red/10 p-3 text-xs font-semibold text-google-red">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
                  Nhập mã 6 chữ số
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setCode(val);
                    }}
                    placeholder="123456"
                    maxLength={6}
                    disabled={loading}
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 pl-11 text-center font-mono text-xl font-black tracking-widest text-foreground placeholder:text-muted/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    autoFocus
                  />
                  <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-muted" />
                </div>
                <p className="text-[11px] text-muted mt-1.5 text-center">
                  Nhập chính xác 6 chữ số được cấp khi bạn tạo tài khoản.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-on-primary transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 shadow-md shadow-primary/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang kiểm tra mã...
                  </>
                ) : (
                  <>
                    Đăng nhập & Đồng bộ điểm
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-border/70 text-center">
              <p className="text-xs text-muted">
                Chưa có mã 6 số?{" "}
                <button
                  onClick={() => {
                    setError(null);
                    setTab("create");
                  }}
                  className="font-bold text-primary hover:underline ml-1"
                >
                  Tạo tài khoản mới
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
