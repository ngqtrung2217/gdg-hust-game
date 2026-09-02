export type ColorKey = "blue" | "red" | "yellow" | "green";

export interface ColorDef {
  key: ColorKey;
  label: string; // Vietnamese label
  hex: string;
  textColorClass: string;
  bgClass: string;
}

export const GOOGLE_COLORS: ColorDef[] = [
  {
    key: "blue",
    label: "XANH DƯƠNG",
    hex: "#4285f4",
    textColorClass: "text-[#4285f4]",
    bgClass: "bg-[#4285f4]",
  },
  {
    key: "red",
    label: "ĐỎ",
    hex: "#ea4335",
    textColorClass: "text-[#ea4335]",
    bgClass: "bg-[#ea4335]",
  },
  {
    key: "yellow",
    label: "VÀNG",
    hex: "#fbbc04",
    textColorClass: "text-[#fbbc04]",
    bgClass: "bg-[#fbbc04]",
  },
  {
    key: "green",
    label: "XANH LÁ",
    hex: "#34a853",
    textColorClass: "text-[#34a853]",
    bgClass: "bg-[#34a853]",
  },
];

export type StroopVariant = "ink_color" | "word_meaning" | "shape_color";

export interface StroopCard {
  id: string;
  variant: StroopVariant;
  instruction: string;
  displayWord: string;
  displayColor: ColorDef; // Ink color
  correctColorKey: ColorKey;
  shape?: "circle" | "square" | "triangle" | "star";
}

export function generateStroopCard(level: number): StroopCard {
  // Determine variant based on level / random
  let variant: StroopVariant = "ink_color";
  if (level >= 3 && Math.random() < 0.4) {
    variant = "word_meaning";
  } else if (level >= 5 && Math.random() < 0.3) {
    variant = "shape_color";
  }

  // Pick random word and ink color
  const wordDef = GOOGLE_COLORS[Math.floor(Math.random() * GOOGLE_COLORS.length)];
  let inkDef = GOOGLE_COLORS[Math.floor(Math.random() * GOOGLE_COLORS.length)];

  // 80% of the time, make word and ink MISMATCH to trigger Stroop interference
  if (Math.random() < 0.8) {
    while (inkDef.key === wordDef.key) {
      inkDef = GOOGLE_COLORS[Math.floor(Math.random() * GOOGLE_COLORS.length)];
    }
  }

  let instruction = "Chọn MÀU MỰC của chữ (bỏ qua nghĩa của từ)";
  let correctColorKey: ColorKey = inkDef.key;

  if (variant === "word_meaning") {
    instruction = "Chọn Ý NGHĨA CỦA TỪ (bỏ qua màu mực)";
    correctColorKey = wordDef.key;
  } else if (variant === "shape_color") {
    instruction = "Chọn MÀU SẮC của hình biểu tượng";
    correctColorKey = inkDef.key;
  }

  const shapes = ["circle", "square", "triangle", "star"] as const;
  const shape = shapes[Math.floor(Math.random() * shapes.length)];

  return {
    id: `${Date.now()}-${Math.random()}`,
    variant,
    instruction,
    displayWord: wordDef.label,
    displayColor: inkDef,
    correctColorKey,
    shape,
  };
}

export function getMultiplier(streak: number): number {
  if (streak >= 16) return 5;
  if (streak >= 12) return 4;
  if (streak >= 8) return 3;
  if (streak >= 4) return 2;
  return 1;
}

export function getReflexRating(avgTimeMs: number, accuracy: number): { title: string; color: string; icon: string } {
  if (accuracy >= 92 && avgTimeMs < 550) {
    return { title: "Phản Xạ Thần Thánh", color: "text-google-yellow", icon: "Zap" };
  }
  if (accuracy >= 85 && avgTimeMs < 750) {
    return { title: "Nhanh Như Chớp", color: "text-google-green", icon: "Target" };
  }
  if (accuracy >= 75 && avgTimeMs < 1000) {
    return { title: "Phản Xạ Khá Tốt", color: "text-google-blue", icon: "ThumbsUp" };
  }
  return { title: "Cần Rèn Luyện Thêm", color: "text-muted", icon: "Dumbbell" };
}
