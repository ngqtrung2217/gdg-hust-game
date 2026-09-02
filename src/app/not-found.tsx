import Link from "next/link";
import { ArrowLeft, Gamepad2, Ghost } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-12 text-center select-none">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary mb-6 shadow-sm animate-bounce">
        <Ghost className="h-10 w-10" />
      </div>

      <h1 className="text-6xl sm:text-7xl font-black tracking-tight mb-2">
        <span className="text-google-blue">4</span>
        <span className="text-google-red">0</span>
        <span className="text-google-yellow">4</span>
      </h1>

      <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
        Không tìm thấy trang yêu cầu
      </h2>

      <p className="max-w-md text-sm text-muted mb-8 leading-relaxed">
        Trò chơi hoặc đường dẫn bạn truy cập hiện không tồn tại hoặc đã được chuyển sang địa chỉ khác. Hãy quay về sảnh Arcade để tiếp tục khám phá!
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-on-primary shadow-lg transition-all hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          Về sảnh chính Arcade
        </Link>
        <Link
          href="/leaderboard"
          className="flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-3 text-sm font-semibold text-foreground transition-all hover:bg-surface-hover active:scale-95"
        >
          <Gamepad2 className="h-4 w-4 text-google-green" />
          Xem Bảng xếp hạng
        </Link>
      </div>
    </div>
  );
}
