import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

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

function generate6DigitCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const limitCheck = checkRateLimit(`register:${ip}`, 10, 10 * 60 * 1000);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Bạn đã tạo quá nhiều tài khoản từ thiết bị này. Vui lòng thử lại sau ${limitCheck.retryAfterSeconds} giây!`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    let rawName = typeof body.name === "string" ? body.name.trim() : "";
    // Sanitize name: remove HTML/script tags, limit length
    rawName = rawName.replace(/<[^>]*>?/gm, "").trim();
    if (!rawName) rawName = "GDG Gamer";
    const name = rawName.slice(0, 25);

    // Generate unique 6-digit code with collision protection
    let code = generate6DigitCode();
    let unique = false;
    for (let i = 0; i < 5; i++) {
      const existing = await query<{ id: string }>(
        "SELECT id FROM players WHERE code = $1 LIMIT 1",
        [code]
      );
      if (existing.length === 0) {
        unique = true;
        break;
      }
      code = generate6DigitCode();
    }

    if (!unique) {
      return NextResponse.json(
        { success: false, error: "Hệ thống đang bận, vui lòng thử lại!" },
        { status: 500 }
      );
    }

    // Insert new player
    const rows = await query<{ id: string; name: string; code: string; created_at: string }>(
      "INSERT INTO players (name, code) VALUES ($1, $2) RETURNING id, name, code, created_at",
      [name, code]
    );

    const player = rows[0];

    // If local scores provided, import them with bounds check
    const syncedScores: Record<string, number> = {};
    if (body.localScores && typeof body.localScores === "object") {
      for (const [slug, val] of Object.entries(body.localScores)) {
        const num = Math.floor(Number(val));
        const maxScore = MAX_SCORES[slug] || 1000000;
        if (Number.isFinite(num) && num > 0 && num <= maxScore) {
          try {
            await query(
              `INSERT INTO scores (player_id, game_slug, score, updated_at)
               VALUES ($1, $2, $3, NOW())
               ON CONFLICT (player_id, game_slug) DO UPDATE
               SET score = EXCLUDED.score, updated_at = NOW()`,
              [player.id, slug, num]
            );
            syncedScores[slug] = num;
          } catch {
            // Ignore single score failure
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      player: {
        id: player.id,
        name: player.name,
        code: player.code,
        createdAt: player.created_at,
      },
      scores: syncedScores,
    });
  } catch (error: unknown) {
    console.error("Error in player register:", error);
    const message = error instanceof Error ? error.message : "Lỗi máy chủ khi tạo tài khoản";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
