"use client";

export interface ConfettiOptions {
  particleCount?: number;
  origin?: { x: number; y: number }; // 0 to 1 normalized
  spread?: number; // In degrees
  startVelocity?: number;
  colors?: string[];
  durationMs?: number;
}

const GOOGLE_COLORS = ["#4285F4", "#EA4335", "#FBBC04", "#34A853", "#A142F4"];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  flip: number;
  flipSpeed: number;
  opacity: number;
  decay: number;
}

export function triggerConfetti(options: ConfettiOptions = {}) {
  if (typeof window === "undefined") return;

  const count = options.particleCount ?? 90;
  const originX = (options.origin?.x ?? 0.5) * window.innerWidth;
  const originY = (options.origin?.y ?? 0.4) * window.innerHeight;
  const spread = (options.spread ?? 75) * (Math.PI / 180);
  const startVelocity = options.startVelocity ?? 38;
  const colors = options.colors ?? GOOGLE_COLORS;

  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);

  const particles: Particle[] = [];
  const baseAngle = -Math.PI / 2; // Upward

  for (let i = 0; i < count; i++) {
    const angle = baseAngle + (Math.random() - 0.5) * spread;
    const speed = startVelocity * (0.6 + Math.random() * 0.8);
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      w: 8 + Math.random() * 6,
      h: 5 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      flip: Math.random() * Math.PI * 2,
      flipSpeed: 0.1 + Math.random() * 0.2,
      opacity: 1,
      decay: 0.008 + Math.random() * 0.008,
    });
  }

  let animationFrameId = 0;
  const gravity = 0.8;
  const drag = 0.98;

  const timeoutId = setTimeout(() => {
    cancelAnimationFrame(animationFrameId);
    canvas.remove();
  }, 5000);

  const render = () => {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    let activeParticles = 0;

    for (const p of particles) {
      if (p.opacity <= 0 || p.y > window.innerHeight + 50) continue;
      activeParticles++;

      p.vx *= drag;
      p.vy = p.vy * drag + gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.flip += p.flipSpeed;
      p.opacity = Math.max(0, p.opacity - p.decay);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.scale(1, Math.cos(p.flip));
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    if (activeParticles > 0) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timeoutId);
      canvas.remove();
    }
  };

  animationFrameId = requestAnimationFrame(render);
}
