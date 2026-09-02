"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Trophy,
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  RotateCw,
  ChevronsDown,
  Boxes,
  PartyPopper,
  Flame,
} from "lucide-react";
import {
  BOARD_WIDTH,
  TETROMINOES,
  TETRIS_DIFFICULTIES,
  clearLines,
  createEmptyBoard,
  generateBag,
  getDropInterval,
  getGhostY,
  getLineClearScore,
  isValidMove,
  lockPiece,
  tryRotate,
  type BoardMatrix,
  type TetrominoType,
  type TetrisDifficulty,
} from "./logic";
import { triggerConfetti } from "@/lib/confetti";
import { isAudioMuted } from "@/lib/audio";

export function Tetris() {
  const [difficulty, setDifficulty] = useState<TetrisDifficulty>("normal");
  const [board, setBoard] = useState<BoardMatrix>(createEmptyBoard);
  const [currentType, setCurrentType] = useState<TetrominoType | null>(null);
  const [currentShape, setCurrentShape] = useState<number[][]>([]);
  const [posX, setPosX] = useState(3);
  const [posY, setPosY] = useState(0);

  const [bag, setBag] = useState<TetrominoType[]>([]);
  const [nextQueue, setNextQueue] = useState<TetrominoType[]>([]);
  const [holdType, setHoldType] = useState<TetrominoType | null>(null);
  const [canHold, setCanHold] = useState(true);

  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);

  const [isShaking, setIsShaking] = useState(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [phase, setPhase] = useState<"idle" | "playing" | "paused" | "gameover">("idle");
  const [clearingRows, setClearingRows] = useState<number[]>([]);

  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load high score
  useEffect(() => {
    const saved = Number(localStorage.getItem("tetris-best") ?? 0);
    setBestScore(saved);
  }, []);

  // Web Audio Synth with pitch scale for combos
  const playSound = useCallback((type: "move" | "rotate" | "hard_drop" | "clear" | "tetris" | "game_over", comboStep = 0) => {
    if (typeof window === "undefined" || isAudioMuted()) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      if (type === "move") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(320, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.03);
      } else if (type === "rotate") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.05);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === "hard_drop") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.09);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === "clear") {
        const baseFreq = 587.33 + Math.min(comboStep * 45, 400);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.12);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === "tetris") {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + i * 0.08);
          gain.gain.setValueAtTime(0.12, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.2);
        });
      } else if (type === "game_over") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.4);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch {
      // Audio fallback
    }
  }, []);

  // Show temporary toast message
  const triggerToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastNotice(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastNotice(null);
    }, 1100);
  }, []);

  // Spawn next piece from queue
  const spawnPiece = useCallback(
    (currentBoard: BoardMatrix, currentBag: TetrominoType[], currentQueue: TetrominoType[]) => {
      let activeBag = [...currentBag];
      const activeQueue = [...currentQueue];

      while (activeQueue.length < 4) {
        if (activeBag.length === 0) {
          activeBag = generateBag();
        }
        activeQueue.push(activeBag.shift()!);
      }

      const nextType = activeQueue.shift()!;
      const pieceDef = TETROMINOES[nextType];
      const startX = Math.floor((BOARD_WIDTH - pieceDef.shape[0].length) / 2);
      const startY = 0;

      // Check if spawn position is blocked -> Game Over
      if (!isValidMove(currentBoard, pieceDef.shape, startX, startY)) {
        setPhase("gameover");
        playSound("game_over");
        setScore((s) => {
          setBestScore((b) => {
            if (s > b) {
              localStorage.setItem("tetris-best", String(s));
              return s;
            }
            return b;
          });
          return s;
        });
        return;
      }

      setCurrentType(nextType);
      setCurrentShape(pieceDef.shape);
      setPosX(startX);
      setPosY(startY);
      setCanHold(true);
      setBag(activeBag);
      setNextQueue(activeQueue);
    },
    [playSound]
  );

  // Start game with selected difficulty
  const startGame = useCallback(
    (diff?: TetrisDifficulty) => {
      const selectedDiff = diff ?? difficulty;
      const startLvl = TETRIS_DIFFICULTIES[selectedDiff].startLevel;

      const freshBoard = createEmptyBoard();
      setBoard(freshBoard);
      setScore(0);
      setLines(0);
      setLevel(startLvl);
      setCombo(0);
      setHoldType(null);
      setCanHold(true);
      setClearingRows([]);
      setToastNotice(null);

      const bag1 = generateBag();
      const bag2 = generateBag();
      const combined = [...bag1, ...bag2];
      const initialQueue = combined.slice(0, 4);
      const remainingBag = combined.slice(4);

      setBag(remainingBag);
      setNextQueue(initialQueue);
      setPhase("playing");

      spawnPiece(freshBoard, remainingBag, initialQueue);
    },
    [difficulty, spawnPiece]
  );

  // Process line clears with Combo system & Screen Shake
  const processClears = useCallback(
    (clearedBoard: BoardMatrix, clearedLines: number) => {
      if (clearedLines > 0) {
        const nextCombo = combo + 1;
        setCombo(nextCombo);
        const comboBonus = nextCombo > 1 ? (nextCombo - 1) * 50 * level : 0;

        if (clearedLines === 4) {
          // TETRIS!
          playSound("tetris");
          triggerConfetti({ particleCount: 110, spread: 85, origin: { x: 0.5, y: 0.45 } });
          setIsShaking(true);
          setTimeout(() => setIsShaking(false), 420);
          triggerToast(nextCombo > 1 ? `TETRIS! COMBO x${nextCombo} 🔥` : "TETRIS! 🎉");
        } else {
          playSound("clear", nextCombo);
          if (nextCombo >= 2) {
            triggerToast(`COMBO x${nextCombo}! +${comboBonus}đ`);
          }
        }

        const points = getLineClearScore(clearedLines, level, difficulty) + comboBonus;
        setScore((s) => s + points);
        setLines((prev) => {
          const nextLines = prev + clearedLines;
          const config = TETRIS_DIFFICULTIES[difficulty];
          const nextLevel = config.startLevel + Math.floor(nextLines / 8);
          setLevel(nextLevel);
          return nextLines;
        });
      } else {
        // Reset combo if no line cleared
        setCombo(0);
      }

      setBoard(clearedBoard);
      spawnPiece(clearedBoard, bag, nextQueue);
    },
    [bag, combo, difficulty, level, nextQueue, playSound, spawnPiece, triggerToast]
  );

  // Lock and process line clears
  const lockAndProceed = useCallback(() => {
    if (!currentType) return;
    const pieceDef = TETROMINOES[currentType];
    const newBoard = lockPiece(board, currentShape, posX, posY, pieceDef.color);
    const { newBoard: clearedBoard, clearedLines } = clearLines(newBoard);
    processClears(clearedBoard, clearedLines);
  }, [board, currentShape, currentType, posX, posY, processClears]);

  // Move left / right
  const moveHorizontal = useCallback(
    (dir: -1 | 1) => {
      if (phase !== "playing" || !currentShape.length) return;
      if (isValidMove(board, currentShape, posX + dir, posY)) {
        setPosX((x) => x + dir);
        playSound("move");
      }
    },
    [board, currentShape, phase, playSound, posX, posY]
  );

  // Rotate piece
  const rotateCurrent = useCallback(
    (clockwise = true) => {
      if (phase !== "playing" || !currentShape.length) return;
      const res = tryRotate(board, currentShape, posX, posY, clockwise);
      if (res) {
        setCurrentShape(res.newShape);
        setPosX(res.newX);
        setPosY(res.newY);
        playSound("rotate");
      }
    },
    [board, currentShape, phase, playSound, posX, posY]
  );

  // Soft drop (1 step down)
  const softDrop = useCallback(
    (isManual = false) => {
      if (phase !== "playing" || !currentShape.length) return;
      if (isValidMove(board, currentShape, posX, posY + 1)) {
        setPosY((y) => y + 1);
        if (isManual) {
          setScore((s) => s + 1);
        }
      } else {
        lockAndProceed();
      }
    },
    [board, currentShape, lockAndProceed, phase, posX, posY]
  );

  // Hard drop (slam to bottom instantly)
  const hardDrop = useCallback(() => {
    if (phase !== "playing" || !currentShape.length) return;
    const ghostY = getGhostY(board, currentShape, posX, posY);
    const dropDistance = ghostY - posY;
    setScore((s) => s + dropDistance * 2);
    setPosY(ghostY);
    playSound("hard_drop");

    if (!currentType) return;
    const pieceDef = TETROMINOES[currentType];
    const newBoard = lockPiece(board, currentShape, posX, ghostY, pieceDef.color);
    const { newBoard: clearedBoard, clearedLines } = clearLines(newBoard);
    processClears(clearedBoard, clearedLines);
  }, [board, currentShape, currentType, phase, playSound, posX, posY, processClears]);

  // Hold piece mechanic
  const holdPiece = useCallback(() => {
    if (phase !== "playing" || !canHold || !currentType) return;
    playSound("rotate");
    const nextHold = currentType;

    if (holdType === null) {
      setHoldType(nextHold);
      spawnPiece(board, bag, nextQueue);
    } else {
      const pieceDef = TETROMINOES[holdType];
      const startX = Math.floor((BOARD_WIDTH - pieceDef.shape[0].length) / 2);
      if (isValidMove(board, pieceDef.shape, startX, 0)) {
        setHoldType(nextHold);
        setCurrentType(holdType);
        setCurrentShape(pieceDef.shape);
        setPosX(startX);
        setPosY(0);
      }
    }
    setCanHold(false);
  }, [board, canHold, currentType, holdType, phase, playSound, spawnPiece, bag, nextQueue]);

  // Gravity ticker with dynamic difficulty scaling
  useEffect(() => {
    if (phase !== "playing") return;
    const interval = getDropInterval(level, difficulty);
    tickTimerRef.current = setInterval(() => {
      softDrop();
    }, interval);

    return () => {
      if (tickTimerRef.current) clearInterval(tickTimerRef.current);
    };
  }, [phase, level, difficulty, softDrop]);

  // Keyboard controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat && (e.code === "Space" || e.code === "KeyC")) return;

      if (phase === "playing") {
        if (e.code === "ArrowLeft" || e.code === "KeyA") {
          e.preventDefault();
          moveHorizontal(-1);
        } else if (e.code === "ArrowRight" || e.code === "KeyD") {
          e.preventDefault();
          moveHorizontal(1);
        } else if (e.code === "ArrowDown" || e.code === "KeyS") {
          e.preventDefault();
          softDrop(true);
        } else if (e.code === "ArrowUp" || e.code === "KeyW" || e.code === "KeyX") {
          e.preventDefault();
          rotateCurrent(true);
        } else if (e.code === "KeyZ") {
          e.preventDefault();
          rotateCurrent(false);
        } else if (e.code === "Space") {
          e.preventDefault();
          hardDrop();
        } else if (e.code === "KeyC" || e.code === "ShiftLeft" || e.code === "ShiftRight") {
          e.preventDefault();
          holdPiece();
        } else if (e.code === "KeyP" || e.code === "Escape") {
          e.preventDefault();
          setPhase("paused");
        }
      } else if (phase === "paused") {
        if (e.code === "KeyP" || e.code === "Escape" || e.code === "Space") {
          e.preventDefault();
          setPhase("playing");
        }
      } else if (phase === "idle" || phase === "gameover") {
        if (e.code === "Space" || e.code === "Enter") {
          e.preventDefault();
          startGame(difficulty);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, difficulty, moveHorizontal, softDrop, rotateCurrent, hardDrop, holdPiece, startGame]);

  // Compute ghost piece position
  const ghostY = useMemo(() => {
    if (phase !== "playing" || !currentShape.length) return posY;
    return getGhostY(board, currentShape, posX, posY);
  }, [board, currentShape, phase, posX, posY]);

  // Piece preview helper
  const renderMiniShape = (type: TetrominoType | null) => {
    if (!type) {
      return (
        <div className="flex h-16 w-16 items-center justify-center text-xs text-muted/40 font-semibold">
          Trống
        </div>
      );
    }
    const def = TETROMINOES[type];
    return (
      <div className="flex flex-col gap-0.5 p-2">
        {def.shape.map((row, r) => (
          <div key={r} className="flex gap-0.5">
            {row.map((cell, c) => (
              <div
                key={c}
                className={`h-3.5 w-3.5 rounded-[2px] transition-all ${
                  cell ? "shadow-sm border border-white/20" : "opacity-0"
                }`}
                style={{ backgroundColor: cell ? def.color : "transparent" }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="relative flex flex-col items-center select-none w-full max-w-2xl gap-4">
      {/* Difficulty Selector Bar */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {(Object.keys(TETRIS_DIFFICULTIES) as TetrisDifficulty[]).map((dKey) => {
          const d = TETRIS_DIFFICULTIES[dKey];
          return (
            <button
              key={dKey}
              onClick={() => {
                setDifficulty(dKey);
                startGame(dKey);
              }}
              className={`rounded-full px-4 py-1.5 text-xs sm:text-sm font-bold transition-all active:scale-95 ${
                difficulty === dKey
                  ? "bg-primary text-on-primary shadow-md"
                  : "border border-border bg-surface text-muted hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              {d.name} {d.scoreMultiplier > 1 && `(x${d.scoreMultiplier})`}
            </button>
          );
        })}
      </div>

      {/* Top Status Bar: Score, Lines, Level, Combo, High Score */}
      <div className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface px-5 py-3 shadow-sm">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Điểm số</div>
          <div className="tabular-nums text-2xl sm:text-3xl font-black text-foreground">{score}</div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <div className="text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Level</div>
            <div className="tabular-nums text-xl sm:text-2xl font-black text-google-blue">{level}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Dòng đã xóa</div>
            <div className="tabular-nums text-xl sm:text-2xl font-black text-google-green">{lines}</div>
          </div>
          {combo >= 2 && (
            <div className="text-center animate-bounce">
              <div className="text-[10px] font-bold uppercase tracking-wider text-google-red flex items-center justify-center gap-0.5">
                <Flame className="h-3 w-3 fill-current" />
                Combo
              </div>
              <div className="tabular-nums text-xl sm:text-2xl font-black text-google-red">x{combo}</div>
            </div>
          )}
        </div>

        <div className="text-right">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Kỷ lục</div>
          <div className="flex items-center justify-end gap-1 tabular-nums text-xl sm:text-2xl font-black text-google-yellow">
            <Trophy className="h-4 w-4" />
            <span>{bestScore}</span>
          </div>
        </div>
      </div>

      {/* Main Game Stage: Left Panel (Hold) + Center (Board) + Right Panel (Next) */}
      <div className="flex items-start justify-center gap-3 sm:gap-6 w-full">
        {/* Left Side Panel: Hold Queue & Controls */}
        <div className="flex flex-col gap-3 w-20 sm:w-28">
          {/* Hold Box */}
          <div
            onClick={holdPiece}
            className={`flex flex-col items-center justify-center rounded-2xl border bg-surface p-2 sm:p-3 shadow-sm cursor-pointer transition-all hover:border-primary/50 ${
              !canHold ? "opacity-50" : "opacity-100"
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
              Giữ (C)
            </span>
            <div className="flex h-16 w-16 items-center justify-center">
              {renderMiniShape(holdType)}
            </div>
          </div>

          {/* Pause / Resume button */}
          {phase === "playing" && (
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setPhase("paused")}
              className="flex items-center justify-center gap-1 rounded-2xl border border-border bg-surface py-2.5 text-xs font-bold text-muted transition-colors hover:bg-surface-hover hover:text-foreground shadow-sm"
            >
              <Pause className="h-3.5 w-3.5" />
              Tạm dừng
            </button>
          )}

          {phase === "paused" && (
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setPhase("playing")}
              className="flex items-center justify-center gap-1 rounded-2xl bg-primary py-2.5 text-xs font-bold text-on-primary shadow-md"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Tiếp tục
            </button>
          )}
        </div>

        {/* Center: 10x20 Tetris Matrix with Screen Shake */}
        <div
          className={`relative flex flex-col items-center rounded-3xl bg-zinc-950 p-2 sm:p-3 border-4 border-zinc-800 shadow-2xl overflow-hidden transition-transform ${
            isShaking ? "animate-shake ring-4 ring-google-yellow" : ""
          }`}
        >
          {/* Floating Toast Notice (TETRIS! / COMBO!) */}
          {toastNotice && (
            <div className="absolute top-1/3 z-40 flex items-center justify-center pointer-events-none animate-bounce">
              <div className="rounded-2xl bg-google-yellow border-2 border-white px-4 py-2 font-black text-black shadow-2xl text-sm sm:text-base tracking-wider uppercase">
                {toastNotice}
              </div>
            </div>
          )}

          <div
            className="grid gap-[2px] bg-zinc-900/60 p-1 rounded-2xl border border-zinc-800/80 shadow-inner"
            style={{
              gridTemplateColumns: `repeat(${BOARD_WIDTH}, minmax(0, 1fr))`,
              width: "min(68vw, 280px)",
              height: "min(136vw, 560px)",
            }}
          >
            {board.map((row, r) =>
              row.map((cellColor, c) => {
                let isCurrent = false;
                let activeColor = "";
                if (currentShape.length && currentType) {
                  const pieceRow = r - posY;
                  const pieceCol = c - posX;
                  if (
                    pieceRow >= 0 &&
                    pieceRow < currentShape.length &&
                    pieceCol >= 0 &&
                    pieceCol < currentShape[pieceRow].length &&
                    currentShape[pieceRow][pieceCol]
                  ) {
                    isCurrent = true;
                    activeColor = TETROMINOES[currentType].color;
                  }
                }

                let isGhost = false;
                let ghostColor = "";
                if (!isCurrent && currentShape.length && currentType) {
                  const ghostRow = r - ghostY;
                  const ghostCol = c - posX;
                  if (
                    ghostRow >= 0 &&
                    ghostRow < currentShape.length &&
                    ghostCol >= 0 &&
                    ghostCol < currentShape[ghostRow].length &&
                    currentShape[ghostRow][ghostCol]
                  ) {
                    isGhost = true;
                    ghostColor = TETROMINOES[currentType].color;
                  }
                }

                const color = isCurrent ? activeColor : cellColor;
                const isClearing = clearingRows.includes(r);

                return (
                  <div
                    key={`${r}-${c}`}
                    className={`relative rounded-[4px] transition-colors ${
                      color
                        ? "shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),0_2px_4px_rgba(0,0,0,0.5)] border-t border-l border-white/30 border-b border-r border-black/40"
                        : isGhost
                        ? "border border-dashed opacity-45"
                        : "bg-zinc-900/40 border border-zinc-800/20"
                    } ${isClearing ? "bg-white animate-pulse" : ""}`}
                    style={{
                      backgroundColor: color ? color : "transparent",
                      borderColor: isGhost ? ghostColor : undefined,
                    }}
                  />
                );
              })
            )}
          </div>

          {/* Idle Start Overlay */}
          {phase === "idle" && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-sm p-6 text-center animate-in zoom-in">
              <Boxes className="h-16 w-16 text-google-yellow mb-2 drop-shadow animate-pulse" />
              <h2 className="text-3xl font-black text-white">Tetris</h2>
              <p className="mt-2 text-xs text-zinc-300 max-w-xs leading-relaxed">
                Xếp các khối hình tetromino lấp đầy hàng ngang để ghi điểm. Ăn 4 dòng để tạo TETRIS và bùng nổ pháo hoa!
              </p>

              <div className="mt-3 flex items-center gap-2">
                <span className="rounded-full bg-google-blue/20 border border-google-blue/40 px-3 py-1 text-xs font-bold text-google-blue">
                  Chế độ: {TETRIS_DIFFICULTIES[difficulty].name}
                </span>
              </div>

              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => startGame(difficulty)}
                className="mt-6 flex items-center gap-2 rounded-full bg-google-blue px-8 py-3.5 text-sm font-bold text-white shadow-xl transition-all hover:scale-105 active:scale-95"
              >
                <Play className="h-5 w-5 fill-current" />
                Bắt đầu chơi
              </button>
            </div>
          )}

          {/* Paused Overlay */}
          {phase === "paused" && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-zinc-950/85 backdrop-blur-sm p-6 text-center animate-in fade-in">
              <Pause className="h-14 w-14 text-google-yellow mb-2" />
              <h3 className="text-2xl font-black text-white">Đang Tạm Dừng</h3>
              <p className="mt-1 text-xs text-zinc-400">Nhấn Phím P hoặc nút Tiếp tục để chơi tiếp</p>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setPhase("playing")}
                className="mt-5 flex items-center gap-2 rounded-full bg-primary px-7 py-2.5 text-xs font-bold text-on-primary shadow-lg hover:scale-105"
              >
                <Play className="h-4 w-4 fill-current" />
                Tiếp tục
              </button>
            </div>
          )}

          {/* Game Over Overlay */}
          {phase === "gameover" && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-zinc-950/92 backdrop-blur-sm p-6 text-center animate-in zoom-in">
              <PartyPopper className="h-14 w-14 text-google-yellow mb-2 drop-shadow" />
              <h3 className="text-2xl font-black text-white">Trò Chơi Kết Thúc!</h3>
              <p className="mt-1 text-xs text-zinc-300">
                Chế độ: <strong className="text-foreground">{TETRIS_DIFFICULTIES[difficulty].name}</strong>
              </p>
              <p className="mt-0.5 text-xs text-zinc-300">
                Bạn đã đạt <strong className="text-google-yellow">{score} điểm</strong> và xóa{" "}
                <strong className="text-google-green">{lines} dòng</strong>.
              </p>

              {score >= bestScore && score > 0 && (
                <div className="mt-2.5 rounded-full bg-google-yellow/20 border border-google-yellow/40 px-3.5 py-1 text-xs font-bold text-google-yellow">
                  Kỷ lục điểm số mới!
                </div>
              )}

              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => startGame(difficulty)}
                className="mt-6 flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-xs font-bold text-on-primary shadow-xl transition-all hover:scale-105 active:scale-95"
              >
                <RotateCcw className="h-4 w-4" />
                Chơi lại (SPACE)
              </button>
            </div>
          )}
        </div>

        {/* Right Side Panel: Next Pieces Queue */}
        <div className="flex flex-col gap-3 w-20 sm:w-28">
          <div className="flex flex-col items-center rounded-2xl border border-border bg-surface p-2 sm:p-3 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2">
              Tiếp theo
            </span>
            <div className="flex flex-col gap-3 items-center">
              {nextQueue.slice(0, 3).map((t, idx) => (
                <div key={idx} className="flex h-14 w-14 items-center justify-center border-b border-border/40 pb-1 last:border-b-0">
                  {renderMiniShape(t)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Touch Controls Bar */}
      <div className="flex md:hidden flex-col items-center gap-2 w-full max-w-xs mt-1">
        <div className="flex items-center justify-between w-full gap-2">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={holdPiece}
            className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-surface border border-border py-3 text-xs font-bold text-foreground shadow-sm active:scale-95"
          >
            HOLD
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => rotateCurrent(true)}
            className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-surface border border-border py-3 text-xs font-bold text-foreground shadow-sm active:scale-95"
          >
            <RotateCw className="h-4 w-4 text-google-blue" />
            XOAY
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={hardDrop}
            className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-google-red/10 border border-google-red/30 py-3 text-xs font-bold text-google-red shadow-sm active:scale-95"
          >
            <ChevronsDown className="h-4 w-4" />
            DROP
          </button>
        </div>

        <div className="flex items-center justify-between w-full gap-2">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => moveHorizontal(-1)}
            className="flex-1 flex items-center justify-center rounded-xl bg-surface border border-border py-3.5 shadow-sm active:scale-95"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => softDrop(true)}
            className="flex-1 flex items-center justify-center rounded-xl bg-surface border border-border py-3.5 shadow-sm active:scale-95"
          >
            <ArrowDown className="h-5 w-5 text-foreground" />
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => moveHorizontal(1)}
            className="flex-1 flex items-center justify-center rounded-xl bg-surface border border-border py-3.5 shadow-sm active:scale-95"
          >
            <ArrowRight className="h-5 w-5 text-foreground" />
          </button>
        </div>
      </div>

      {/* Keyboard Controls Guide */}
      <div className="hidden md:flex flex-wrap items-center justify-center gap-3 text-xs text-muted">
        <span><kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono">←</kbd> <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono">→</kbd> Di chuyển</span>
        <span>·</span>
        <span><kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono">↑ / W</kbd> Xoay</span>
        <span>·</span>
        <span><kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono">↓ / S</kbd> Rơi nhanh</span>
        <span>·</span>
        <span><kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono">Space</kbd> Thả tức thì</span>
        <span>·</span>
        <span><kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono">C / Shift</kbd> Giữ khối</span>
      </div>
    </div>
  );
}
