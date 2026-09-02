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
    default: "GDG Game Arcade | 9 Trò Chơi Trí Tuệ & Phản Xạ",
    template: "%s | GDG Game Arcade",
  },
  description:
    "Tổ hợp 9 trò chơi giải đố, chiến thuật và rèn luyện phản xạ theo ngôn ngữ thiết kế Google Material 3 của GDG on Campus. Chơi ngay trên trình duyệt và di động!",
  keywords: [
    "GDG",
    "Google Developer Groups",
    "Game Arcade",
    "Tetris",
    "Wordle",
    "Minesweeper",
    "Othello",
    "Dino Run",
    "Mini Game",
  ],
  authors: [{ name: "GDG on Campus" }],
  openGraph: {
    title: "GDG Game Arcade | 9 Trò Chơi Trí Tuệ & Phản Xạ",
    description:
      "Chơi ngay 9 mini-game chuẩn Google Material 3: Tetris, Wordle, Minesweeper, Othello, Dino Run, v.v.",
    type: "website",
    locale: "vi_VN",
    siteName: "GDG Game Arcade",
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
