export type Disc = "B" | "R"; // B = Google Blue (P1), R = Google Red (P2 / AI)
export type Cell = Disc | null;
export type Board = Cell[][];

export const BOARD_SIZE = 8;

export const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
] as const;

// Positional weight matrix for 8x8 Othello AI evaluation
export const POSITION_WEIGHTS = [
  [ 120, -20,  20,   5,   5,  20, -20, 120],
  [ -20, -40,  -5,  -5,  -5,  -5, -40, -20],
  [  20,  -5,  15,   3,   3,  15,  -5,  20],
  [   5,  -5,   3,   3,   3,   3,  -5,   5],
  [   5,  -5,   3,   3,   3,   3,  -5,   5],
  [  20,  -5,  15,   3,   3,  15,  -5,  20],
  [ -20, -40,  -5,  -5,  -5,  -5, -40, -20],
  [ 120, -20,  20,   5,   5,  20, -20, 120],
];

export function createInitialBoard(): Board {
  const board: Board = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null)
  );
  // Standard initial configuration
  const mid = BOARD_SIZE / 2;
  board[mid - 1][mid - 1] = "R";
  board[mid - 1][mid] = "B";
  board[mid][mid - 1] = "B";
  board[mid][mid] = "R";
  return board;
}

export function opponentOf(player: Disc): Disc {
  return player === "B" ? "R" : "B";
}

export function isValidCoordinate(r: number, c: number): boolean {
  return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
}

export function getFlipsForDirection(
  board: Board,
  row: number,
  col: number,
  player: Disc,
  dr: number,
  dc: number
): [number, number][] {
  const opp = opponentOf(player);
  const potential: [number, number][] = [];
  let r = row + dr;
  let c = col + dc;

  while (isValidCoordinate(r, c) && board[r][c] === opp) {
    potential.push([r, c]);
    r += dr;
    c += dc;
  }

  if (isValidCoordinate(r, c) && board[r][c] === player && potential.length > 0) {
    return potential;
  }

  return [];
}

export function getFlips(board: Board, row: number, col: number, player: Disc): [number, number][] {
  if (board[row][col] !== null) return [];

  const allFlips: [number, number][] = [];
  for (const [dr, dc] of DIRECTIONS) {
    const flips = getFlipsForDirection(board, row, col, player, dr, dc);
    for (const pos of flips) {
      allFlips.push(pos);
    }
  }
  return allFlips;
}

export function isValidMove(board: Board, row: number, col: number, player: Disc): boolean {
  if (board[row][col] !== null) return false;
  for (const [dr, dc] of DIRECTIONS) {
    if (getFlipsForDirection(board, row, col, player, dr, dc).length > 0) {
      return true;
    }
  }
  return false;
}

export function getValidMoves(board: Board, player: Disc): [number, number][] {
  const moves: [number, number][] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (isValidMove(board, r, c, player)) {
        moves.push([r, c]);
      }
    }
  }
  return moves;
}

export function makeMove(
  board: Board,
  row: number,
  col: number,
  player: Disc
): { nextBoard: Board; flips: [number, number][] } {
  const flips = getFlips(board, row, col, player);
  if (flips.length === 0) {
    return { nextBoard: board, flips: [] };
  }

  const nextBoard = board.map((r) => [...r]);
  nextBoard[row][col] = player;
  for (const [fr, fc] of flips) {
    nextBoard[fr][fc] = player;
  }

  return { nextBoard, flips };
}

export function countDiscs(board: Board): { B: number; R: number; empty: number } {
  let B = 0;
  let R = 0;
  let empty = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = board[r][c];
      if (cell === "B") B++;
      else if (cell === "R") R++;
      else empty++;
    }
  }
  return { B, R, empty };
}

export function isGameOver(board: Board): boolean {
  const { empty } = countDiscs(board);
  if (empty === 0) return true;
  return getValidMoves(board, "B").length === 0 && getValidMoves(board, "R").length === 0;
}

// AI Heuristic Evaluation
export function evaluateBoard(board: Board, aiPlayer: Disc): number {
  const opp = opponentOf(aiPlayer);
  let posScore = 0;
  let myDiscs = 0;
  let oppDiscs = 0;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = board[r][c];
      if (cell === aiPlayer) {
        myDiscs++;
        posScore += POSITION_WEIGHTS[r][c];
      } else if (cell === opp) {
        oppDiscs++;
        posScore -= POSITION_WEIGHTS[r][c];
      }
    }
  }

  const parityScore = myDiscs + oppDiscs === 0 ? 0 : ((myDiscs - oppDiscs) / (myDiscs + oppDiscs)) * 20;

  // Corner stability bonus
  const corners = [
    [0, 0], [0, 7], [7, 0], [7, 7]
  ];
  let cornerScore = 0;
  for (const [cr, cc] of corners) {
    if (board[cr][cc] === aiPlayer) cornerScore += 30;
    else if (board[cr][cc] === opp) cornerScore -= 30;
  }

  // Mobility
  const myMobility = getValidMoves(board, aiPlayer).length;
  const oppMobility = getValidMoves(board, opp).length;
  const mobilityScore = myMobility + oppMobility === 0 ? 0 : (myMobility - oppMobility) * 10;

  return posScore + cornerScore + mobilityScore + parityScore;
}

// Minimax with Alpha-Beta Pruning
function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiPlayer: Disc
): number {
  const currentPlayer = isMaximizing ? aiPlayer : opponentOf(aiPlayer);
  const moves = getValidMoves(board, currentPlayer);

  if (depth === 0 || isGameOver(board)) {
    return evaluateBoard(board, aiPlayer);
  }

  if (moves.length === 0) {
    // Pass turn
    return minimax(board, depth - 1, alpha, beta, !isMaximizing, aiPlayer);
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const [r, c] of moves) {
      const { nextBoard } = makeMove(board, r, c, aiPlayer);
      const evalScore = minimax(nextBoard, depth - 1, alpha, beta, false, aiPlayer);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    const opp = opponentOf(aiPlayer);
    for (const [r, c] of moves) {
      const { nextBoard } = makeMove(board, r, c, opp);
      const evalScore = minimax(nextBoard, depth - 1, alpha, beta, true, aiPlayer);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export type AIDifficulty = "easy" | "medium" | "hard";

export function getAIMove(board: Board, aiPlayer: Disc, difficulty: AIDifficulty): [number, number] | null {
  const validMoves = getValidMoves(board, aiPlayer);
  if (validMoves.length === 0) return null;

  if (difficulty === "easy") {
    // 60% random move, 40% greedy move
    if (Math.random() < 0.6) {
      return validMoves[Math.floor(Math.random() * validMoves.length)];
    }
  }

  const depth = difficulty === "easy" ? 1 : difficulty === "medium" ? 3 : 5;

  let bestScore = -Infinity;
  let bestMove = validMoves[0];

  for (const [r, c] of validMoves) {
    const { nextBoard } = makeMove(board, r, c, aiPlayer);
    const score = minimax(nextBoard, depth - 1, -Infinity, Infinity, false, aiPlayer);
    if (score > bestScore) {
      bestScore = score;
      bestMove = [r, c];
    }
  }

  return bestMove;
}
