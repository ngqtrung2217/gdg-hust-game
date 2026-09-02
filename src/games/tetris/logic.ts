export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export type TetrominoType = "I" | "J" | "L" | "O" | "S" | "T" | "Z";

export interface TetrominoDef {
  type: TetrominoType;
  shape: number[][];
  color: string;
  borderColor: string;
  glowColor: string;
}

export const TETROMINOES: Record<TetrominoType, TetrominoDef> = {
  I: {
    type: "I",
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: "#4285f4", // Google Blue
    borderColor: "#93c5fd",
    glowColor: "rgba(66, 133, 244, 0.6)",
  },
  J: {
    type: "J",
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "#1a73e8", // Deep Google Blue
    borderColor: "#60a5fa",
    glowColor: "rgba(26, 115, 232, 0.6)",
  },
  L: {
    type: "L",
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "#f9ab00", // Google Amber
    borderColor: "#fde047",
    glowColor: "rgba(249, 171, 0, 0.6)",
  },
  O: {
    type: "O",
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: "#fbbc04", // Google Yellow
    borderColor: "#fef08a",
    glowColor: "rgba(251, 188, 4, 0.6)",
  },
  S: {
    type: "S",
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: "#34a853", // Google Green
    borderColor: "#86efac",
    glowColor: "rgba(52, 168, 83, 0.6)",
  },
  T: {
    type: "T",
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "#a142f4", // Google Purple
    borderColor: "#d8b4fe",
    glowColor: "rgba(161, 66, 244, 0.6)",
  },
  Z: {
    type: "Z",
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: "#ea4335", // Google Red
    borderColor: "#fca5a5",
    glowColor: "rgba(234, 67, 53, 0.6)",
  },
};

export type BoardMatrix = (string | null)[][];

export function createEmptyBoard(): BoardMatrix {
  return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));
}

// 7-Bag Randomizer
export function generateBag(): TetrominoType[] {
  const pieces: TetrominoType[] = ["I", "J", "L", "O", "S", "T", "Z"];
  for (let i = pieces.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
  }
  return pieces;
}

// Rotate matrix 90 degrees
export function rotateMatrix(matrix: number[][], clockwise = true): number[][] {
  const n = matrix.length;
  const result = Array.from({ length: n }, () => Array(n).fill(0));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (clockwise) {
        result[c][n - 1 - r] = matrix[r][c];
      } else {
        result[n - 1 - c][r] = matrix[r][c];
      }
    }
  }
  return result;
}

// Check if position is valid
export function isValidMove(
  board: BoardMatrix,
  shape: number[][],
  posX: number,
  posY: number
): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const targetX = posX + c;
        const targetY = posY + r;

        // Out of horizontal bounds
        if (targetX < 0 || targetX >= BOARD_WIDTH) return false;
        // Out of bottom bounds
        if (targetY >= BOARD_HEIGHT) return false;
        // Above top is ok for spawn, but check if cell already occupied
        if (targetY >= 0 && board[targetY][targetX] !== null) return false;
      }
    }
  }
  return true;
}

// Rotate with wall & floor kicks (try standard, then horizontal and vertical kicks)
export function tryRotate(
  board: BoardMatrix,
  currentShape: number[][],
  posX: number,
  posY: number,
  clockwise = true
): { newShape: number[][]; newX: number; newY: number } | null {
  const rotated = rotateMatrix(currentShape, clockwise);
  const kicks = [
    [0, 0],
    [-1, 0],
    [1, 0],
    [0, -1],
    [-1, -1],
    [1, -1],
    [0, -2],
    [-1, -2],
    [1, -2],
    [-2, 0],
    [2, 0],
  ];

  for (const [kx, ky] of kicks) {
    if (isValidMove(board, rotated, posX + kx, posY + ky)) {
      return { newShape: rotated, newX: posX + kx, newY: posY + ky };
    }
  }
  return null;
}

// Calculate Ghost piece position (hard drop preview)
export function getGhostY(
  board: BoardMatrix,
  shape: number[][],
  posX: number,
  startY: number
): number {
  let y = startY;
  while (isValidMove(board, shape, posX, y + 1)) {
    y++;
  }
  return y;
}

// Lock piece into board
export function lockPiece(
  board: BoardMatrix,
  shape: number[][],
  posX: number,
  posY: number,
  color: string
): BoardMatrix {
  const newBoard = board.map((row) => [...row]);
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const targetY = posY + r;
        const targetX = posX + c;
        if (targetY >= 0 && targetY < BOARD_HEIGHT && targetX >= 0 && targetX < BOARD_WIDTH) {
          newBoard[targetY][targetX] = color;
        }
      }
    }
  }
  return newBoard;
}

// Clear completed lines
export function clearLines(board: BoardMatrix): {
  newBoard: BoardMatrix;
  clearedLines: number;
} {
  const remainingRows = board.filter((row) => row.some((cell) => cell === null));
  const clearedLines = BOARD_HEIGHT - remainingRows.length;

  const emptyRows = Array.from({ length: clearedLines }, () => Array(BOARD_WIDTH).fill(null));
  const newBoard = [...emptyRows, ...remainingRows];

  return { newBoard, clearedLines };
}

// Difficulty modes
export type TetrisDifficulty = "normal" | "hard" | "master";

export interface DifficultyConfig {
  id: TetrisDifficulty;
  name: string;
  startLevel: number;
  baseInterval: number;
  minInterval: number;
  decayPerLevel: number;
  scoreMultiplier: number;
  badgeColor: string;
}

export const TETRIS_DIFFICULTIES: Record<TetrisDifficulty, DifficultyConfig> = {
  normal: {
    id: "normal",
    name: "Bình thường",
    startLevel: 1,
    baseInterval: 480, // Snappy 480ms start instead of 800ms
    minInterval: 80,
    decayPerLevel: 40,
    scoreMultiplier: 1.0,
    badgeColor: "text-google-blue border-google-blue/30 bg-google-blue/10",
  },
  hard: {
    id: "hard",
    name: "Thử thách (Khó)",
    startLevel: 5,
    baseInterval: 260, // Intense 260ms
    minInterval: 50,
    decayPerLevel: 30,
    scoreMultiplier: 1.5,
    badgeColor: "text-google-yellow border-google-yellow/30 bg-google-yellow/10",
  },
  master: {
    id: "master",
    name: "Siêu tốc (Master)",
    startLevel: 10,
    baseInterval: 130, // Lightning 130ms!
    minInterval: 35,
    decayPerLevel: 15,
    scoreMultiplier: 2.0,
    badgeColor: "text-google-red border-google-red/30 bg-google-red/10",
  },
};

// Calculate drop speed based on level and difficulty
export function getDropInterval(level: number, diff: TetrisDifficulty = "normal"): number {
  const config = TETRIS_DIFFICULTIES[diff];
  const levelDiff = Math.max(0, level - config.startLevel);
  return Math.max(config.minInterval, config.baseInterval - levelDiff * config.decayPerLevel);
}

// Calculate line clear score with difficulty multiplier
export function getLineClearScore(lines: number, level: number, diff: TetrisDifficulty = "normal"): number {
  const baseScores = [0, 100, 300, 500, 800]; // Single, Double, Triple, Tetris!
  const multiplier = TETRIS_DIFFICULTIES[diff]?.scoreMultiplier ?? 1.0;
  return Math.round((baseScores[lines] ?? 0) * level * multiplier);
}
