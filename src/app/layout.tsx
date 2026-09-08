import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "GDG on Campus - HUST Arcade | 9 Trò Chơi Trí Tuệ & Phản Xạ",
    template: "%s | GDG on Campus - HUST Arcade",
  },
  description:
    "Tổ hợp 9 trò chơi giải đố, chiến thuật và rèn luyện phản xạ theo ngôn ngữ thiết kế Google Material 3, phát triển bởi GDG on Campus - HUST (Đại học Bách khoa Hà Nội). Chơi ngay trên trình duyệt và di động!",
  keywords: [
    "GDG on Campus - HUST",
    "GDG on Campus HUST",
    "GDG HUST",
    "GDG",
    "Google Developer Groups",
    "Google Developer Groups on Campus",
    "Game Arcade",
    "Tetris",
    "Wordle",
    "Minesweeper",
    "Othello",
    "Dino Run",
    "Mini Game",
  ],
  authors: [{ name: "GDG on Campus - HUST" }],
  openGraph: {
    title: "GDG on Campus - HUST Arcade | 9 Trò Chơi Trí Tuệ & Phản Xạ",
    description:
      "Chơi ngay 9 mini-game chuẩn Google Material 3 phát triển bởi GDG on Campus - HUST: Tetris, Wordle, Minesweeper, Othello, Dino Run, v.v.",
    type: "website",
    locale: "vi_VN",
    siteName: "GDG on Campus - HUST Arcade",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${roboto.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
