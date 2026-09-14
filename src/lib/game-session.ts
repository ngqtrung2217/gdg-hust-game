"use client";

import { getActivePlayer } from "./player";
import { SCORE_KEYS } from "./player";

// In-memory session token store per game
const sessionTokens = new Map<string, string>();

/**
 * Start or refresh a verified game session with the server
 */
export async function initGameSession(gameSlug: string): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const player = getActivePlayer();
  if (!player?.code) {
    return null;
  }

  try {
    const res = await fetch("/api/game/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: player.code,
        gameSlug,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.warn("[Game Session Failed]:", errData.error || res.statusText);
      return null;
    }

    const data = await res.json();
    if (data.success && data.sessionToken) {
      sessionTokens.set(gameSlug, data.sessionToken);
      return data.sessionToken;
    }
  } catch (err) {
    console.error("[Session Init Network Error]:", err);
  }

  return null;
}

/**
 * Submit verified game score directly to Database
 */
export async function submitScoreToDatabase(
  gameSlug: string,
  score: number
): Promise<{
  success: boolean;
  isNewBest?: boolean;
  bestScore?: number;
  error?: string;
}> {
  if (typeof window === "undefined" || score <= 0) {
    return { success: false, error: "Điểm không hợp lệ" };
  }

  const player = getActivePlayer();
  if (!player?.code) {
    // Prompt auth modal if player has no team code
    window.dispatchEvent(new CustomEvent("gdg-open-auth-modal"));
    return {
      success: false,
      error: "Bạn cần đăng ký hoặc đăng nhập Đội để lưu điểm vào Bảng xếp hạng Database!",
    };
  }

  let token = sessionTokens.get(gameSlug);

  // If no session token was created (e.g. offline start), attempt immediate creation
  if (!token) {
    token = (await initGameSession(gameSlug)) || undefined;
  }

  try {
    const res = await fetch("/api/player/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: player.code,
        gameSlug,
        score,
        sessionToken: token,
      }),
    });

    const data = await res.json();

    // Consume the token (single use)
    sessionTokens.delete(gameSlug);
    // Automatically prepare next session token in background for subsequent rounds
    setTimeout(() => {
      initGameSession(gameSlug).catch(() => {});
    }, 500);

    if (res.ok && data.success) {
      const key = SCORE_KEYS[gameSlug];
      if (key && data.bestScore) {
        localStorage.setItem(key, String(data.bestScore));
      }

      window.dispatchEvent(
        new CustomEvent("gdg-score-updated", {
          detail: {
            gameSlug,
            score,
            isNewBest: data.isNewBest,
            bestScore: data.bestScore,
          },
        })
      );

      return {
        success: true,
        isNewBest: data.isNewBest,
        bestScore: data.bestScore,
      };
    } else {
      return {
        success: false,
        error: data.error || "Không thể lưu điểm vào Database",
      };
    }
  } catch (err) {
    console.error("[Submit Score Network Error]:", err);
    return {
      success: false,
      error: "Lỗi kết nối máy chủ. Vui lòng kiểm tra lại mạng!",
    };
  }
}
