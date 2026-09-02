"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, RotateCcw, Volume2, VolumeX, ArrowUp, ArrowDown, Shield, Zap } from "lucide-react";
import { isAudioMuted } from "@/lib/audio";

// Canvas logical dimensions
const CANVAS_W = 800;
const CANVAS_H = 250;
const GROUND_Y = 210;

// Physics constants
const GRAVITY = 0.6;
const INITIAL_JUMP_V = -11.8;
const MIN_JUMP_V = -4.0; // variable jump height when key released
const FAST_DROP_V = 12.0; // fast fall when pressing down in air
const BASE_SPEED = 6.0;
const TURBO_SPEED = 10.2;
const MAX_SPEED = 13.5;
const ACCELERATION = 0.001;

// Sprite Coordinates in offline-sprite-2x.png (DPR 2x standard)
const SPRITE_DINO_IDLE = { sx: 1338, sy: 2, sw: 44, sh: 47 };
const SPRITE_DINO_RUN1 = { sx: 1514, sy: 2, sw: 44, sh: 47 };
const SPRITE_DINO_RUN2 = { sx: 1558, sy: 2, sw: 44, sh: 47 };
const SPRITE_DINO_DUCK1 = { sx: 1866, sy: 19, sw: 59, sh: 30 };
const SPRITE_DINO_DUCK2 = { sx: 1925, sy: 19, sw: 59, sh: 30 };
const SPRITE_DINO_DEAD = { sx: 1690, sy: 2, sw: 44, sh: 47 };

const SPRITE_CACTUS_S1 = { sx: 446, sy: 2, sw: 17, sh: 35 };
const SPRITE_CACTUS_S2 = { sx: 480, sy: 2, sw: 34, sh: 35 };
const SPRITE_CACTUS_S3 = { sx: 514, sy: 2, sw: 51, sh: 35 };
const SPRITE_CACTUS_L1 = { sx: 652, sy: 2, sw: 25, sh: 50 };
const SPRITE_CACTUS_L2 = { sx: 677, sy: 2, sw: 50, sh: 50 };

const SPRITE_PTERO1 = { sx: 260, sy: 2, sw: 46, sh: 40 };
const SPRITE_PTERO2 = { sx: 306, sy: 2, sw: 46, sh: 40 };

const SPRITE_CLOUD = { sx: 166, sy: 2, sw: 46, sh: 14 };
const SPRITE_GROUND1 = { sx: 2, sy: 104, sw: 600, sh: 12 };
const SPRITE_GROUND2 = { sx: 602, sy: 104, sw: 600, sh: 12 };

type Phase = "idle" | "playing" | "gameover";
type DinoSkin = "classic" | "cool" | "crown" | "robo";
type GameSpeedMode = "normal" | "turbo";

interface Obstacle {
  type: "cactus_s" | "cactus_l" | "ptero";
  sprite: { sx: number; sy: number; sw: number; sh: number };
  x: number;
  y: number;
  w: number;
  h: number;
  passed: boolean;
  frameTimer?: number;
  frameIndex?: number;
}

interface Cloud {
  x: number;
  y: number;
  speed: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color?: string;
}

class RetroAudio {
  ctx: AudioContext | null = null;
  enabled = true;

  init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  jump() {
    if (!this.enabled || isAudioMuted()) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(460, now + 0.1);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // AudioContext fallback
    }
  }

  milestone() {
    if (!this.enabled || isAudioMuted()) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = "square";
      osc1.frequency.setValueAtTime(587.33, now); // D5
      gain1.gain.setValueAtTime(0.1, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.09);

      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = "square";
      osc2.frequency.setValueAtTime(880, now + 0.1); // A5
      gain2.gain.setValueAtTime(0.1, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.22);
    } catch {
      // AudioContext fallback
    }
  }

  powerup() {
    if (!this.enabled || isAudioMuted()) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [440, 554.37, 659.25, 880].forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.05);
        gain.gain.setValueAtTime(0.1, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.1);
      });
    } catch {
      // Audio fallback
    }
  }

  shieldBreak() {
    if (!this.enabled || isAudioMuted()) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.16);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch {
      // Audio fallback
    }
  }

  gameOver() {
    if (!this.enabled || isAudioMuted()) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.28);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    } catch {
      // AudioContext fallback
    }
  }
}

export function DinoRun() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spriteRef = useRef<HTMLImageElement | null>(null);
  const audioRef = useRef<RetroAudio>(new RetroAudio());

  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [isDucking, setIsDucking] = useState(false);

  // New Upgrades State
  const [skin, setSkin] = useState<DinoSkin>("classic");
  const [mode, setMode] = useState<GameSpeedMode>("normal");
  const [hasShield, setHasShield] = useState(false);

  // Core mutable game engine state
  const engine = useRef({
    phase: "idle" as Phase,
    skin: "classic" as DinoSkin,
    mode: "normal" as GameSpeedMode,
    hasShield: false,
    shieldItem: null as { x: number; y: number; w: number; h: number } | null,
    particles: [] as Particle[],
    shakeTimer: 0,
    dino: {
      x: 50,
      y: GROUND_Y,
      vy: 0,
      w: 44,
      h: 47,
      duck: false,
      jumping: false,
      grounded: true,
      legTimer: 0,
      legFrame: 0,
    },
    ground1X: 0,
    ground2X: 600,
    speed: BASE_SPEED,
    score: 0,
    best: 0,
    lastMilestone: 0,
    obstacles: [] as Obstacle[],
    clouds: [] as Cloud[],
    nextObstacleDistance: 400,
    nightMode: false,
    lastTime: 0,
    rafId: 0,
    isDarkTheme: false,
  });

  // Toggle sound
  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    audioRef.current.enabled = next;
  };

  // Check if webpage is in Dark theme
  const updateThemeCheck = useCallback(() => {
    if (typeof document !== "undefined") {
      engine.current.isDarkTheme = document.documentElement.classList.contains("dark");
    }
  }, []);

  // Initialize clouds
  const resetClouds = () => {
    engine.current.clouds = [
      { x: 180, y: 40, speed: 0.8 },
      { x: 420, y: 70, speed: 0.6 },
      { x: 680, y: 30, speed: 0.9 },
    ];
  };

  // Spawn obstacles
  const trySpawnObstacle = () => {
    const s = engine.current;
    const lastObs = s.obstacles[s.obstacles.length - 1];

    if (lastObs) {
      const distanceFromRight = CANVAS_W - (lastObs.x + lastObs.w);
      if (distanceFromRight < s.nextObstacleDistance) return;
    }

    // Decide obstacle type
    const allowPtero = s.score >= 250;
    const rand = Math.random();

    let obs: Obstacle;

    if (allowPtero && rand < 0.28) {
      const altRand = Math.random();
      let pteroY = GROUND_Y - 35;
      if (altRand < 0.35) {
        pteroY = GROUND_Y - 95; // High
      } else if (altRand < 0.75) {
        pteroY = GROUND_Y - 55; // Mid
      }

      obs = {
        type: "ptero",
        sprite: SPRITE_PTERO1,
        x: CANVAS_W + 20,
        y: pteroY,
        w: 46,
        h: 40,
        passed: false,
        frameTimer: 0,
        frameIndex: 0,
      };
    } else {
      // Cactus
      const isLarge = Math.random() < 0.45;
      if (isLarge) {
        const count = Math.random() < 0.7 ? 1 : 2;
        const sprite = count === 1 ? SPRITE_CACTUS_L1 : SPRITE_CACTUS_L2;
        obs = {
          type: "cactus_l",
          sprite,
          x: CANVAS_W + 20,
          y: GROUND_Y - sprite.sh,
          w: sprite.sw,
          h: sprite.sh,
          passed: false,
        };
      } else {
        const count = Math.random() < 0.5 ? 1 : Math.random() < 0.75 ? 2 : 3;
        const sprite = count === 1 ? SPRITE_CACTUS_S1 : count === 2 ? SPRITE_CACTUS_S2 : SPRITE_CACTUS_S3;
        obs = {
          type: "cactus_s",
          sprite,
          x: CANVAS_W + 20,
          y: GROUND_Y - sprite.sh,
          w: sprite.sw,
          h: sprite.sh,
          passed: false,
        };
      }
    }

    s.obstacles.push(obs);

    // Dynamic distance calculation ensuring everything is jumpable and continuous
    const minGap = Math.round(obs.w + 170 + s.speed * 10);
    const maxGap = Math.round(minGap + 180 + Math.random() * 120);
    s.nextObstacleDistance = Math.floor(Math.random() * (maxGap - minGap + 1)) + minGap;
  };

  // Accurate hitboxes with padding
  const checkCollision = (obs: Obstacle): boolean => {
    const d = engine.current.dino;

    const dinoW = d.duck && d.grounded ? SPRITE_DINO_DUCK1.sw : SPRITE_DINO_IDLE.sw;
    const dinoH = d.duck && d.grounded ? SPRITE_DINO_DUCK1.sh : SPRITE_DINO_IDLE.sh;

    const padX = 7;
    const padY = 6;
    const dBox = {
      x: d.x + padX,
      y: d.y - dinoH + padY,
      w: dinoW - padX * 2,
      h: dinoH - padY * 2,
    };

    const obsPadX = obs.type === "ptero" ? 8 : 4;
    const obsPadY = obs.type === "ptero" ? 8 : 4;
    const oBox = {
      x: obs.x + obsPadX,
      y: obs.y + obsPadY,
      w: obs.w - obsPadX * 2,
      h: obs.h - obsPadY * 2,
    };

    return (
      dBox.x < oBox.x + oBox.w &&
      dBox.x + dBox.w > oBox.x &&
      dBox.y < oBox.y + oBox.h &&
      dBox.y + dBox.h > oBox.y
    );
  };

  // Check shield item pickup collision
  const checkShieldPickup = (): boolean => {
    const s = engine.current;
    if (!s.shieldItem) return false;
    const d = s.dino;
    const dinoH = d.duck && d.grounded ? SPRITE_DINO_DUCK1.sh : SPRITE_DINO_IDLE.sh;

    return (
      d.x < s.shieldItem.x + s.shieldItem.w &&
      d.x + d.w > s.shieldItem.x &&
      d.y - dinoH < s.shieldItem.y + s.shieldItem.h &&
      d.y > s.shieldItem.y
    );
  };

  // Handle Game Over
  const triggerGameOver = () => {
    const s = engine.current;
    s.phase = "gameover";
    s.shakeTimer = 20;
    setPhase("gameover");
    audioRef.current.gameOver();

    const finalScore = Math.floor(s.score);
    if (finalScore > s.best) {
      s.best = finalScore;
      setBest(finalScore);
      localStorage.setItem("dino-run-best", String(finalScore));
    }
  };

  // Start / Restart game
  const startGame = useCallback(() => {
    const s = engine.current;
    const startSpeed = s.mode === "turbo" ? TURBO_SPEED : BASE_SPEED;

    s.phase = "playing";
    s.dino = {
      x: 50,
      y: GROUND_Y,
      vy: 0,
      w: 44,
      h: 47,
      duck: false,
      jumping: false,
      grounded: true,
      legTimer: 0,
      legFrame: 0,
    };
    s.ground1X = 0;
    s.ground2X = 600;
    s.speed = startSpeed;
    s.score = 0;
    s.lastMilestone = 0;
    s.obstacles = [];
    s.particles = [];
    s.hasShield = false;
    s.shieldItem = null;
    s.shakeTimer = 0;
    s.nextObstacleDistance = 350;
    s.nightMode = false;
    resetClouds();

    setPhase("playing");
    setScore(0);
    setIsDucking(false);
    setHasShield(false);
  }, []);

  // Jump action
  const doJump = useCallback(() => {
    const s = engine.current;
    if (s.phase === "idle" || s.phase === "gameover") {
      startGame();
      s.dino.vy = INITIAL_JUMP_V;
      s.dino.grounded = false;
      s.dino.jumping = true;
      audioRef.current.jump();
      return;
    }

    if (s.phase === "playing" && s.dino.grounded) {
      s.dino.vy = INITIAL_JUMP_V;
      s.dino.grounded = false;
      s.dino.jumping = true;
      audioRef.current.jump();

      // Jump takeoff dust poof
      for (let i = 0; i < 6; i++) {
        s.particles.push({
          x: s.dino.x + 12 + (Math.random() - 0.5) * 15,
          y: GROUND_Y - 2,
          vx: (Math.random() - 0.5) * 2.5 - s.speed * 0.2,
          vy: -Math.random() * 1.8 - 0.5,
          size: Math.random() * 2.5 + 1.5,
          alpha: 0.9,
        });
      }
    }
  }, [startGame]);

  // Release jump early
  const releaseJump = useCallback(() => {
    const s = engine.current;
    if (s.phase === "playing" && s.dino.jumping && s.dino.vy < MIN_JUMP_V) {
      s.dino.vy = MIN_JUMP_V;
      s.dino.jumping = false;
    }
  }, []);

  // Duck action
  const setDucking = useCallback((duck: boolean) => {
    const s = engine.current;
    if (s.phase !== "playing") return;

    s.dino.duck = duck;
    setIsDucking(duck);

    if (duck && !s.dino.grounded) {
      s.dino.vy = FAST_DROP_V;
    }
  }, []);

  // Change Skin
  const handleSelectSkin = (newSkin: DinoSkin) => {
    setSkin(newSkin);
    engine.current.skin = newSkin;
  };

  // Change Speed Mode
  const handleSelectMode = (newMode: GameSpeedMode) => {
    setMode(newMode);
    engine.current.mode = newMode;
    if (engine.current.phase === "idle" || engine.current.phase === "gameover") {
      engine.current.speed = newMode === "turbo" ? TURBO_SPEED : BASE_SPEED;
    }
  };

  // Main game update step
  const update = (dt: number) => {
    const s = engine.current;
    if (s.phase !== "playing") return;

    const dtScale = Math.min(dt / 16.667, 2.0);

    // Speed progression
    const minSpeed = s.mode === "turbo" ? TURBO_SPEED : BASE_SPEED;
    s.speed = Math.min(MAX_SPEED, minSpeed + s.score * ACCELERATION);

    // Score progression (Turbo mode earns x1.5 points!)
    const scoreRate = s.mode === "turbo" ? 0.0075 : 0.005;
    s.score += s.speed * dt * scoreRate;
    const currentScoreInt = Math.floor(s.score);
    setScore(currentScoreInt);

    // Milestone sound every 100 points
    if (currentScoreInt > 0 && currentScoreInt % 100 === 0 && currentScoreInt !== s.lastMilestone) {
      s.lastMilestone = currentScoreInt;
      audioRef.current.milestone();
    }

    // Day / Night cycle (switches every 700 points)
    s.nightMode = Math.floor(currentScoreInt / 700) % 2 === 1;

    // Dino leg animation
    if (s.dino.grounded) {
      s.dino.legTimer += dt;
      if (s.dino.legTimer > 110) {
        s.dino.legTimer = 0;
        s.dino.legFrame = (s.dino.legFrame + 1) % 2;
      }

      // Footstep dust particles when running
      if (Math.random() < 0.35) {
        s.particles.push({
          x: s.dino.x + 8 + Math.random() * 8,
          y: GROUND_Y - 2,
          vx: -s.speed * 0.35 - Math.random() * 1.5,
          vy: -Math.random() * 1.0,
          size: Math.random() * 2.2 + 1.2,
          alpha: 0.8,
        });
      }
    }

    // Dino jump physics
    if (!s.dino.grounded) {
      s.dino.vy += GRAVITY * dtScale;
      s.dino.y += s.dino.vy * dtScale;
      if (s.dino.y >= GROUND_Y) {
        s.dino.y = GROUND_Y;
        s.dino.vy = 0;
        s.dino.grounded = true;
        s.dino.jumping = false;
      }
    }

    // Update ground
    const groundMove = s.speed * dtScale;
    s.ground1X -= groundMove;
    s.ground2X -= groundMove;
    if (s.ground1X <= -600) s.ground1X = s.ground2X + 600;
    if (s.ground2X <= -600) s.ground2X = s.ground1X + 600;

    // Update clouds
    s.clouds.forEach((cloud) => {
      cloud.x -= cloud.speed * dtScale;
      if (cloud.x < -60) {
        cloud.x = CANVAS_W + Math.random() * 150;
        cloud.y = 25 + Math.random() * 65;
      }
    });

    // Spawn Shield item occasionally
    if (!s.hasShield && !s.shieldItem && s.score > 180 && Math.random() < 0.003) {
      s.shieldItem = {
        x: CANVAS_W + 30,
        y: GROUND_Y - 45,
        w: 24,
        h: 24,
      };
    }

    // Update Shield item
    if (s.shieldItem) {
      s.shieldItem.x -= s.speed * dtScale;
      if (checkShieldPickup()) {
        s.hasShield = true;
        setHasShield(true);
        s.shieldItem = null;
        audioRef.current.powerup();

        // Sparkle particles
        for (let k = 0; k < 12; k++) {
          s.particles.push({
            x: s.dino.x + 20,
            y: s.dino.y - 25,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            size: 3,
            alpha: 1,
            color: "#4285F4",
          });
        }
      } else if (s.shieldItem.x < -40) {
        s.shieldItem = null;
      }
    }

    // Spawn obstacles
    trySpawnObstacle();

    // Update obstacles
    for (let i = s.obstacles.length - 1; i >= 0; i--) {
      const obs = s.obstacles[i];
      obs.x -= s.speed * dtScale;

      // Animate pterodactyl wings
      if (obs.type === "ptero") {
        obs.frameTimer = (obs.frameTimer ?? 0) + dt;
        if (obs.frameTimer > 180) {
          obs.frameTimer = 0;
          obs.frameIndex = (obs.frameIndex ?? 0) === 0 ? 1 : 0;
          obs.sprite = obs.frameIndex === 0 ? SPRITE_PTERO1 : SPRITE_PTERO2;
        }
      }

      // Check collision
      if (checkCollision(obs)) {
        if (s.hasShield) {
          // Shield absorbs fatal hit!
          s.hasShield = false;
          setHasShield(false);
          s.obstacles.splice(i, 1);
          s.shakeTimer = 12;
          audioRef.current.shieldBreak();

          // Break particles
          for (let k = 0; k < 15; k++) {
            s.particles.push({
              x: obs.x + obs.w / 2,
              y: obs.y + obs.h / 2,
              vx: (Math.random() - 0.5) * 7,
              vy: (Math.random() - 0.5) * 7,
              size: 3.5,
              alpha: 1,
              color: "#34A853",
            });
          }
          continue;
        }

        triggerGameOver();
        return;
      }

      // Remove passed obstacles
      if (obs.x + obs.w < -30) {
        s.obstacles.splice(i, 1);
      }
    }

    // Update particles
    for (let i = s.particles.length - 1; i >= 0; i--) {
      const p = s.particles[i];
      p.x += p.vx * dtScale;
      p.y += p.vy * dtScale;
      p.alpha -= 0.03 * dtScale;
      if (p.alpha <= 0 || p.x < -30) {
        s.particles.splice(i, 1);
      }
    }

    // Update screen shake
    if (s.shakeTimer > 0) {
      s.shakeTimer -= dtScale;
    }
  };

  // Draw frame to canvas
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = spriteRef.current;
    if (!img) return;

    const s = engine.current;

    // Dark theme / Night mode inversion
    const isDark = s.isDarkTheme || s.nightMode;
    const bgColor = isDark ? "#202124" : "#f8f9fa";

    ctx.save();

    // Screen Shake offset
    if (s.shakeTimer > 0) {
      const shakeX = (Math.random() - 0.5) * 6;
      const shakeY = (Math.random() - 0.5) * 6;
      ctx.translate(shakeX, shakeY);
    }

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Draw Night Sky: Crescent Moon & Twinkling Stars when in Night Mode
    if (s.nightMode) {
      ctx.save();
      const stars = [
        { x: 70, y: 22, s: 2 },
        { x: 140, y: 48, s: 1.5 },
        { x: 230, y: 18, s: 2 },
        { x: 340, y: 38, s: 1.5 },
        { x: 450, y: 15, s: 2 },
        { x: 540, y: 42, s: 1.5 },
        { x: 640, y: 20, s: 2 },
        { x: 740, y: 45, s: 2 },
      ];
      ctx.fillStyle = "#FBBC04";
      stars.forEach((st, idx) => {
        const twinkle = Math.sin(Date.now() * 0.005 + idx * 1.5) * 0.4 + 0.6;
        ctx.globalAlpha = twinkle;
        ctx.fillRect(st.x, st.y, st.s, st.s);
      });

      // Crescent Moon
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = "#FFF9C4";
      ctx.beginPath();
      ctx.arc(CANVAS_W - 90, 36, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      ctx.arc(CANVAS_W - 95, 32, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // When dark, invert sprites so dark pixel art turns clean bright white
    ctx.filter = isDark ? "invert(0.92) hue-rotate(180deg)" : "none";

    // 1. Draw Clouds
    s.clouds.forEach((c) => {
      ctx.drawImage(img, SPRITE_CLOUD.sx, SPRITE_CLOUD.sy, SPRITE_CLOUD.sw, SPRITE_CLOUD.sh, c.x, c.y, SPRITE_CLOUD.sw, SPRITE_CLOUD.sh);
    });

    // 2. Draw Seamless Ground
    const groundDrawY = GROUND_Y - 6;
    ctx.drawImage(img, SPRITE_GROUND1.sx, SPRITE_GROUND1.sy, SPRITE_GROUND1.sw, SPRITE_GROUND1.sh, s.ground1X, groundDrawY, SPRITE_GROUND1.sw, SPRITE_GROUND1.sh);
    ctx.drawImage(img, SPRITE_GROUND2.sx, SPRITE_GROUND2.sy, SPRITE_GROUND2.sw, SPRITE_GROUND2.sh, s.ground2X, groundDrawY, SPRITE_GROUND2.sw, SPRITE_GROUND2.sh);

    // 3. Draw Obstacles
    s.obstacles.forEach((obs) => {
      ctx.drawImage(img, obs.sprite.sx, obs.sprite.sy, obs.sprite.sw, obs.sprite.sh, obs.x, obs.y, obs.w, obs.h);
    });

    // 4. Draw Dino
    const d = s.dino;
    let dinoTop = d.y - SPRITE_DINO_IDLE.sh;

    if (s.phase === "gameover") {
      ctx.drawImage(img, SPRITE_DINO_DEAD.sx, SPRITE_DINO_DEAD.sy, SPRITE_DINO_DEAD.sw, SPRITE_DINO_DEAD.sh, d.x, d.y - SPRITE_DINO_DEAD.sh, SPRITE_DINO_DEAD.sw, SPRITE_DINO_DEAD.sh);
      dinoTop = d.y - SPRITE_DINO_DEAD.sh;
    } else if (d.duck && d.grounded) {
      const duckSprite = d.legFrame === 0 ? SPRITE_DINO_DUCK1 : SPRITE_DINO_DUCK2;
      ctx.drawImage(img, duckSprite.sx, duckSprite.sy, duckSprite.sw, duckSprite.sh, d.x, d.y - duckSprite.sh, duckSprite.sw, duckSprite.sh);
      dinoTop = d.y - duckSprite.sh;
    } else if (!d.grounded) {
      ctx.drawImage(img, SPRITE_DINO_IDLE.sx, SPRITE_DINO_IDLE.sy, SPRITE_DINO_IDLE.sw, SPRITE_DINO_IDLE.sh, d.x, d.y - SPRITE_DINO_IDLE.sh, SPRITE_DINO_IDLE.sw, SPRITE_DINO_IDLE.sh);
    } else if (s.phase === "idle") {
      ctx.drawImage(img, SPRITE_DINO_IDLE.sx, SPRITE_DINO_IDLE.sy, SPRITE_DINO_IDLE.sw, SPRITE_DINO_IDLE.sh, d.x, d.y - SPRITE_DINO_IDLE.sh, SPRITE_DINO_IDLE.sw, SPRITE_DINO_IDLE.sh);
    } else {
      const runSprite = d.legFrame === 0 ? SPRITE_DINO_RUN1 : SPRITE_DINO_RUN2;
      ctx.drawImage(img, runSprite.sx, runSprite.sy, runSprite.sw, runSprite.sh, d.x, d.y - runSprite.sh, runSprite.sw, runSprite.sh);
    }

    ctx.filter = "none";

    // 5. Draw Dino Skins Customization
    if (s.skin === "cool") {
      // Pixel Aviator Sunglasses
      ctx.fillStyle = "#111111";
      const sx = d.duck && d.grounded ? d.x + 36 : d.x + 22;
      const sy = dinoTop + (d.duck && d.grounded ? 8 : 10);
      ctx.fillRect(sx, sy, 14, 6);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(sx + 2, sy + 1, 2, 2);
      ctx.fillRect(sx + 8, sy + 1, 2, 2);
    } else if (s.skin === "crown") {
      // Golden Crown with Ruby
      const cx = d.duck && d.grounded ? d.x + 28 : d.x + 16;
      const cy = dinoTop - 8;
      ctx.fillStyle = "#FBBC04";
      ctx.fillRect(cx, cy, 14, 6);
      ctx.fillRect(cx - 1, cy - 3, 3, 3);
      ctx.fillRect(cx + 5.5, cy - 5, 3, 3);
      ctx.fillRect(cx + 12, cy - 3, 3, 3);
      ctx.fillStyle = "#EA4335";
      ctx.fillRect(cx + 6, cy + 2, 2, 2);
    } else if (s.skin === "robo") {
      // Android Antenna & Cyan Visor
      const rx = d.duck && d.grounded ? d.x + 28 : d.x + 16;
      const ry = dinoTop;
      ctx.fillStyle = "#34A853";
      ctx.fillRect(rx + 4, ry - 6, 2, 6);
      ctx.fillRect(rx + 2, ry - 8, 6, 2);
      ctx.fillStyle = "#4285F4";
      const vx = d.duck && d.grounded ? d.x + 34 : d.x + 20;
      ctx.fillRect(vx, ry + (d.duck && d.grounded ? 8 : 10), 16, 5);
    }

    // 6. Draw Energy Shield Power-Up Item on Track
    if (s.shieldItem) {
      const itemY = s.shieldItem.y + Math.sin(Date.now() * 0.006) * 4;
      ctx.save();
      ctx.fillStyle = "#4285F4";
      ctx.beginPath();
      ctx.arc(s.shieldItem.x + 12, itemY + 12, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(s.shieldItem.x + 8, itemY + 8, 8, 8);
      ctx.restore();
    }

    // 7. Draw Active Shield Bubble around Dino
    if (s.hasShield) {
      ctx.save();
      const pulse = Math.sin(Date.now() * 0.008) * 2;
      const bubbleW = (d.duck && d.grounded ? 38 : 30) + pulse;
      const bubbleH = (d.duck && d.grounded ? 24 : 30) + pulse;
      const centerX = d.x + (d.duck && d.grounded ? 28 : 22);
      const centerY = d.y - (d.duck && d.grounded ? 15 : 24);

      ctx.strokeStyle = "#4285F4";
      ctx.lineWidth = 2.5;
      ctx.fillStyle = "rgba(66, 133, 244, 0.2)";
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, bubbleW, bubbleH, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 8. Draw Dust & Spark Particles
    s.particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color || (isDark ? "#ffffff" : "#535353");
      ctx.fillRect(p.x, p.y, p.size, p.size);
      ctx.restore();
    });

    ctx.restore();
  };

  // Main game loop (RAF)
  useEffect(() => {
    let animId = 0;
    const loop = (timestamp: number) => {
      const s = engine.current;
      if (!s.lastTime) s.lastTime = timestamp;
      const dt = timestamp - s.lastTime;
      s.lastTime = timestamp;

      update(dt);
      draw();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Setup HiDPI Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;

    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);

    const img = new Image();
    img.src = "/assets/dino/offline-sprite-2x.png";
    img.onload = () => {
      spriteRef.current = img;
      resetClouds();
      updateThemeCheck();
      draw();
    };

    const savedBest = Number(localStorage.getItem("dino-run-best") ?? 0);
    setBest(savedBest);
    engine.current.best = savedBest;

    const observer = new MutationObserver(() => updateThemeCheck());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      observer.disconnect();
    };
  }, [updateThemeCheck]);

  // Global keyboard listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        doJump();
      } else if (e.code === "ArrowDown" || e.code === "KeyS") {
        e.preventDefault();
        setDucking(true);
      } else if (e.code === "Enter" && engine.current.phase === "gameover") {
        e.preventDefault();
        startGame();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        releaseJump();
      } else if (e.code === "ArrowDown" || e.code === "KeyS") {
        e.preventDefault();
        setDucking(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [doJump, releaseJump, setDucking, startGame]);

  return (
    <div className="flex w-full flex-col items-center gap-3 select-none">
      {/* Customization Bar: Speed Mode & Skins */}
      <div className="flex flex-wrap items-center justify-between w-full max-w-3xl gap-2 px-1 text-xs">
        {/* Speed Mode Selector */}
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-muted mr-1">Chế độ:</span>
          <button
            type="button"
            onClick={() => handleSelectMode("normal")}
            className={`rounded-full px-3 py-1 font-bold transition-all active:scale-95 ${
              mode === "normal"
                ? "bg-primary text-on-primary shadow-sm"
                : "border border-border bg-surface text-muted hover:bg-surface-hover"
            }`}
          >
            Cổ điển
          </button>
          <button
            type="button"
            onClick={() => handleSelectMode("turbo")}
            className={`rounded-full px-3 py-1 font-bold transition-all active:scale-95 flex items-center gap-1 ${
              mode === "turbo"
                ? "bg-google-red text-white shadow-md"
                : "border border-border bg-surface text-muted hover:bg-surface-hover"
            }`}
          >
            <Zap className="h-3 w-3 fill-current" />
            Turbo (x1.5 Điểm)
          </button>
        </div>

        {/* Skin Selector */}
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-muted mr-1">Ngoại trang:</span>
          {[
            { id: "classic", label: "🦖 Chuẩn" },
            { id: "cool", label: "🕶️ Kính râm" },
            { id: "crown", label: "👑 Hoàng gia" },
            { id: "robo", label: "🤖 Robot" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectSkin(item.id as DinoSkin)}
              className={`rounded-full px-2.5 py-1 font-bold transition-all active:scale-95 ${
                skin === item.id
                  ? "bg-google-blue text-white shadow-sm"
                  : "border border-border bg-surface text-muted hover:bg-surface-hover"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top Header: Score, Best Score, Shield Badge, Sound Toggle */}
      <div className="flex w-full max-w-3xl items-center justify-between px-2">
        <div className="flex items-center gap-6">
          <div className="text-left">
            <div className="text-xs uppercase tracking-wider text-muted font-medium">Điểm</div>
            <div className="tabular-nums text-3xl font-bold text-foreground">
              {String(score).padStart(5, "0")}
            </div>
          </div>
          <div className="text-left">
            <div className="text-xs uppercase tracking-wider text-muted font-medium">Kỷ lục</div>
            <div className="tabular-nums text-3xl font-bold text-google-yellow">
              HI {String(best).padStart(5, "0")}
            </div>
          </div>

          {/* Active Shield Power-Up Badge */}
          {hasShield && (
            <div className="flex items-center gap-1.5 rounded-full bg-google-blue/15 border border-google-blue/40 px-3 py-1 text-xs font-bold text-google-blue animate-pulse">
              <Shield className="h-3.5 w-3.5" />
              <span>Khiên bảo hộ: ĐANG BẬT</span>
            </div>
          )}
        </div>

        <button
          onClick={toggleSound}
          aria-label={soundOn ? "Tắt âm thanh" : "Bật âm thanh"}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface transition-colors hover:bg-surface-hover active:scale-95 shadow-sm"
        >
          {soundOn ? (
            <Volume2 className="h-5 w-5 text-google-green" />
          ) : (
            <VolumeX className="h-5 w-5 text-muted" />
          )}
        </button>
      </div>

      {/* Canvas Game Area */}
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-border shadow-md">
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "auto", aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
          onClick={() => {
            if (phase === "idle" || phase === "gameover") doJump();
          }}
          className="block w-full cursor-pointer bg-surface"
        />

        {/* Start Overlay */}
        {phase === "idle" && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-background/30 backdrop-blur-[2px]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                doJump();
              }}
              className="pointer-events-auto flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-on-primary shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              <Play className="h-5 w-5 fill-current" />
              Bắt đầu chơi
            </button>
            <p className="mt-3 text-xs font-medium text-muted">
              Nhấn SPACE / ↑ hoặc chạm để bắt đầu
            </p>
          </div>
        )}

        {/* Game Over Overlay */}
        {phase === "gameover" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px] transition-opacity">
            <div className="rounded-full bg-google-red/15 border border-google-red/30 px-6 py-2 text-sm font-bold text-google-red mb-3">
              GAME OVER — Đạt {score} điểm {mode === "turbo" && "(Chế độ Turbo)"}
            </div>
            <button
              onClick={startGame}
              className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-base font-semibold text-on-primary shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              <RotateCcw className="h-5 w-5" />
              Chơi lại (SPACE)
            </button>
          </div>
        )}
      </div>

      {/* Control hints on desktop */}
      <div className="hidden text-xs text-muted md:flex items-center gap-4">
        <span><kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono">SPACE</kbd> / <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono">↑</kbd> : Nhảy</span>
        <span><kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono">↓</kbd> : Cúi / Tiếp đất nhanh</span>
        <span><kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono">ENTER</kbd> : Chơi lại</span>
      </div>

      {/* On-screen touch buttons for Mobile */}
      <div className="flex w-full max-w-md items-center justify-center gap-4 pt-2 md:hidden">
        <button
          type="button"
          onTouchStart={(e) => {
            e.preventDefault();
            setDucking(true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            setDucking(false);
          }}
          onMouseDown={() => setDucking(true)}
          onMouseUp={() => setDucking(false)}
          className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border py-4 font-semibold transition-all active:scale-95 ${
            isDucking ? "bg-google-blue text-white" : "bg-surface text-foreground"
          }`}
        >
          <ArrowDown className="h-6 w-6" />
          Cúi xuống
        </button>

        <button
          type="button"
          onTouchStart={(e) => {
            e.preventDefault();
            doJump();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            releaseJump();
          }}
          onMouseDown={doJump}
          onMouseUp={releaseJump}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-semibold text-on-primary shadow-md active:scale-95"
        >
          <ArrowUp className="h-6 w-6" />
          Nhảy
        </button>
      </div>
    </div>
  );
}
