import { CHARACTERS, type Character } from "./characters";

export interface QuestionDef {
  id: string;
  category: "type" | "color" | "time" | "feature";
  text: string;
  evaluator: (char: Character) => boolean;
  positiveReason: string;
  negativeReason: string;
}

export const QUESTIONS: QuestionDef[] = [
  // 1. Category / Type
  {
    id: "is_ai",
    category: "type",
    text: "Có phải sản phẩm Trí tuệ nhân tạo (AI / Machine Learning) không?",
    evaluator: (c) => c.category === "ai",
    positiveReason: "Đúng! Đây là sản phẩm thuộc lĩnh vực Trí tuệ nhân tạo (AI).",
    negativeReason: "Không! Đây không phải sản phẩm AI cốt lõi.",
  },
  {
    id: "is_dev_tool",
    category: "type",
    text: "Có phải công cụ dành cho Lập trình viên / Developer không?",
    evaluator: (c) => c.isDevTool,
    positiveReason: "Đúng! Sản phẩm này phục vụ đắc lực cho các lập trình viên và kỹ sư phần mềm.",
    negativeReason: "Không! Sản phẩm này chủ yếu hướng đến người dùng thông thường.",
  },
  {
    id: "is_productivity",
    category: "type",
    text: "Có phải công cụ làm việc văn phòng / lưu trữ / giao tiếp không?",
    evaluator: (c) => c.category === "productivity",
    positiveReason: "Đúng! Đây là công cụ phục vụ công việc, tài liệu hoặc giao tiếp hàng ngày.",
    negativeReason: "Không! Đây không phải ứng dụng văn phòng / lưu trữ.",
  },
  {
    id: "is_os_hardware",
    category: "type",
    text: "Có phải Hệ điều hành hoặc Thiết bị phần cứng không?",
    evaluator: (c) => c.category === "os_hardware",
    positiveReason: "Đúng! Đây là hệ điều hành hoặc thiết bị phần cứng.",
    negativeReason: "Không! Đây là phần mềm ứng dụng hoặc dịch vụ đám mây.",
  },
  {
    id: "is_media",
    category: "type",
    text: "Có phải ứng dụng Đa phương tiện (Video, Ảnh, Giải trí) không?",
    evaluator: (c) => c.category === "media_consumer",
    positiveReason: "Đúng! Sản phẩm tập trung vào trải nghiệm nội dung, video hoặc giải trí.",
    negativeReason: "Không! Đây không thuộc nhóm nội dung / giải trí.",
  },

  // 2. Visual / Mascot / Logo
  {
    id: "has_mascot",
    category: "feature",
    text: "Nhân vật này có Linh vật (Mascot) biểu tượng không?",
    evaluator: (c) => c.hasMascot,
    positiveReason: "Đúng! Sản phẩm này có linh vật đại diện rất nổi tiếng (như Bugdroid, Dash, Dino, Gopher)!",
    negativeReason: "Không! Sản phẩm này không có linh vật cụ thể, chỉ có logo biểu trưng.",
  },
  {
    id: "has_letter_g",
    category: "feature",
    text: "Tên hoặc logo có chứa chữ cái 'G' không?",
    evaluator: (c) => c.hasLetterG,
    positiveReason: "Đúng! Tên gọi hoặc biểu tượng có chữ cái 'G' (Google/Gmail/Go/Gemini...).",
    negativeReason: "Không! Tên và biểu tượng không dựa trên chữ 'G'.",
  },

  // 3. Colors
  {
    id: "color_multi",
    category: "color",
    text: "Logo có phối 4 màu đặc trưng của Google (Đa sắc) không?",
    evaluator: (c) => c.primaryColor === "multi",
    positiveReason: "Đúng! Logo kết hợp rực rỡ 4 màu chuẩn của Google.",
    negativeReason: "Không! Logo chủ yếu sử dụng 1 tone màu chủ đạo riêng biệt.",
  },
  {
    id: "color_blue",
    category: "color",
    text: "Màu sắc chủ đạo có phải là màu Xanh dương (Blue) không?",
    evaluator: (c) => c.primaryColor === "blue",
    positiveReason: "Đúng! Sản phẩm lấy màu Xanh dương làm màu sắc nhận diện chính.",
    negativeReason: "Không! Màu sắc chủ đạo không phải màu Xanh dương.",
  },
  {
    id: "color_red",
    category: "color",
    text: "Màu sắc chủ đạo có phải là màu Đỏ (Red) không?",
    evaluator: (c) => c.primaryColor === "red",
    positiveReason: "Đúng! Sản phẩm gắn liền với tone màu Đỏ nổi bật.",
    negativeReason: "Không! Màu sắc chủ đạo không phải màu Đỏ.",
  },
  {
    id: "color_green",
    category: "color",
    text: "Màu sắc chủ đạo có phải là màu Xanh lá (Green) không?",
    evaluator: (c) => c.primaryColor === "green",
    positiveReason: "Đúng! Màu sắc thương hiệu gắn liền với màu Xanh lá.",
    negativeReason: "Không! Màu sắc không phải là Xanh lá.",
  },

  // 4. Timeline
  {
    id: "time_pre2010",
    category: "time",
    text: "Sản phẩm được ra mắt trước năm 2010 (thời kỳ đầu của Google) không?",
    evaluator: (c) => c.decade === "pre2010",
    positiveReason: "Đúng! Đây là một sản phẩm kỳ cựu ra đời trước năm 2010.",
    negativeReason: "Không! Sản phẩm này ra đời từ năm 2010 trở về sau.",
  },
  {
    id: "time_2010s",
    category: "time",
    text: "Sản phẩm được ra mắt trong giai đoạn từ 2010 đến 2019 không?",
    evaluator: (c) => c.decade === "2010s",
    positiveReason: "Đúng! Sản phẩm được Google trình làng trong thập niên 2010 (2010 - 2019).",
    negativeReason: "Không! Sản phẩm ra mắt ngoài giai đoạn 2010-2019.",
  },
  {
    id: "time_2020s",
    category: "time",
    text: "Sản phẩm mới ra mắt gần đây (từ năm 2020 trở lại đây) không?",
    evaluator: (c) => c.decade === "2020s",
    positiveReason: "Đúng! Đây là sản phẩm / sáng kiến rất mới của thập niên 2020.",
    negativeReason: "Không! Sản phẩm này đã có tuổi đời lâu hơn năm 2020.",
  },
];

export interface AnswerResult {
  questionId: string;
  questionText: string;
  answer: boolean;
  explanation: string;
  matchingIds: string[];
  eliminatedIds: string[];
}

export function pickRandomTarget(excludeId?: string): Character {
  const available = excludeId ? CHARACTERS.filter((c) => c.id !== excludeId) : CHARACTERS;
  const index = Math.floor(Math.random() * available.length);
  return available[index];
}

export function evaluateQuestion(questionId: string, target: Character): AnswerResult | null {
  const q = QUESTIONS.find((item) => item.id === questionId);
  if (!q) return null;

  const answer = q.evaluator(target);
  const matchingIds: string[] = [];
  const eliminatedIds: string[] = [];

  for (const char of CHARACTERS) {
    if (q.evaluator(char) === answer) {
      matchingIds.push(char.id);
    } else {
      eliminatedIds.push(char.id);
    }
  }

  return {
    questionId,
    questionText: q.text,
    answer,
    explanation: answer ? q.positiveReason : q.negativeReason,
    matchingIds,
    eliminatedIds,
  };
}

// Natural Language question matcher
export function matchFreeformQuestion(query: string): QuestionDef | null {
  const q = query.toLowerCase().trim();

  // AI keywords
  if (q.includes("ai") || q.includes("trí tuệ nhân tạo") || q.includes("machine learning") || q.includes("học máy")) {
    return QUESTIONS.find((item) => item.id === "is_ai")!;
  }

  // Developer keywords
  if (q.includes("lập trình") || q.includes("dev") || q.includes("code") || q.includes("kỹ sư") || q.includes("công cụ")) {
    return QUESTIONS.find((item) => item.id === "is_dev_tool")!;
  }

  // Mascot keywords
  if (q.includes("linh vật") || q.includes("mascot") || q.includes("con vật") || q.includes("robot") || q.includes("khủng long")) {
    return QUESTIONS.find((item) => item.id === "has_mascot")!;
  }

  // Color keywords
  if (q.includes("màu đỏ") || q.includes("red")) {
    return QUESTIONS.find((item) => item.id === "color_red")!;
  }
  if (q.includes("xanh lá") || q.includes("green")) {
    return QUESTIONS.find((item) => item.id === "color_green")!;
  }
  if (q.includes("xanh dương") || q.includes("blue")) {
    return QUESTIONS.find((item) => item.id === "color_blue")!;
  }
  if (q.includes("4 màu") || q.includes("đa sắc") || q.includes("nhiều màu")) {
    return QUESTIONS.find((item) => item.id === "color_multi")!;
  }

  // Time keywords
  if (q.includes("2020") || q.includes("mới") || q.includes("gần đây")) {
    return QUESTIONS.find((item) => item.id === "time_2020s")!;
  }
  if (q.includes("2010") || q.includes("cũ") || q.includes("xưa")) {
    return QUESTIONS.find((item) => item.id === "time_pre2010")!;
  }

  // Letter G
  if (q.includes("chữ g") || q.includes("chữ cái g")) {
    return QUESTIONS.find((item) => item.id === "has_letter_g")!;
  }

  return null;
}

export function calculateScore(questionsCount: number, strikes: number): number {
  const base = 1000;
  const questionPenalty = questionsCount * 60;
  const strikePenalty = strikes * 150;
  return Math.max(100, base - questionPenalty - strikePenalty);
}
