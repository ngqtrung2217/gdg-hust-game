import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const game = searchParams.get("game");
    const myCode = (searchParams.get("myCode") || "").trim();

    if (game && game !== "overall") {
      const isMinesweeper = game === "minesweeper";
      const orderDir = isMinesweeper ? "ASC" : "DESC";

      const rows = await query<{
        name: string;
        code: string;
        score: number;
        updated_at: string;
      }>(
        `SELECT 
           p.name,
           p.code,
           s.score,
           s.updated_at
         FROM scores s
         JOIN players p ON s.player_id = p.id
         WHERE s.game_slug = $1 AND s.score > 0
         ORDER BY s.score ${orderDir}, s.updated_at ASC
         LIMIT 100`,
        [game]
      );

      const items = rows.map((r, idx) => ({
        rank: idx + 1,
        name: r.name,
        // Mask code for privacy & security: e.g. "839102" -> "#***102"
        maskedCode: `#***${r.code.slice(-3)}`,
        isMe: myCode.length === 6 && myCode === r.code,
        score: r.score,
        updatedAt: r.updated_at,
      }));

      return NextResponse.json({
        success: true,
        type: "game",
        game,
        leaderboard: items,
      });
    }

    // Overall leaderboard
    const rows = await query<{
      name: string;
      code: string;
      total_score: number;
      games_played: number;
      last_active: string | null;
      created_at: string;
    }>(
      `SELECT 
         p.name,
         p.code,
         COALESCE(SUM(s.score), 0)::int AS total_score,
         COUNT(s.id)::int AS games_played,
         MAX(s.updated_at) AS last_active,
         p.created_at
       FROM players p
       LEFT JOIN scores s ON p.id = s.player_id
       GROUP BY p.name, p.code, p.created_at
       ORDER BY total_score DESC, games_played DESC, p.created_at ASC
       LIMIT 100`
    );

    const items = rows.map((r, idx) => ({
      rank: idx + 1,
      name: r.name,
      maskedCode: `#***${r.code.slice(-3)}`,
      isMe: myCode.length === 6 && myCode === r.code,
      totalScore: r.total_score,
      gamesPlayed: r.games_played,
      lastActive: r.last_active || r.created_at,
    }));

    return NextResponse.json({
      success: true,
      type: "overall",
      leaderboard: items,
    });
  } catch (error: unknown) {
    console.error("Error fetching leaderboard:", error);
    const message = error instanceof Error ? error.message : "Lỗi tải bảng xếp hạng";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
