export type CellState = "hidden" | "revealed" | "flagged";

export interface Cell {
  mine: boolean;
  adjacent: number;
  state: CellState;
}

export type Board = Cell[][];

export interface Difficulty {
  name: string;
  rows: number;
  cols: number;
  mines: number;
}

export const DIFFICULTIES: Difficulty[] = [
  { name: "Dễ", rows: 9, cols: 9, mines: 10 },
  { name: "Trung bình", rows: 16, cols: 16, mines: 40 },
  { name: "Khó", rows: 16, cols: 30, mines: 99 },
];

export function createEmptyBoard(rows: number, cols: number): Board {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      mine: false,
      adjacent: 0,
      state: "hidden" as CellState,
    }))
  );
}

export function countAdjacent(board: Board, row: number, col: number): number {
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (
        r >= 0 &&
        r < board.length &&
        c >= 0 &&
        c < board[0].length &&
        board[r][c].mine
      ) {
        count++;
      }
    }
  }
  return count;
}

export function placeMines(
  board: Board,
  mines: number,
  safeRow: number,
  safeCol: number
): Board {
  const rows = board.length;
  const cols = board[0].length;
  const positions: [number, number][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r === safeRow && c === safeCol) continue;
      positions.push([r, c]);
    }
  }
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  const next = board.map((row) => row.map((cell) => ({ ...cell })));
  for (let i = 0; i < mines; i++) {
    const [r, c] = positions[i];
    next[r][c].mine = true;
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      next[r][c].adjacent = countAdjacent(next, r, c);
    }
  }
  return next;
}

export function revealCell(board: Board, row: number, col: number): Board {
  const next = board.map((rowArr) => rowArr.map((cell) => ({ ...cell })));
  const cell = next[row][col];
  if (cell.state === "flagged" || cell.state === "revealed") return next;
  if (cell.mine) {
    cell.state = "revealed";
    return next;
  }
  const stack: [number, number][] = [[row, col]];
  while (stack.length > 0) {
    const [r, c] = stack.pop()!;
    const cur = next[r][c];
    if (cur.state === "revealed" || cur.state === "flagged") continue;
    cur.state = "revealed";
    if (cur.adjacent === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < next.length && nc >= 0 && nc < next[0].length) {
            stack.push([nr, nc]);
          }
        }
      }
    }
  }
  return next;
}

export function toggleFlag(board: Board, row: number, col: number): Board {
  const next = board.map((rowArr) => rowArr.map((cell) => ({ ...cell })));
  const cell = next[row][col];
  if (cell.state === "revealed") return next;
  cell.state = cell.state === "flagged" ? "hidden" : "flagged";
  return next;
}

export function revealAllMines(board: Board): Board {
  return board.map((rowArr) =>
    rowArr.map((cell) =>
      cell.mine ? { ...cell, state: "revealed" as CellState } : cell
    )
  );
}

export function checkWin(board: Board): boolean {
  return board.every((row) =>
    row.every((cell) => cell.mine || cell.state === "revealed")
  );
}

export function countFlags(board: Board): number {
  return board.reduce(
    (sum, row) => sum + row.filter((cell) => cell.state === "flagged").length,
    0
  );
}
