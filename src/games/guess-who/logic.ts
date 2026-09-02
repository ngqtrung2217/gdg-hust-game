import { CHARACTERS, type Character } from "./characters";

export type QuestionCategory = "all" | "tier" | "domain" | "brand" | "timeline" | "special";

export interface QuestionDef {
  id: string;
  category: QuestionCategory;
  categoryLabel: string;
  text: string;
  evaluator: (char: Character) => boolean;
  positiveReason: string;
  negativeReason: string;
  hintSplit: string;
}

export const QUESTIONS: QuestionDef[] = [
  // 1. Phân loại & Đối tượng (Tier & Audience)
  {
    id: "is_consumer",
    category: "tier",
    categoryLabel: "Phân loại",
    text: "Có phải sản phẩm phục vụ người dùng đại chúng (Consumer) không?",
    evaluator: (c) => c.isConsumer,
    positiveReason: "Đúng! Đây là sản phẩm dịch vụ hướng đến hàng tỷ người dùng cá nhân phổ thông hàng ngày.",
    negativeReason: "Không! Đây là công cụ chuyên sâu cho Lập trình viên hoặc Thẻ Boss công nghệ.",
    hintSplit: "15 thẻ ĐÚNG / 9 thẻ SAI",
  },
  {
    id: "is_developer",
    category: "tier",
    categoryLabel: "Phân loại",
    text: "Có phải công cụ / nền tảng dành riêng cho Lập trình viên & Kỹ sư không?",
    evaluator: (c) => c.isDeveloper,
    positiveReason: "Đúng! Đây là công nghệ sinh ra để phục vụ developer, kỹ sư hạ tầng hoặc nhà nghiên cứu AI.",
    negativeReason: "Không! Đây là ứng dụng phục vụ người dùng cá nhân hoặc công việc văn phòng thông thường.",
    hintSplit: "9 thẻ ĐÚNG / 15 thẻ SAI",
  },
  {
    id: "is_boss",
    category: "tier",
    categoryLabel: "Thẻ Boss",
    text: "Có phải Thẻ BOSS (Công nghệ huyền thoại làm thay đổi lịch sử máy tính thế giới) không?",
    evaluator: (c) => c.isBoss,
    positiveReason: "CHÍNH XÁC! Bạn đang đối đầu với một THẺ BOSS HUYỀN THOẠI (Kubernetes, Transformer, hoặc DeepMind)!",
    negativeReason: "Không! Đây không phải là Thẻ Boss.",
    hintSplit: "3 thẻ BOSS / 21 thẻ thường",
  },

  // 2. Công nghệ & Lĩnh vực (Domain & Tech)
  {
    id: "is_ai",
    category: "domain",
    categoryLabel: "Lĩnh vực",
    text: "Có phải công nghệ / sản phẩm cốt lõi về Trí tuệ nhân tạo (AI / Deep Learning) không?",
    evaluator: (c) => c.isCoreAI,
    positiveReason: "Đúng! Đây là sản phẩm hoặc kiến trúc AI cốt lõi (Photos, Translate, TensorFlow, Transformer, DeepMind).",
    negativeReason: "Không! Sản phẩm này không lấy mô hình AI làm bản chất cốt lõi.",
    hintSplit: "5 thẻ ĐÚNG / 19 thẻ SAI",
  },
  {
    id: "is_open_source",
    category: "domain",
    categoryLabel: "Mã nguồn mở",
    text: "Sản phẩm / Công nghệ này có mã nguồn mở (Open Source) không?",
    evaluator: (c) => c.isOpenSource,
    positiveReason: "Đúng! Dự án này được phát hành mã nguồn mở (Android/AOSP, Chromium, Flutter, Go, TensorFlow, Kubernetes).",
    negativeReason: "Không! Đây là dịch vụ phần mềm đóng hoặc đám mây độc quyền của Google.",
    hintSplit: "7 thẻ ĐÚNG / 17 thẻ SAI",
  },
  {
    id: "is_workspace",
    category: "domain",
    categoryLabel: "Lĩnh vực",
    text: "Có thuộc bộ ứng dụng làm việc văn phòng (Google Workspace) không?",
    evaluator: (c) => c.isWorkspaceApp,
    positiveReason: "Đúng! Đây là ứng dụng trong bộ công cụ văn phòng Google Workspace (Gmail, Drive, Docs, Calendar, Meet).",
    negativeReason: "Không! Đây không thuộc bộ ứng dụng văn phòng Workspace.",
    hintSplit: "5 thẻ ĐÚNG / 19 thẻ SAI",
  },
  {
    id: "has_hardware",
    category: "domain",
    categoryLabel: "Phần cứng",
    text: "Sản phẩm này có bao gồm thiết bị phần cứng vật lý (Điện thoại/Thiết bị) không?",
    evaluator: (c) => c.hasHardware,
    positiveReason: "Đúng! Đây là dòng thiết bị phần cứng vật lý (Google Pixel)!",
    negativeReason: "Không! Đây là phần mềm, dịch vụ đám mây hoặc thuật toán thuần túy.",
    hintSplit: "1 thẻ ĐÚNG (Pixel)",
  },

  // 3. Thương hiệu & Hình ảnh (Brand & Visual)
  {
    id: "has_mascot",
    category: "brand",
    categoryLabel: "Thương hiệu",
    text: "Nhân vật / Sản phẩm này có Linh vật (Mascot) chính thức nổi tiếng không?",
    evaluator: (c) => c.hasMascot,
    positiveReason: "Đúng! Sản phẩm này có linh vật đại diện trứ danh (Bugdroid, T-Rex Dino, Dash the bird, Gopher)!",
    negativeReason: "Không! Sản phẩm này không có linh vật cụ thể, chỉ có logo biểu trưng.",
    hintSplit: "5 thẻ ĐÚNG / 19 thẻ SAI",
  },
  {
    id: "has_letter_g",
    category: "brand",
    categoryLabel: "Thương hiệu",
    text: "Tên gọi hoặc logo có chứa chữ cái 'G' không?",
    evaluator: (c) => c.hasLetterG,
    positiveReason: "Đúng! Tên gọi hoặc biểu trưng có xuất hiện chữ cái 'G' (Google / Gmail / Go / GDG / DeepMind...).",
    negativeReason: "Không! Tên và biểu tượng không dựa trên chữ 'G'.",
    hintSplit: "13 thẻ ĐÚNG / 11 thẻ SAI (gần 50/50)",
  },
  {
    id: "color_multi",
    category: "brand",
    categoryLabel: "Màu sắc",
    text: "Logo có phối 4 màu đặc trưng của Google (Đa sắc) không?",
    evaluator: (c) => c.primaryColor === "multi",
    positiveReason: "Đúng! Logo kết hợp rực rỡ 4 màu chuẩn của Google (Đỏ, Vàng, Xanh lá, Xanh dương).",
    negativeReason: "Không! Logo chủ yếu sử dụng 1 tone màu chủ đạo riêng biệt.",
    hintSplit: "9 thẻ ĐÚNG / 15 thẻ SAI",
  },
  {
    id: "color_blue",
    category: "brand",
    categoryLabel: "Màu sắc",
    text: "Màu sắc nhận diện chủ đạo có phải là màu Xanh dương (Blue) không?",
    evaluator: (c) => c.primaryColor === "blue",
    positiveReason: "Đúng! Sản phẩm lấy tone màu Xanh dương làm màu sắc nhận diện chính.",
    negativeReason: "Không! Màu chủ đạo không phải màu Xanh dương.",
    hintSplit: "7 thẻ ĐÚNG / 17 thẻ SAI",
  },
  {
    id: "color_green",
    category: "brand",
    categoryLabel: "Màu sắc",
    text: "Màu sắc nhận diện chủ đạo có phải là màu Xanh lá (Green) không?",
    evaluator: (c) => c.primaryColor === "green",
    positiveReason: "Đúng! Màu sắc thương hiệu gắn liền với màu Xanh lá (Android, Chrome Dino, Meet).",
    negativeReason: "Không! Màu sắc không phải là Xanh lá.",
    hintSplit: "3 thẻ ĐÚNG / 21 thẻ SAI",
  },
  {
    id: "color_red_orange",
    category: "brand",
    categoryLabel: "Màu sắc",
    text: "Màu sắc nhận diện chủ đạo có phải là tone Đỏ hoặc Cam/Vàng không?",
    evaluator: (c) => c.primaryColor === "red" || c.primaryColor === "yellow_orange",
    positiveReason: "Đúng! Màu sắc thương hiệu nổi bật với tone Đỏ hoặc Cam/Vàng (YouTube, Gmail, Firebase, TensorFlow, Transformer).",
    negativeReason: "Không! Màu sắc chủ đạo thuộc gam màu khác.",
    hintSplit: "5 thẻ ĐÚNG / 19 thẻ SAI",
  },

  // 4. Dòng thời gian (Timeline)
  {
    id: "era_pioneer",
    category: "timeline",
    categoryLabel: "Dòng thời gian",
    text: "Được ra mắt vào thời kỳ đầu của Google (trước năm 2008) không?",
    evaluator: (c) => c.era === "pioneer",
    positiveReason: "Đúng! Đây là một sản phẩm kỳ cựu ra đời từ trước năm 2008.",
    negativeReason: "Không! Sản phẩm này ra đời từ năm 2008 trở về sau.",
    hintSplit: "7 thẻ ĐÚNG / 17 thẻ SAI",
  },
  {
    id: "era_growth",
    category: "timeline",
    categoryLabel: "Dòng thời gian",
    text: "Được ra mắt trong giai đoạn bùng nổ 2008 – 2016 không?",
    evaluator: (c) => c.era === "growth",
    positiveReason: "Đúng! Sản phẩm được Google phát hành trong giai đoạn bùng nổ 2008 - 2016.",
    negativeReason: "Không! Sản phẩm ra mắt ngoài giai đoạn này.",
    hintSplit: "13 thẻ ĐÚNG / 11 thẻ SAI (50/50)",
  },
  {
    id: "era_modern",
    category: "timeline",
    categoryLabel: "Dòng thời gian",
    text: "Được ra mắt hoặc công bố từ năm 2017 trở lại đây (Thời kỳ AI hiện đại) không?",
    evaluator: (c) => c.era === "modern",
    positiveReason: "Đúng! Đây là sản phẩm / sáng kiến rất mới mẻ của thời kỳ từ 2017 đến nay.",
    negativeReason: "Không! Sản phẩm này đã có tuổi đời trước năm 2017.",
    hintSplit: "4 thẻ ĐÚNG / 20 thẻ SAI",
  },

  // 5. Câu hỏi chuyên biệt & Thám tử (Special & Specific)
  {
    id: "is_geospatial",
    category: "special",
    categoryLabel: "Đặc thù",
    text: "Có liên quan trực tiếp đến bản đồ định vị, GPS hoặc chỉ đường giao thông không?",
    evaluator: (c) => c.id === "maps",
    positiveReason: "Đúng! Đây chính là dịch vụ bản đồ và định vị toàn cầu (Google Maps).",
    negativeReason: "Không! Sản phẩm không liên quan đến bản đồ giao thông.",
    hintSplit: "1 thẻ ĐÚNG (Google Maps)",
  },
  {
    id: "is_media_stream",
    category: "special",
    categoryLabel: "Đặc thù",
    text: "Có phục vụ phát video trực tuyến hoặc gọi video thời gian thực không?",
    evaluator: (c) => c.id === "youtube" || c.id === "meet",
    positiveReason: "Đúng! Ứng dụng tập trung vào truyền phát video hoặc hội thảo hình ảnh (YouTube, Google Meet).",
    negativeReason: "Không! Ứng dụng không chuyên về video streaming hoặc video meeting.",
    hintSplit: "2 thẻ ĐÚNG (YouTube, Meet)",
  },
  {
    id: "is_editor_text",
    category: "special",
    categoryLabel: "Đặc thù",
    text: "Có phải công cụ chuyên dùng để soạn thảo văn bản, tài liệu trực tuyến không?",
    evaluator: (c) => c.id === "docs",
    positiveReason: "Đúng! Đây chính là trình soạn thảo văn bản cộng tác (Google Docs).",
    negativeReason: "Không! Đây không phải trình soạn thảo văn bản.",
    hintSplit: "1 thẻ ĐÚNG (Google Docs)",
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

  // Boss
  if (q.includes("boss") || q.includes("trùm") || q.includes("huyền thoại") || q.includes("k8s") || q.includes("transformer") || q.includes("alphago")) {
    return QUESTIONS.find((item) => item.id === "is_boss")!;
  }

  // Developer & Tooling
  if (q.includes("lập trình") || q.includes("dev") || q.includes("code") || q.includes("kỹ sư") || q.includes("công cụ")) {
    return QUESTIONS.find((item) => item.id === "is_developer")!;
  }

  // Consumer
  if (q.includes("phổ thông") || q.includes("người dùng") || q.includes("consumer") || q.includes("đại chúng")) {
    return QUESTIONS.find((item) => item.id === "is_consumer")!;
  }

  // AI & Machine Learning
  if (q.includes("ai") || q.includes("trí tuệ nhân tạo") || q.includes("machine learning") || q.includes("học máy") || q.includes("deep learning")) {
    return QUESTIONS.find((item) => item.id === "is_ai")!;
  }

  // Open Source
  if (q.includes("mã nguồn mở") || q.includes("open source") || q.includes("opensource")) {
    return QUESTIONS.find((item) => item.id === "is_open_source")!;
  }

  // Workspace
  if (q.includes("workspace") || q.includes("văn phòng") || q.includes("office") || q.includes("tài liệu")) {
    return QUESTIONS.find((item) => item.id === "is_workspace")!;
  }

  // Hardware
  if (q.includes("phần cứng") || q.includes("điện thoại") || q.includes("thiết bị") || q.includes("hardware") || q.includes("pixel")) {
    return QUESTIONS.find((item) => item.id === "has_hardware")!;
  }

  // Mascot
  if (q.includes("linh vật") || q.includes("mascot") || q.includes("con vật") || q.includes("khủng long") || q.includes("robot")) {
    return QUESTIONS.find((item) => item.id === "has_mascot")!;
  }

  // Colors
  if (q.includes("màu đỏ") || q.includes("màu cam") || q.includes("red")) {
    return QUESTIONS.find((item) => item.id === "color_red_orange")!;
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

  // Timeline
  if (q.includes("2017") || q.includes("mới") || q.includes("gần đây") || q.includes("hiện đại")) {
    return QUESTIONS.find((item) => item.id === "era_modern")!;
  }
  if (q.includes("cũ") || q.includes("xưa") || q.includes("trước 2008") || q.includes("thời kỳ đầu")) {
    return QUESTIONS.find((item) => item.id === "era_pioneer")!;
  }
  if (q.includes("2008") || q.includes("2010") || q.includes("2016") || q.includes("tăng trưởng")) {
    return QUESTIONS.find((item) => item.id === "era_growth")!;
  }

  // Letter G
  if (q.includes("chữ g") || q.includes("chữ cái g")) {
    return QUESTIONS.find((item) => item.id === "has_letter_g")!;
  }

  // Specific
  if (q.includes("bản đồ") || q.includes("maps") || q.includes("định vị") || q.includes("chỉ đường")) {
    return QUESTIONS.find((item) => item.id === "is_geospatial")!;
  }
  if (q.includes("video") || q.includes("xem phim") || q.includes("họp") || q.includes("meeting")) {
    return QUESTIONS.find((item) => item.id === "is_media_stream")!;
  }
  if (q.includes("soạn thảo") || q.includes("văn bản") || q.includes("docs")) {
    return QUESTIONS.find((item) => item.id === "is_editor_text")!;
  }

  return null;
}

export function calculateScore(questionsCount: number, strikes: number, isBoss: boolean): number {
  const base = isBoss ? 1500 : 1000;
  const questionPenalty = questionsCount * 50;
  const strikePenalty = strikes * 180;
  return Math.max(150, base - questionPenalty - strikePenalty);
}
