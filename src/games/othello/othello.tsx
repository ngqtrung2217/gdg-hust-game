"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, Bot, Users, Trophy, PartyPopper, Handshake } from "lucide-react";
import {
  createInitialBoard,
  getAIMove,
  getValidMoves,
  isGameOver,
  makeMove,
  opponentOf,
  countDiscs,
  type AIDifficulty,
  type Board,
  type Disc,
} from "./logic";
import { isAudioMuted } from "@/lib/audio";
import { triggerConfetti } from "@/lib/confetti";

type GameMode = "pve" | "pvp";

export function Othello() {
  const [board, setBoard] = useState<Board>(createInitialBoard);
  const [currentPlayer, setCurrentPlayer] = useState<Disc>("B"); // B starts
  const [mode, setMode] = useState<GameMode>("pve");
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>("medium");
  const [isThinkingAI, setIsThinkingAI] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [bestWins, setBestWins] = useState(0);
  const [recentFlipped, setRecentFlipped] = useState<Set<string>>(new Set());

  const discCounts = useMemo(() => countDiscs(board), [board]);
  const gameOver = useMemo(() => isGameOver(board), [board]);

  const validMoves = useMemo(() => {
    if (gameOver || (mode === "pve" && currentPlayer === "R" && isThinkingAI)) {
      return [];
    }
    return getValidMoves(board, currentPlayer);
  }, [board, currentPlayer, gameOver, mode, isThinkingAI]);

  const validMoveMap = useMemo(() => {
    const map = new Set<string>();
    for (const [r, c] of validMoves) {
      map.add(`${r}-${c}`);
    }
    return map;
  }, [validMoves]);

  // Load high score
  useEffect(() => {
    const saved = Number(localStorage.getItem("othello-best") ?? 0);
    setBestWins(saved);
  }, []);

  // Audio effects
  const playClickSound = () => {
    if (typeof window === "undefined" || isAudioMuted()) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(420, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // Audio fallback
    }
  };

  const playWinSound = () => {
    if (typeof window === "undefined" || isAudioMuted()) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.12, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.2);
      });
    } catch {
      // Audio fallback
    }
  };

  // Reset Game
  const resetGame = useCallback(() => {
    setBoard(createInitialBoard());
    setCurrentPlayer("B");
    setIsThinkingAI(false);
    setStatusMessage("");
    setRecentFlipped(new Set());
  }, []);

  // Update high score on win
  useEffect(() => {
    if (gameOver) {
      const { B, R } = discCounts;
      if (B > R) {
        playWinSound();
        triggerConfetti({ particleCount: 130, spread: 85, origin: { x: 0.5, y: 0.4 } });
        const nextWins = bestWins + 1;
        setBestWins(nextWins);
        localStorage.setItem("othello-best", String(nextWins));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameOver]);

  // Handle cell click
  const handleCellClick = (r: number, c: number) => {
    if (gameOver || isThinkingAI) return;
    if (mode === "pve" && currentPlayer === "R") return;
    if (!validMoveMap.has(`${r}-${c}`)) return;

    playClickSound();
    const { nextBoard, flips } = makeMove(board, r, c, currentPlayer);
    const flippedKeys = new Set(flips.map(([fr, fc]) => `${fr}-${fc}`));
    flippedKeys.add(`${r}-${c}`);
    setRecentFlipped(flippedKeys);
    setBoard(nextBoard);

    // Switch player or pass
    const nextPlayer = opponentOf(currentPlayer);
    const nextMoves = getValidMoves(nextBoard, nextPlayer);

    if (nextMoves.length > 0) {
      setCurrentPlayer(nextPlayer);
      setStatusMessage("");
    } else {
      // Opponent must pass
      const currAgainMoves = getValidMoves(nextBoard, currentPlayer);
      if (currAgainMoves.length > 0) {
        setStatusMessage(`${nextPlayer === "B" ? "Xanh" : "Đỏ"} không có nước đi! Phải bỏ lượt.`);
      } else {
        // Both have no moves -> game over
        setStatusMessage("Cả hai bên đều hết nước đi!");
      }
    }
  };

  // AI Turn handler
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (gameOver || mode !== "pve" || currentPlayer !== "R") {
      setIsThinkingAI(false);
      return;
    }

    setIsThinkingAI(true);
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);

    aiTimerRef.current = setTimeout(() => {
      const move = getAIMove(board, "R", aiDifficulty);
      if (move) {
        const [r, c] = move;
        playClickSound();
        const { nextBoard, flips } = makeMove(board, r, c, "R");
        const flippedKeys = new Set(flips.map(([fr, fc]) => `${fr}-${fc}`));
        flippedKeys.add(`${r}-${c}`);
        setRecentFlipped(flippedKeys);
        setBoard(nextBoard);

        const nextMoves = getValidMoves(nextBoard, "B");
        if (nextMoves.length > 0) {
          setCurrentPlayer("B");
          setStatusMessage("");
        } else {
          // Player B must pass
          const aiAgainMoves = getValidMoves(nextBoard, "R");
          if (aiAgainMoves.length > 0) {
            setStatusMessage("Xanh không có nước đi! AI tiếp tục đi.");
            setCurrentPlayer("R");
          } else {
            setStatusMessage("Cả hai bên đều hết nước đi!");
          }
        }
      }
      setIsThinkingAI(false);
    }, 600);

    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, [board, currentPlayer, mode, aiDifficulty, gameOver]);

  return (
    <div className="flex w-full flex-col items-center gap-5 select-none">
      {/* Game Mode & Difficulty controls */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <div className="flex rounded-full border border-border bg-surface p-1 shadow-sm">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setMode("pve");
              resetGame();
            }}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              mode === "pve" ? "bg-primary text-on-primary shadow" : "text-muted hover:text-foreground"
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
            Đấu với AI
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setMode("pvp");
              resetGame();
            }}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              mode === "pvp" ? "bg-primary text-on-primary shadow" : "text-muted hover:text-foreground"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            2 Người chơi
          </button>
        </div>

        {mode === "pve" && (
          <div className="flex items-center gap-1 rounded-full border border-border bg-surface p-1 text-xs">
            {(["easy", "medium", "hard"] as AIDifficulty[]).map((diff) => (
              <button
                key={diff}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setAiDifficulty(diff)}
                className={`rounded-full px-3 py-1 font-medium transition-all ${
                  aiDifficulty === diff
                    ? "bg-google-blue/15 text-google-blue font-bold"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {diff === "easy" ? "Dễ" : diff === "medium" ? "Vừa" : "Khó"}
              </button>
            ))}
          </div>
        )}

        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={resetGame}
          className="flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-xs font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Chơi lại
        </button>
      </div>

      {/* Turn & Score Header */}
      <div className="flex w-full max-w-md items-center justify-between rounded-2xl border border-border bg-surface px-6 py-3 shadow-sm">
        {/* Blue Player */}
        <div
          className={`flex items-center gap-3 rounded-xl px-3 py-1.5 transition-all ${
            currentPlayer === "B" && !gameOver ? "ring-2 ring-google-blue bg-google-blue/10" : "opacity-75"
          }`}
        >
          <div className="h-6 w-6 rounded-full bg-google-blue shadow-md border-2 border-white dark:border-zinc-800" />
          <div className="text-left">
            <div className="text-[11px] font-bold uppercase tracking-wider text-google-blue">
              Xanh {mode === "pve" ? "(Bạn)" : "(P1)"}
            </div>
            <div className="tabular-nums text-xl font-extrabold text-foreground">{discCounts.B}</div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-[11px] font-medium text-muted">VS</span>
          {bestWins > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-google-yellow">
              <Trophy className="h-3 w-3" /> {bestWins} thắng
            </span>
          )}
        </div>

        {/* Red Player / AI */}
        <div
          className={`flex items-center gap-3 rounded-xl px-3 py-1.5 transition-all ${
            currentPlayer === "R" && !gameOver ? "ring-2 ring-google-red bg-google-red/10" : "opacity-75"
          }`}
        >
          <div className="text-right">
            <div className="text-[11px] font-bold uppercase tracking-wider text-google-red">
              {mode === "pve" ? "Đỏ (AI)" : "Đỏ (P2)"}
            </div>
            <div className="tabular-nums text-xl font-extrabold text-foreground">{discCounts.R}</div>
          </div>
          <div className="h-6 w-6 rounded-full bg-google-red shadow-md border-2 border-white dark:border-zinc-800" />
        </div>
      </div>

      {/* Status banner / Pass notice */}
      {statusMessage && (
        <div className="rounded-full bg-google-yellow/15 px-4 py-1.5 text-xs font-semibold text-google-yellow animate-pulse">
          {statusMessage}
        </div>
      )}

      {isThinkingAI && (
        <div className="flex items-center gap-2 text-xs font-medium text-google-red animate-pulse">
          <Bot className="h-4 w-4" />
          AI đang tính toán nước đi...
        </div>
      )}

      {/* 8x8 Board Container */}
      {/* Othello Tournament Board with Wood Border and Coordinate Rims */}
      <div className="relative rounded-3xl bg-gradient-to-br from-amber-950 via-zinc-900 to-amber-950 p-3 sm:p-4 shadow-2xl border-4 border-amber-900/60 ring-2 ring-black/40">
        {/* Top Coordinate letters A-H */}
        <div className="flex justify-between px-3 pb-1 text-[11px] font-bold text-amber-200/50 font-mono tracking-widest select-none">
          {["A", "B", "C", "D", "E", "F", "G", "H"].map((col) => (
            <span key={col} className="w-8 text-center">{col}</span>
          ))}
        </div>

        <div
          className="grid grid-cols-8 gap-1 rounded-2xl bg-emerald-900/90 p-1.5 sm:p-2 border-2 border-emerald-950/80 shadow-[inset_0_3px_10px_rgba(0,0,0,0.6)]"
          style={{ width: "min(88vw, 420px)", height: "min(88vw, 420px)" }}
        >
          {board.map((row, r) =>
            row.map((cell, c) => {
              const key = `${r}-${c}`;
              const isValid = validMoveMap.has(key);
              const wasFlipped = recentFlipped.has(key);
              const isStar = (r === 2 || r === 6) && (c === 2 || c === 6);

              return (
                <button
                  key={key}
                  disabled={!isValid}
                  onClick={() => handleCellClick(r, c)}
                  onMouseDown={(e) => e.preventDefault()}
                  aria-label={`Ô ${r + 1}, ${c + 1}`}
                  className="group relative flex items-center justify-center rounded-lg bg-emerald-800/80 hover:bg-emerald-700/90 transition-colors disabled:hover:bg-emerald-800/80 disabled:cursor-default overflow-hidden [perspective:1000px]"
                >
                  {/* Subtle Star Marker for classic 8x8 tournament board */}
                  {isStar && cell === null && (
                    <div className="absolute h-1.5 w-1.5 rounded-full bg-amber-400/40 pointer-events-none" />
                  )}

                  {/* 3D Physical Reversi Disc */}
                  {cell !== null && (
                    <div
                      className={`relative flex h-[84%] w-[84%] items-center justify-center rounded-full shadow-[0_4px_8px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.4)] transition-transform duration-300 [transform-style:preserve-3d] ${
                        wasFlipped ? "[transform:rotateY(180deg)]" : "[transform:rotateY(0deg)]"
                      } ${
                        cell === "B"
                          ? "bg-[radial-gradient(ellipse_at_30%_30%,#60a5fa,#2563eb_65%,#1e3a8a_100%)] ring-1 ring-blue-300/50"
                          : "bg-[radial-gradient(ellipse_at_30%_30%,#f87171,#dc2626_65%,#7f1d1d_100%)] ring-1 ring-red-300/50"
                      }`}
                    >
                      {/* Inner Groove Ring */}
                      <div className="h-[75%] w-[75%] rounded-full border border-white/20 flex items-center justify-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-white/40 shadow-sm" />
                      </div>
                    </div>
                  )}

                  {/* Valid move indicators: Pulsing dot + Interactive Ghost preview */}
                  {cell === null && isValid && (
                    <>
                      <div
                        className={`absolute inset-1 rounded-full opacity-0 group-hover:opacity-40 transition-all scale-75 group-hover:scale-90 ${
                          currentPlayer === "B"
                            ? "bg-google-blue border-2 border-cyan-300"
                            : "bg-google-red border-2 border-rose-300"
                        }`}
                      />
                      <div
                        className={`relative z-10 h-3 w-3 rounded-full transition-all group-hover:scale-0 ${
                          currentPlayer === "B"
                            ? "bg-google-blue shadow-[0_0_10px_rgba(66,133,244,0.9)] ring-2 ring-blue-300/60"
                            : "bg-google-red shadow-[0_0_10px_rgba(234,67,53,0.9)] ring-2 ring-red-300/60"
                        }`}
                      />
                    </>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Game Over Banner */}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-background/85 backdrop-blur-sm p-6 text-center animate-in fade-in zoom-in duration-200">
            {discCounts.B > discCounts.R ? (
              <PartyPopper className="h-12 w-12 text-google-blue mb-2 drop-shadow" />
            ) : discCounts.R > discCounts.B ? (
              <Trophy className="h-12 w-12 text-google-red mb-2 drop-shadow" />
            ) : (
              <Handshake className="h-12 w-12 text-muted mb-2 drop-shadow" />
            )}
            <h3 className="text-2xl font-bold text-foreground">
              {discCounts.B > discCounts.R
                ? "Quân Xanh Chiến Thắng!"
                : discCounts.R > discCounts.B
                ? "Quân Đỏ Chiến Thắng!"
                : "Hòa Cờ!"}
            </h3>
            <p className="mt-1 text-sm text-muted">
              Tỉ số: <strong className="text-google-blue">{discCounts.B}</strong> -{" "}
              <strong className="text-google-red">{discCounts.R}</strong>
            </p>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={resetGame}
              className="mt-5 flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-on-primary shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              <RotateCcw className="h-4 w-4" />
              Chơi ván mới
            </button>
          </div>
        )}
      </div>

      {/* Guide hint */}
      <div className="text-center text-xs text-muted max-w-sm">
        <p>
          Kẹp quân đối thủ theo hàng ngang, dọc hoặc chéo để lật thành màu của bạn. Ô có chấm sáng là các vị trí hợp lệ.
        </p>
      </div>
    </div>
  );
}
