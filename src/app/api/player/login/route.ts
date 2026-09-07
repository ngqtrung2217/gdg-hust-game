import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { checkRateLimit, getClientIp, resetRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const limitCheck = checkRateLimit(`login:${ip}`, 8, 5 * 60 * 1000);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Bạn đã thử đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ${limitCheck.retryAfterSeconds} giây.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const rawCode = typeof body.code === "string" ? body.code.trim() : "";
    if (!rawCode || rawCode.length !== 6 || !/^\d{6}$/.test(rawCode)) {
      return NextResponse.json(
        { success: false, error: "Mã tài khoản phải là 6 chữ số (VD: 839102)" },
        { status: 400 }
      );
    }

    // Lookup player
    const players = await query<{
      id: string;
      name: string;
      code: string;
      created_at: string;
    }>("SELECT id, name, code, created_at FROM players WHERE code = $1 LIMIT 1", [rawCode]);

    if (players.length === 0) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy tài khoản với mã 6 số này!" },
        { status: 404 }
      );
    }

    // Reset rate limit on success
    resetRateLimit(`login:${ip}`);

    const player = players[0];

    // Fetch existing scores
    const existingScores = await query<{ game_slug: string; score: number }>(
      "SELECT game_slug, score FROM scores WHERE player_id = $1",
      [player.id]
    );

    const scoreMap: Record<string, number> = {};
    for (const row of existingScores) {
      scoreMap[row.game_slug] = row.score;
    }

    // Merge with local scores if sent
    if (body.localScores && typeof body.localScores === "object") {
      for (const [slug, rawVal] of Object.entries(body.localScores)) {
        const localScore = Number(rawVal);
        if (!Number.isFinite(localScore) || localScore <= 0) continue;

        const dbScore = scoreMap[slug];
        let shouldUpdate = false;

        if (dbScore === undefined || dbScore === 0) {
          shouldUpdate = true;
        } else if (slug === "minesweeper") {
          // For minesweeper lower is better
          if (localScore < dbScore) shouldUpdate = true;
        } else {
          // For other games higher is better
          if (localScore > dbScore) shouldUpdate = true;
        }

        if (shouldUpdate) {
          await query(
            `INSERT INTO scores (player_id, game_slug, score, updated_at)
             VALUES ($1, $2, $3, NOW())
             ON CONFLICT (player_id, game_slug) DO UPDATE
             SET score = EXCLUDED.score, updated_at = NOW()`,
            [player.id, slug, localScore]
          );
          scoreMap[slug] = localScore;
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
      scores: scoreMap,
    });
  } catch (error: unknown) {
    console.error("Error in player login:", error);
    const message = error instanceof Error ? error.message : "Lỗi máy chủ khi đăng nhập";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
