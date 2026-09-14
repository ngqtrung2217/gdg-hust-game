import crypto from "crypto";

const ANTI_CHEAT_SECRET =
  process.env.ANTI_CHEAT_SECRET ||
  process.env.DATABASE_URL ||
  "gdg-hust-arcade-anti-cheat-secret-2026";

// Single-use token tracking (anti-replay attack)
const redeemedTokens = new Map<string, number>();
const activeSessions = new Map<string, { code: string; gameSlug: string; startTime: number }>();

// Clean up expired session records every 15 minutes
setInterval(() => {
  const now = Date.now();
  const twoHoursAgo = now - 2 * 60 * 60 * 1000;
  for (const [id, time] of redeemedTokens.entries()) {
    if (time < twoHoursAgo) redeemedTokens.delete(id);
  }
  for (const [id, data] of activeSessions.entries()) {
    if (data.startTime < twoHoursAgo) activeSessions.delete(id);
  }
}, 15 * 60 * 1000);

export const GAME_BOUNDS: Record<
  string,
  {
    maxScore: number;
    minScore: number;
    isLowerBetter?: boolean;
    minDurationSec: number;
    maxPointsPerSec?: number;
  }
> = {
  minesweeper: {
    maxScore: 4500,
    minScore: 100,
    isLowerBetter: false,
    minDurationSec: 4,
  },
  wordle: {
    maxScore: 3000,
    minScore: 100,
    minDurationSec: 3,
  },
  "sequence-memory": {
    maxScore: 6000,
    minScore: 100,
    minDurationSec: 4,
  },
  "dino-run": {
    maxScore: 25000,
    minScore: 1,
    minDurationSec: 5,
    maxPointsPerSec: 28, // Max physics speed + combo multiplier
  },
  othello: {
    maxScore: 3500,
    minScore: 100,
    minDurationSec: 5,
  },
  "guess-who": {
    maxScore: 1000,
    minScore: 100,
    minDurationSec: 3,
  },
  tetris: {
    maxScore: 500000,
    minScore: 10,
    minDurationSec: 6,
    maxPointsPerSec: 450,
  },
  "math-blaster": {
    maxScore: 8000,
    minScore: 10,
    minDurationSec: 5,
    maxPointsPerSec: 180,
  },
  "stroop-test": {
    maxScore: 3000,
    minScore: 10,
    minDurationSec: 5,
  },
};

function signPayload(payload: string): string {
  return crypto.createHmac("sha256", ANTI_CHEAT_SECRET).update(payload).digest("hex").slice(0, 32);
}

/**
 * Generate a cryptographically signed Game Session Token
 */
export function createGameSessionToken(code: string, gameSlug: string): {
  sessionToken: string;
  startTime: number;
} {
  const sessionId = crypto.randomBytes(12).toString("hex");
  const startTime = Date.now();
  const signature = signPayload(`${sessionId}:${code}:${gameSlug}:${startTime}`);
  const sessionToken = `${sessionId}.${startTime}.${signature}`;

  activeSessions.set(sessionId, { code, gameSlug, startTime });

  return { sessionToken, startTime };
}

/**
 * Verify Game Session Token, Anti-Replay, and Physics/Time limits
 */
export function verifyGameSessionAndScore(
  code: string,
  gameSlug: string,
  score: number,
  sessionToken?: string
): {
  valid: boolean;
  reason?: string;
  sanitizedScore: number;
} {
  const bounds = GAME_BOUNDS[gameSlug];
  if (!bounds) {
    return { valid: false, reason: "Trò chơi không hợp lệ trong hệ thống", sanitizedScore: 0 };
  }

  const numericScore = Math.floor(Number(score));
  if (!Number.isFinite(numericScore)) {
    return { valid: false, reason: "Điểm số không phải là số hợp lệ", sanitizedScore: 0 };
  }

  // 1. Basic Bounds Check
  if (numericScore < bounds.minScore || numericScore > bounds.maxScore) {
    return {
      valid: false,
      reason: `Điểm số (${numericScore}) vượt quá ngưỡng cho phép (${bounds.minScore} - ${bounds.maxScore})`,
      sanitizedScore: 0,
    };
  }

  // 2. Token Cryptographic Verification
  if (!sessionToken || typeof sessionToken !== "string") {
    return {
      valid: false,
      reason: "Thiếu mã xác thực phiên chơi (Game Session Token required). Hãy chơi trực tiếp từ giao diện!",
      sanitizedScore: 0,
    };
  }

  const parts = sessionToken.split(".");
  if (parts.length !== 3) {
    return { valid: false, reason: "Cấu trúc token phiên chơi bị sai lệch", sanitizedScore: 0 };
  }

  const [sessionId, rawStartTime, signature] = parts;
  const startTime = Number(rawStartTime);

  if (!startTime || !Number.isFinite(startTime)) {
    return { valid: false, reason: "Thời gian phiên chơi không hợp lệ", sanitizedScore: 0 };
  }

  // Verify HMAC signature
  const expectedSig = signPayload(`${sessionId}:${code}:${gameSlug}:${startTime}`);
  if (signature !== expectedSig) {
    return {
      valid: false,
      reason: "Chữ ký phiên chơi không hợp lệ (Phát hiện can thiệp dữ liệu)",
      sanitizedScore: 0,
    };
  }

  // 3. Anti-Replay Check (Token already used)
  if (redeemedTokens.has(sessionId)) {
    return {
      valid: false,
      reason: "Phiên chơi này đã được ghi nhận trước đó. Không thể gửi lại nhiều lần!",
      sanitizedScore: 0,
    };
  }

  const now = Date.now();
  const elapsedSec = (now - startTime) / 1000;

  // 4. Time Sanity Check
  if (elapsedSec < bounds.minDurationSec) {
    return {
      valid: false,
      reason: `Thời gian chơi quá ngắn (${elapsedSec.toFixed(1)}s < tối thiểu ${bounds.minDurationSec}s). Nghi vấn gian lận tốc độ!`,
      sanitizedScore: 0,
    };
  }

  // Max session lifetime (prevent using a session started days ago)
  if (elapsedSec > 4 * 60 * 60) {
    return {
      valid: false,
      reason: "Phiên chơi đã hết hạn sau 4 tiếng. Vui lòng bắt đầu ván mới!",
      sanitizedScore: 0,
    };
  }

  // 5. Game-Specific Physics & Rate of Scoring Checks
  if (gameSlug === "dino-run" && bounds.maxPointsPerSec) {
    const maxPossible = Math.floor(elapsedSec * bounds.maxPointsPerSec + 40);
    if (numericScore > maxPossible) {
      return {
        valid: false,
        reason: `Điểm số (${numericScore}) tăng nhanh bất thường so với thời lượng chạy (${elapsedSec.toFixed(0)}s). Tối đa: ${maxPossible}đ!`,
        sanitizedScore: 0,
      };
    }
  }

  if (gameSlug === "sequence-memory") {
    // Score is approx level * 120
    const approxLevel = Math.max(1, Math.round(numericScore / 120));
    const minRequiredTime = (approxLevel * (approxLevel + 1)) * 0.35;
    if (elapsedSec < minRequiredTime) {
      return {
        valid: false,
        reason: `Cấp độ ${approxLevel} (${numericScore}đ) đòi hỏi tối thiểu ${minRequiredTime.toFixed(0)} giây (Thực tế chỉ ${elapsedSec.toFixed(1)}s)!`,
        sanitizedScore: 0,
      };
    }
  }

  if (gameSlug === "math-blaster" && bounds.maxPointsPerSec) {
    const maxPossible = Math.floor(elapsedSec * bounds.maxPointsPerSec);
    if (numericScore > maxPossible) {
      return {
        valid: false,
        reason: `Tốc độ giải toán vượt quá phản xạ tự nhiên của con người (${numericScore}đ / ${elapsedSec.toFixed(0)}s)!`,
        sanitizedScore: 0,
      };
    }
  }

  // Mark token as redeemed so it can NEVER be reused
  redeemedTokens.set(sessionId, now);
  activeSessions.delete(sessionId);

  return {
    valid: true,
    sanitizedScore: numericScore,
  };
}
