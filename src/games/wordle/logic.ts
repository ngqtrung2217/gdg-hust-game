import { ANSWER_WORDS, VALID_WORDS } from "./words";

export type LetterState = "correct" | "present" | "absent" | "empty";

export interface GuessResult {
  letters: { char: string; state: LetterState }[];
}

export type GameMode = "daily" | "unlimited";

export const ROWS = 6;
export const COLS = 5;

export function isValidWord(word: string): boolean {
  const w = word.toLowerCase();
  return ANSWER_WORDS.includes(w) || VALID_WORDS.includes(w);
}

export function getDailyWord(date: Date = new Date()): string {
  const start = new Date(2024, 0, 1);
  const day = Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
      Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) /
      86400000
  );
  return ANSWER_WORDS[day % ANSWER_WORDS.length];
}

export function getRandomWord(): string {
  return ANSWER_WORDS[Math.floor(Math.random() * ANSWER_WORDS.length)];
}

export function evaluateGuess(guess: string, target: string): LetterState[] {
  const g = guess.toLowerCase();
  const t = target.toLowerCase();
  const result: LetterState[] = Array(COLS).fill("absent");
  const remaining: Record<string, number> = {};

  for (let i = 0; i < COLS; i++) {
    if (g[i] === t[i]) {
      result[i] = "correct";
    } else {
      remaining[t[i]] = (remaining[t[i]] ?? 0) + 1;
    }
  }

  for (let i = 0; i < COLS; i++) {
    if (result[i] === "correct") continue;
    const char = g[i];
    if (remaining[char] > 0) {
      result[i] = "present";
      remaining[char]--;
    }
  }

  return result;
}

export function getDailyNumber(date: Date = new Date()): number {
  const start = new Date(2024, 0, 1);
  return Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
      Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) /
      86400000
  );
}
