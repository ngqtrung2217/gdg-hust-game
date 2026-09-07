"use client";

export interface PlayerProfile {
  id?: string;
  name: string;
  code: string;
  createdAt?: string;
}

const PLAYER_STORAGE_KEY = "gdg-player-profile";
const PLAYER_NAME_LEGACY_KEY = "gdg-player-name";

export const SCORE_KEYS: Record<string, string> = {
  minesweeper: "minesweeper-best",
  wordle: "wordle-best",
  "sequence-memory": "sequence-memory-best",
  "dino-run": "dino-run-best",
  othello: "othello-best",
  "guess-who": "guess-who-best",
  tetris: "tetris-best",
  "math-blaster": "math-blaster-best",
  "stroop-test": "stroop-test-best",
};

/**
 * Get active player from localStorage
 */
export function getActivePlayer(): PlayerProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PLAYER_STORAGE_KEY);
    if (!raw) {
      // Check legacy player name
      const legacyName = localStorage.getItem(PLAYER_NAME_LEGACY_KEY);
      if (legacyName && legacyName !== "GDG Gamer") {
        return { name: legacyName, code: "" };
      }
      return null;
    }
    return JSON.parse(raw) as PlayerProfile;
  } catch {
    return null;
  }
}

/**
 * Save active player to localStorage and dispatch event
 */
export function setActivePlayer(player: PlayerProfile | null): void {
  if (typeof window === "undefined") return;
  if (!player) {
    localStorage.removeItem(PLAYER_STORAGE_KEY);
  } else {
    localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(player));
    localStorage.setItem(PLAYER_NAME_LEGACY_KEY, player.name);
  }
  window.dispatchEvent(new CustomEvent("gdg-player-changed", { detail: player }));
}

/**
 * Get all local best scores for all 9 games
 */
export function getAllLocalScores(): Record<string, number> {
  if (typeof window === "undefined") return {};
  const result: Record<string, number> = {};
  for (const [slug, key] of Object.entries(SCORE_KEYS)) {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      const num = Number(raw);
      if (Number.isFinite(num) && num > 0) {
        result[slug] = num;
      }
    }
  }
  return result;
}

/**
 * Save local score to localStorage
 */
export function setLocalScore(slug: string, score: number): void {
  if (typeof window === "undefined") return;
  const key = SCORE_KEYS[slug];
  if (!key) return;
  localStorage.setItem(key, String(score));
}

/**
 * Record a game score:
 * 1. Checks if it is a new high score locally
 * 2. Saves to localStorage
 * 3. If player is logged in with code, syncs asynchronously to Supabase
 */
export function recordGameScore(gameSlug: string, score: number): {
  isNewBest: boolean;
  bestScore: number;
} {
  if (typeof window === "undefined") {
    return { isNewBest: false, bestScore: score };
  }

  const key = SCORE_KEYS[gameSlug];
  if (!key || score <= 0) {
    return { isNewBest: false, bestScore: 0 };
  }

  const raw = localStorage.getItem(key);
  const currentBest = raw !== null ? Number(raw) : 0;

  let isNewBest = false;
  let finalBest = currentBest;

  if (gameSlug === "minesweeper") {
    // Minesweeper: lower is better
    if (currentBest === 0 || score < currentBest) {
      isNewBest = true;
      finalBest = score;
      localStorage.setItem(key, String(score));
    }
  } else {
    // Other games: higher is better
    if (score > currentBest) {
      isNewBest = true;
      finalBest = score;
      localStorage.setItem(key, String(score));
    }
  }

  // Dispatch score event for reactive components
  window.dispatchEvent(
    new CustomEvent("gdg-score-updated", {
      detail: { gameSlug, score, isNewBest, bestScore: finalBest },
    })
  );

  // If active player has a code, sync to Supabase in background
  const player = getActivePlayer();
  if (player?.code) {
    fetch("/api/player/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: player.code,
        gameSlug,
        score: finalBest,
      }),
    }).catch((err) => console.warn("Background score sync failed:", err));
  }

  return { isNewBest, bestScore: finalBest };
}

/**
 * Register new player account
 */
export async function registerPlayerAccount(name: string): Promise<{
  success: boolean;
  player?: PlayerProfile;
  error?: string;
}> {
  try {
    const localScores = getAllLocalScores();
    const res = await fetch("/api/player/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, localScores }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "Không thể tạo tài khoản" };
    }

    const player: PlayerProfile = {
      id: data.player.id,
      name: data.player.name,
      code: data.player.code,
      createdAt: data.player.createdAt,
    };

    // Save locally
    setActivePlayer(player);

    // Update local storage with any returned scores
    if (data.scores) {
      for (const [slug, val] of Object.entries(data.scores)) {
        setLocalScore(slug, Number(val));
      }
    }

    return { success: true, player };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi kết nối máy chủ";
    return { success: false, error: message };
  }
}

/**
 * Login with 6-digit code
 */
export async function loginWithCode(code: string): Promise<{
  success: boolean;
  player?: PlayerProfile;
  error?: string;
}> {
  try {
    const localScores = getAllLocalScores();
    const res = await fetch("/api/player/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim(), localScores }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "Mã 6 số không hợp lệ" };
    }

    const player: PlayerProfile = {
      id: data.player.id,
      name: data.player.name,
      code: data.player.code,
      createdAt: data.player.createdAt,
    };

    setActivePlayer(player);

    // Update local scores with synced data from cloud
    if (data.scores) {
      for (const [slug, val] of Object.entries(data.scores)) {
        setLocalScore(slug, Number(val));
      }
    }

    return { success: true, player };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi kết nối máy chủ";
    return { success: false, error: message };
  }
}

/**
 * Log out
 */
export function logoutPlayer(): void {
  setActivePlayer(null);
}
