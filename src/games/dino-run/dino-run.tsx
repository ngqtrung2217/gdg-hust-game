"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, RotateCcw } from "lucide-react";

const W = 800;
const H = 300;
const GROUND_Y = 250;
const GRAVITY = 0.6;
const JUMP_V = -13;
const MAX_SPEED = 7;
const BASE_SPEED = 3;

// Sprite gốc Chromium (grayscale, 1233x68)
const SPRITE = "/games/dino/sprite.png";
const TREX_X = 848;
const TREX_W = 44;
const TREX_H = 47;
const CACTUS_SMALL = { x: 228, w: 17, h: 35 };
const CACTUS_LARGE = { x: 332, w: 25, h: 50 };
const PTERO = { x: 134, w: 46, h: 40 };
const CLOUD = { x: 86, w: 46, h: 14 };
const HORIZON = { x: 2, y: 54, w: 600, h: 12 };

type Phase = "idle" | "playing" | "gameover";
type PowerType = "magnet" | "shield" | "speed";
type ObstacleType = "cactus" | "bird" | "block";

interface Obstacle {
  type: ObstacleType;
  x: number;
  y: number;
  w: number;
  h: number;
  passed: boolean;
}
interface PowerUp {
  type: PowerType;
  x: number;
  y: number;
  r: number;
}
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export function DinoRun() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [shield, setShield] = useState(false);
  const [magnet, setMagnet] = useState(false);
  const [speedBoost, setSpeedBoost] = useState(false);
  const [combo, setCombo] = useState(0);

  const g = useRef({
    phase: "idle" as Phase,
    dino: { x: 60, y: GROUND_Y, vy: 0, w: 44, h: 47, duck: false, frame: 0 },
    obstacles: [] as Obstacle[],
    powerups: [] as PowerUp[],
    particles: [] as Particle[],
    speed: BASE_SPEED,
    score: 0,
    spawnTimer: 0,
    powerTimer: 0,
    shield: false,
    magnet: false,
    speedBoost: false,
    combo: 0,
    comboCount: 0,
    night: false,
    groundOffset: 0,
    hillOffset: 0,
    cloudOffset: 0,
    raf: 0,
    lastTime: 0,
    running: false,
  });

  useEffect(() => {
    const img = new Image();
    img.src = SPRITE;
    img.onload = () => {
      imgRef.current = img;
      draw();
    };
    const stored = Number(localStorage.getItem("dino-run-best") ?? 0);
    setBest(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncUI = useCallback(() => {
    setScore(Math.floor(g.current.score));
    setShield(g.current.shield);
    setMagnet(g.current.magnet);
    setSpeedBoost(g.current.speedBoost);
    setCombo(g.current.combo);
  }, []);

  const drawDino = (ctx: CanvasRenderingContext2D) => {
    const img = imgRef.current;
    const d = g.current.dino;
    if (!img) return;
    let sx: number;
    if (g.current.phase === "gameover") sx = 220;
    else if (d.duck) sx = 176;
    else if (d.vy < 0) sx = 0;
    else sx = d.frame % 2 === 0 ? 88 : 132;
    ctx.drawImage(img, TREX_X + sx, 2, TREX_W, TREX_H, d.x, d.y - TREX_H, TREX_W, TREX_H);
    if (g.current.shield) {
      ctx.strokeStyle = "#4285f4";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(d.x + TREX_W / 2, d.y - TREX_H / 2, 36, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  const drawObstacle = (ctx: CanvasRenderingContext2D, o: Obstacle) => {
    const img = imgRef.current;
    if (!img) return;
    if (o.type === "cactus") {
      const s = Math.random() < 0.5 ? CACTUS_SMALL : CACTUS_LARGE;
      ctx.drawImage(img, s.x, 2, s.w, s.h, o.x, o.y, o.w, o.h);
    } else if (o.type === "bird") {
      const frame = Math.floor(g.current.dino.frame / 6) % 2;
      ctx.drawImage(img, PTERO.x + frame * PTERO.w, 2, PTERO.w, PTERO.h, o.x, o.y, o.w, o.h);
    } else {
      ctx.fillStyle = g.current.night ? "#8ab4f8" : "#4285f4";
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }
  };

  const drawPower = (ctx: CanvasRenderingContext2D, p: PowerUp) => {
    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.type === "magnet") {
      ctx.strokeStyle = "#ea4335";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 8, Math.PI, 0);
      ctx.stroke();
      ctx.fillStyle = "#ea4335";
      ctx.fillRect(-8, -2, 16, 6);
    } else if (p.type === "shield") {
      ctx.strokeStyle = "#4285f4";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#fbbc04";
      ctx.beginPath();
      ctx.moveTo(4, -12);
      ctx.lineTo(-6, 2);
      ctx.lineTo(0, 2);
      ctx.lineTo(-4, 12);
      ctx.lineTo(6, -2);
      ctx.lineTo(0, -2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = g.current;
    const img = imgRef.current;

    const bg = s.night ? "#202124" : "#f8f9fa";
    const ground = s.night ? "#3c4043" : "#dadce0";

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    if (img) {
      ctx.fillStyle = s.night ? "#3c4043" : "#f1f3f4";
      for (let i = 0; i < 4; i++) {
        const cx = ((i * 220 - s.cloudOffset) % (W + 200) + W + 200) % (W + 200) - 100;
        ctx.drawImage(img, CLOUD.x, 2, CLOUD.w, CLOUD.h, cx, 40 + i * 30, CLOUD.w, CLOUD.h);
      }
      ctx.fillStyle = ground;
      ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
      for (let i = 0; i < 6; i++) {
        const gx = ((i * 200 - s.groundOffset) % (W + 200) + W + 200) % (W + 200) - 100;
        ctx.drawImage(img, HORIZON.x, HORIZON.y, HORIZON.w, HORIZON.h, gx, GROUND_Y, HORIZON.w, HORIZON.h);
      }
    } else {
      ctx.fillStyle = ground;
      ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
    }

    s.powerups.forEach((p) => drawPower(ctx, p));
    s.obstacles.forEach((o) => drawObstacle(ctx, o));
    drawDino(ctx);

    s.particles.forEach((p) => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 4, 4);
      ctx.globalAlpha = 1;
    });
  };

  const spawnObstacle = () => {
    const s = g.current;
    const r = Math.random();
    if (r < 0.5) {
      const small = Math.random() < 0.5;
      const w = small ? 17 : 25;
      const h = small ? 35 : 50;
      s.obstacles.push({ type: "cactus", x: W + 20, y: GROUND_Y - h, w, h, passed: false });
    } else if (r < 0.8) {
      s.obstacles.push({ type: "bird", x: W + 20, y: GROUND_Y - 50, w: 46, h: 40, passed: false });
    } else {
      s.obstacles.push({ type: "block", x: W + 20, y: GROUND_Y - 40, w: 24, h: 24, passed: false });
    }
  };

  const spawnPower = () => {
    const s = g.current;
    const types: PowerType[] = ["magnet", "shield", "speed"];
    s.powerups.push({
      type: types[Math.floor(Math.random() * 3)],
      x: W + 20,
      y: GROUND_Y - 40,
      r: 12,
    });
  };

  const burst = (x: number, y: number, color: string) => {
    const s = g.current;
    for (let i = 0; i < 12; i++) {
      s.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 6,
        life: 1,
        color,
      });
    }
  };

  const gameOver = () => {
    const s = g.current;
    s.phase = "gameover";
    s.running = false;
    setPhase("gameover");
    if (Math.floor(s.score) > best) {
      setBest(Math.floor(s.score));
      localStorage.setItem("dino-run-best", String(Math.floor(s.score)));
    }
    burst(s.dino.x + 20, s.dino.y - 20, "#ea4335");
  };

  const update = (dt: number) => {
    const s = g.current;
    if (s.phase !== "playing") return;

    const dtScale = dt / 16.67;

    s.speed = Math.min(MAX_SPEED, BASE_SPEED + s.score / 500);
    s.dino.frame += 1;
    s.dino.vy += GRAVITY * dtScale;
    s.dino.y += s.dino.vy * dtScale;
    if (s.dino.y > GROUND_Y) {
      s.dino.y = GROUND_Y;
      s.dino.vy = 0;
    }

    s.groundOffset = (s.groundOffset + s.speed * dtScale) % 200;
    s.cloudOffset = (s.cloudOffset + s.speed * 0.2 * dtScale) % 220;

    s.spawnTimer -= dt;
    if (s.spawnTimer <= 0) {
      spawnObstacle();
      s.spawnTimer = 2000 + Math.random() * 1500;
    }
    if (Math.random() < 0.002) spawnPower();

    s.obstacles.forEach((o) => {
      o.x -= s.speed * dtScale;
      if (!o.passed && o.x + o.w < s.dino.x) {
        o.passed = true;
        s.comboCount += 1;
        s.combo = Math.min(5, Math.floor(s.comboCount / 3));
        s.score += 10 * (1 + s.combo);
      }
    });
    s.obstacles = s.obstacles.filter((o) => o.x > -50);

    s.powerups.forEach((p) => {
      p.x -= s.speed * dtScale;
      const dx = p.x - (s.dino.x + 20);
      const dy = p.y - (s.dino.y - 25);
      const dist = Math.hypot(dx, dy);
      if (s.magnet && dist < 120) {
        p.x -= dx * 0.1;
        p.y -= dy * 0.1;
      }
      if (dist < 30) {
        if (p.type === "magnet") {
          s.magnet = true;
          s.powerTimer = 5000;
        } else if (p.type === "shield") {
          s.shield = true;
          s.powerTimer = 5000;
        } else {
          s.speedBoost = true;
          s.powerTimer = 5000;
        }
        burst(p.x, p.y, "#fbbc04");
        s.powerups = s.powerups.filter((x) => x !== p);
      }
    });
    s.powerups = s.powerups.filter((p) => p.x > -50);

    if (s.powerTimer > 0) {
      s.powerTimer -= dt;
      if (s.powerTimer <= 0) {
        s.magnet = false;
        s.shield = false;
        s.speedBoost = false;
      }
    }

    const effSpeed = s.speedBoost ? s.speed * 1.5 : s.speed;
    s.score += effSpeed * dt * 0.003;

    s.night = s.score > 500;

    s.obstacles.forEach((o) => {
      const d = s.dino;
      const dinoH = d.duck ? 20 : TREX_H;
      const dinoY = d.duck ? d.y - 20 : d.y - TREX_H;
      if (
        o.x < d.x + d.w &&
        o.x + o.w > d.x &&
        o.y < dinoY + dinoH &&
        o.y + o.h > dinoY
      ) {
        if (s.shield) {
          s.shield = false;
          s.powerTimer = 0;
          burst(o.x + o.w / 2, o.y + o.h / 2, "#4285f4");
          s.obstacles = s.obstacles.filter((x) => x !== o);
        } else {
          gameOver();
        }
      }
    });

    s.particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.life -= 0.02;
    });
    s.particles = s.particles.filter((p) => p.life > 0);

    syncUI();
  };

  const loop = (time: number) => {
    const s = g.current;
    const dt = Math.min(50, time - s.lastTime);
    s.lastTime = time;
    update(dt);
    draw();
    s.raf = requestAnimationFrame(loop);
  };

  const start = () => {
    const s = g.current;
    s.phase = "playing";
    s.dino = { x: 60, y: GROUND_Y, vy: 0, w: 44, h: 47, duck: false, frame: 0 };
    s.obstacles = [];
    s.powerups = [];
    s.particles = [];
    s.speed = BASE_SPEED;
    s.score = 0;
    s.combo = 0;
    s.comboCount = 0;
    s.shield = false;
    s.magnet = false;
    s.speedBoost = false;
    s.powerTimer = 0;
    s.night = false;
    s.spawnTimer = 2500;
    setPhase("playing");
    setScore(0);
    setCombo(0);
    setShield(false);
    setMagnet(false);
    setSpeedBoost(false);
    if (!s.running) {
      s.running = true;
      s.lastTime = performance.now();
      s.raf = requestAnimationFrame(loop);
    }
  };

  const jump = () => {
    const s = g.current;
    if (s.phase === "idle") {
      start();
      return;
    }
    if (s.phase !== "playing") return;
    if (s.dino.y >= GROUND_Y) {
      s.dino.vy = JUMP_V;
      s.dino.duck = false;
    }
  };

  const duck = (down: boolean) => {
    const s = g.current;
    if (s.phase !== "playing") return;
    if (down) {
      s.dino.duck = true;
      s.dino.y = GROUND_Y;
    } else {
      s.dino.duck = false;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
      } else if (e.code === "ArrowDown") {
        e.preventDefault();
        duck(e.type === "keydown");
      }
    };
    const onTouch = (e: TouchEvent) => {
      e.preventDefault();
      jump();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    canvas.addEventListener("touchstart", onTouch, { passive: false });

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      canvas.removeEventListener("touchstart", onTouch);
      cancelAnimationFrame(g.current.raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-6">
        <div className="text-center">
          <div className="text-sm text-muted">Điểm</div>
          <div className="tabular-nums text-3xl font-bold">{score}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-muted">Kỷ lục</div>
          <div className="tabular-nums text-3xl font-bold text-google-yellow">
            {best}
          </div>
        </div>
        {combo > 0 && (
          <div className="text-center">
            <div className="text-sm text-muted">Combo</div>
            <div className="tabular-nums text-3xl font-bold text-google-red">
              x{combo + 1}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {shield && (
          <span className="rounded-full bg-google-blue/10 px-3 py-1 text-xs font-semibold text-google-blue">
            Khiên
          </span>
        )}
        {magnet && (
          <span className="rounded-full bg-google-red/10 px-3 py-1 text-xs font-semibold text-google-red">
            Nam châm
          </span>
        )}
        {speedBoost && (
          <span className="rounded-full bg-google-yellow/10 px-3 py-1 text-xs font-semibold text-google-yellow">
            Tăng tốc
          </span>
        )}
      </div>

      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="w-full max-w-3xl rounded-2xl border border-border bg-surface"
      />

      {phase === "idle" && (
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={start}
          className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-on-primary transition-colors hover:opacity-90"
        >
          <Play className="h-5 w-5" aria-hidden="true" />
          Bắt đầu
        </button>
      )}

      {phase === "gameover" && (
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-full bg-google-red/10 px-6 py-2 text-sm font-semibold text-google-red">
            Game over! Đạt {score} điểm
          </div>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={start}
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-on-primary transition-colors hover:opacity-90"
          >
            <RotateCcw className="h-5 w-5" aria-hidden="true" />
            Chơi lại
          </button>
        </div>
      )}

      {phase === "playing" && (
        <p className="text-sm text-muted">
          SPACE / ↑ để nhảy · ↓ để cúi · chạm để nhảy (mobile)
        </p>
      )}
    </div>
  );
}
