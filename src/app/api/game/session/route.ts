import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { createGameSessionToken, GAME_BOUNDS } from "@/lib/anti-cheat";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const body = await req.json();
    const { code, gameSlug } = body;

    if (!code || typeof code !== "string" || !gameSlug || typeof gameSlug !== "string") {
      return NextResponse.json(
        { success: false, error: "Thiếu thông tin mã đội hoặc trò chơi" },
        { status: 400 }
      );
    }

    const cleanCode = code.trim();
    if (!GAME_BOUNDS[gameSlug]) {
      return NextResponse.json(
        { success: false, error: "Trò chơi không hợp lệ" },
        { status: 400 }
      );
    }

    // Rate limit session starts: max 15 starts per 60s per IP
    const rateCheck = checkRateLimit(`session:${ip}`, 15, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: "Khởi tạo phiên chơi quá nhanh. Vui lòng thử lại sau vài giây!" },
        { status: 429 }
      );
    }

    // Verify player existence in Database
    const players = await query<{ id: string; name: string }>(
      "SELECT id, name FROM players WHERE code = $1 LIMIT 1",
      [cleanCode]
    );

    if (players.length === 0) {
      return NextResponse.json(
        { success: false, error: "Mã đội không tồn tại! Vui lòng đăng ký đội trước khi chơi." },
        { status: 404 }
      );
    }

    const session = createGameSessionToken(cleanCode, gameSlug);

    return NextResponse.json({
      success: true,
      sessionToken: session.sessionToken,
      startTime: session.startTime,
      playerName: players[0].name,
    });
  } catch (error) {
    console.error("[Session Init Error]:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi máy chủ khi khởi tạo phiên chơi" },
      { status: 500 }
    );
  }
}
