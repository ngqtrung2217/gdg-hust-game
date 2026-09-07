import { NextResponse } from "next/server";
import { query } from "@/lib/db";

const MAX_SCORES: Record<string, number> = {
  minesweeper: 9999,
  wordle: 5000,
  "sequence-memory": 100,
  "dino-run": 100000,
  othello: 10000,
  "guess-who": 2000,
  tetris: 5000000,
  "math-blaster": 20000,
  "stroop-test": 10000,
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, gameSlug, score } = body;

    const numericScore = Math.floor(Number(score));
    if (
      !code ||
      typeof code !== "string" ||
      !gameSlug ||
      typeof gameSlug !== "string" ||
      !Number.isFinite(numericScore)
    ) {
      return NextResponse.json(
        { success: false, error: "Dữ liệu không hợp lệ" },
        { status: 400 }
      );
    }

    const maxAllowed = MAX_SCORES[gameSlug];
    if (!maxAllowed) {
      return NextResponse.json(
        { success: false, error: "Trò chơi không hợp lệ" },
        { status: 400 }
      );
    }

    if (numericScore <= 0 || numericScore > maxAllowed) {
      return NextResponse.json(
        { success: false, error: `Điểm không hợp lệ (giới hạn tối đa: ${maxAllowed})` },
        { status: 400 }
      );
    }

    // Verify player
    const players = await query<{ id: string }>(
      "SELECT id FROM players WHERE code = $1 LIMIT 1",
      [code.trim()]
    );

    if (players.length === 0) {
      return NextResponse.json(
        { success: false, error: "Mã tài khoản không tồn tại" },
        { status: 404 }
      );
    }

    const playerId = players[0].id;

    // Check current score
    const existing = await query<{ score: number }>(
      "SELECT score FROM scores WHERE player_id = $1 AND game_slug = $2",
      [playerId, gameSlug]
    );

    let shouldUpdate = false;
    let bestScore = numericScore;

    if (existing.length === 0) {
      shouldUpdate = true;
    } else {
      const current = existing[0].score;
      if (gameSlug === "minesweeper") {
        if (current === 0 || numericScore < current) {
          shouldUpdate = true;
        } else {
          bestScore = current;
        }
      } else {
        if (numericScore > current) {
          shouldUpdate = true;
        } else {
          bestScore = current;
        }
      }
    }

    if (shouldUpdate) {
      await query(
        `INSERT INTO scores (player_id, game_slug, score, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (player_id, game_slug) DO UPDATE
         SET score = EXCLUDED.score, updated_at = NOW()`,
        [playerId, gameSlug, numericScore]
      );
    }

    return NextResponse.json({
      success: true,
      bestScore,
      updated: shouldUpdate,
    });
  } catch (error: unknown) {
    console.error("Error updating score:", error);
    const message = error instanceof Error ? error.message : "Lỗi cập nhật điểm";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
