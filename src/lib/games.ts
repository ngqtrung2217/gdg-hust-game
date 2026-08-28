export type GameCategory =
  | "Logic"
  | "Đoán từ"
  | "Nhớ"
  | "Endless runner"
  | "Chiến thuật"
  | "Suy luận"
  | "Puzzle"
  | "Tính toán"
  | "Phản xạ";

export interface GameMeta {
  slug: string;
  name: string;
  description: string;
  category: GameCategory;
  icon: string;
  color: string;
}

export const GAMES: GameMeta[] = [
  {
    slug: "minesweeper",
    name: "Minesweeper",
    description: "Dò mìn cổ điển — mở ô, tránh bom, dùng logic để thắng.",
    category: "Logic",
    icon: "Bomb",
    color: "text-google-blue",
  },
  {
    slug: "wordle",
    name: "Wordle",
    description: "Đoán từ 5 chữ trong 6 lượt. Mỗi lượt cho gợi ý màu.",
    category: "Đoán từ",
    icon: "Keyboard",
    color: "text-google-green",
  },
  {
    slug: "sequence-memory",
    name: "Sequence Memory",
    description: "Nhớ dãy ô sáng lên theo thứ tự. Càng lên level dãy càng dài.",
    category: "Nhớ",
    icon: "Grid3x3",
    color: "text-google-yellow",
  },
  {
    slug: "dino-run",
    name: "Dino Run",
    description: "Chạy trốn khỏi sa mạc — nhảy qua xương rồng, càng xa càng tốt.",
    category: "Endless runner",
    icon: "Footprints",
    color: "text-google-green",
  },
  {
    slug: "othello",
    name: "Othello",
    description: "Kẹp quân đối thủ để lật màu. Ai nhiều quân hơn sẽ thắng.",
    category: "Chiến thuật",
    icon: "Disc",
    color: "text-google-blue",
  },
  {
    slug: "guess-who",
    name: "Guess Who",
    description: "Hỏi câu hỏi đúng/sai để tìm ra nhân vật bí ẩn.",
    category: "Suy luận",
    icon: "UserSearch",
    color: "text-google-red",
  },
  {
    slug: "sokoban",
    name: "Sokoban",
    description: "Đẩy hộp về đích. Mỗi level là một câu đố không gian.",
    category: "Puzzle",
    icon: "Package",
    color: "text-google-yellow",
  },
  {
    slug: "math-blaster",
    name: "Math Blaster",
    description: "Tính toán thật nhanh trước khi hết giờ. Đúng càng liên tiếp càng điểm cao.",
    category: "Tính toán",
    icon: "Calculator",
    color: "text-google-red",
  },
  {
    slug: "stroop-test",
    name: "Stroop Test",
    description: "Chữ nói một đằng, màu hiện một nẻo. Chọn màu đúng thật nhanh.",
    category: "Phản xạ",
    icon: "Palette",
    color: "text-google-blue",
  },
];

export function getGame(slug: string): GameMeta | undefined {
  return GAMES.find((g) => g.slug === slug);
}
