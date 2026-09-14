import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyGameSessionAndScore, GAME_BOUNDS } from "@/lib/anti-cheat";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const body = await req.json();
    const { code, gameSlug, score, sessionToken } = body;

    const rawCode = typeof code === "string" ? code.trim() : "";
    const rawSlug = typeof gameSlug === "string" ? gameSlug.trim() : "";
    const numericScore = Math.floor(Number(score));

    if (!rawCode || !rawSlug || !Number.isFinite(numericScore)) {
      return NextResponse.json(
        { success: false, error: "Dữ liệu gửi lên không hợp lệ" },
        { status: 400 }
      );
    }

    // Anti-Spam Rate Limit per Player Code & IP (max 1 submission per 4s)
    const rateCheck = checkRateLimit(`score:${rawCode}:${ip}`, 1, 3500);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Gửi điểm quá nhanh. Vui lòng đợi ${rateCheck.retryAfterSeconds} giây!`,
        },
        { status: 429 }
      );
    }

    // 1. Anti-Cheat Engine Verification (HMAC signature, replay attack, rate of scoring, time sanity)
    const verification = verifyGameSessionAndScore(rawCode, rawSlug, numericScore, sessionToken);
    if (!verification.valid) {
      console.warn(
        `[ANTI-CHEAT ALERT] Rejected score from ${rawCode} in ${rawSlug} (${numericScore}đ): ${verification.reason}`
      );
      return NextResponse.json(
        {
          success: false,
          error: verification.reason || "Phát hiện dấu hiệu gian lận. Điểm không được ghi nhận!",
          antiCheatTriggered: true,
        },
        { status: 403 }
      );
    }

    const validatedScore = verification.sanitizedScore;

    // 2. Verify Player Account in Supabase Database
    const players = await query<{ id: string; name: string }>(
      "SELECT id, name FROM players WHERE code = $1 LIMIT 1",
      [rawCode]
    );

    if (players.length === 0) {
      return NextResponse.json(
        { success: false, error: "Mã đội thi đấu không tồn tại trên hệ thống!" },
        { status: 404 }
      );
    }

    const playerId = players[0].id;
    const isLowerBetter = GAME_BOUNDS[rawSlug]?.isLowerBetter ?? false;

    // 3. Query current high score from Database
    const existing = await query<{ score: number }>(
      "SELECT score FROM scores WHERE player_id = $1 AND game_slug = $2 LIMIT 1",
      [playerId, rawSlug]
    );

    let shouldUpdate = false;
    let bestScore = validatedScore;
    let previousBest = 0;

    if (existing.length === 0) {
      shouldUpdate = true;
    } else {
      previousBest = existing[0].score;
      if (isLowerBetter) {
        // Lower is better (e.g. Minesweeper completion time)
        if (previousBest === 0 || validatedScore < previousBest) {
          shouldUpdate = true;
          bestScore = validatedScore;
        } else {
          bestScore = previousBest;
        }
      } else {
        // Higher is better (e.g. Dino, Tetris, Math Blaster...)
        if (validatedScore > previousBest) {
          shouldUpdate = true;
          bestScore = validatedScore;
        } else {
          bestScore = previousBest;
        }
      }
    }

    // 4. Update Database if new record
    if (shouldUpdate) {
      await query(
        `INSERT INTO scores (player_id, game_slug, score, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (player_id, game_slug) DO UPDATE
         SET score = EXCLUDED.score, updated_at = NOW()`,
        [playerId, rawSlug, validatedScore]
      );
    }

    return NextResponse.json({
      success: true,
      gameSlug: rawSlug,
      score: validatedScore,
      bestScore,
      previousBest,
      isNewBest: shouldUpdate,
      teamName: players[0].name,
    });
  } catch (error) {
    console.error("[Submit Score DB Error]:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi kết nối cơ sở dữ liệu khi lưu điểm" },
      { status: 500 }
    );
  }
}
