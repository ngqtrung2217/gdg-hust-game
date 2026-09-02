export type OperationType = "add" | "sub" | "mul" | "div" | "unknown" | "mixed";

export interface MathQuestion {
  id: string;
  expression: string;
  correctAnswer: number;
  options: number[];
  tier: number;
}

// Generate realistic distractors / decoys close to the correct answer
export function generateOptions(correct: number): number[] {
  const options = new Set<number>([correct]);
  const deltas = [-1, 1, -2, 2, -10, 10, -5, 5, -3, 3, -11, 11];

  // Shuffle deltas
  for (let i = deltas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deltas[i], deltas[j]] = [deltas[j], deltas[i]];
  }

  for (const d of deltas) {
    const candidate = correct + d;
    if (candidate >= 0 && candidate !== correct) {
      options.add(candidate);
      if (options.size === 4) break;
    }
  }

  // If still less than 4, add random nearby numbers
  let fallback = 1;
  while (options.size < 4) {
    const cand = Math.max(0, correct + (options.size % 2 === 0 ? fallback : -fallback));
    if (cand !== correct) options.add(cand);
    fallback += 2;
  }

  const result = Array.from(options);
  // Shuffle options
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

export function generateQuestion(score: number): MathQuestion {
  // Determine tier based on current score
  let tier = 1;
  if (score >= 2200) tier = 4;
  else if (score >= 1200) tier = 3;
  else if (score >= 500) tier = 2;

  let expression = "";
  let answer = 0;

  if (tier === 1) {
    // Tier 1: Addition & Subtraction (10 - 60)
    const isAdd = Math.random() < 0.6;
    if (isAdd) {
      const a = Math.floor(Math.random() * 45) + 8;
      const b = Math.floor(Math.random() * 45) + 8;
      expression = `${a} + ${b}`;
      answer = a + b;
    } else {
      const a = Math.floor(Math.random() * 60) + 20;
      const b = Math.floor(Math.random() * (a - 8)) + 5;
      expression = `${a} − ${b}`;
      answer = a - b;
    }
  } else if (tier === 2) {
    // Tier 2: Multiplication & Division
    const isMul = Math.random() < 0.6;
    if (isMul) {
      const a = Math.floor(Math.random() * 10) + 3;
      const b = Math.floor(Math.random() * 12) + 3;
      expression = `${a} × ${b}`;
      answer = a * b;
    } else {
      const b = Math.floor(Math.random() * 10) + 3;
      const q = Math.floor(Math.random() * 11) + 2;
      const a = b * q;
      expression = `${a} ÷ ${b}`;
      answer = q;
    }
  } else if (tier === 3) {
    // Tier 3: Unknown X equation (? + 14 = 42)
    const type = Math.floor(Math.random() * 3);
    if (type === 0) {
      const a = Math.floor(Math.random() * 35) + 12;
      const b = Math.floor(Math.random() * 35) + 12;
      const sum = a + b;
      expression = `? + ${b} = ${sum}`;
      answer = a;
    } else if (type === 1) {
      const a = Math.floor(Math.random() * 50) + 25;
      const b = Math.floor(Math.random() * 20) + 6;
      const diff = a - b;
      expression = `${a} − ? = ${diff}`;
      answer = b;
    } else {
      const a = Math.floor(Math.random() * 8) + 3;
      const b = Math.floor(Math.random() * 8) + 3;
      const prod = a * b;
      expression = `${a} × ? = ${prod}`;
      answer = b;
    }
  } else {
    // Tier 4: Mixed 2-step expressions with parenthesis
    const type = Math.floor(Math.random() * 3);
    if (type === 0) {
      const a = Math.floor(Math.random() * 9) + 2;
      const b = Math.floor(Math.random() * 9) + 2;
      const c = Math.floor(Math.random() * 25) + 5;
      expression = `(${a} × ${b}) + ${c}`;
      answer = a * b + c;
    } else if (type === 1) {
      const a = Math.floor(Math.random() * 9) + 3;
      const b = Math.floor(Math.random() * 9) + 3;
      const c = Math.floor(Math.random() * 15) + 2;
      const prod = a * b;
      expression = `${prod} − (${c} × 2)`;
      answer = prod - c * 2;
    } else {
      const a = Math.floor(Math.random() * 20) + 10;
      const b = Math.floor(Math.random() * 6) + 2;
      const c = Math.floor(Math.random() * 7) + 2;
      expression = `${a} + ${b} × ${c}`;
      answer = a + b * c;
    }
  }

  return {
    id: `${Date.now()}-${Math.random()}`,
    expression,
    correctAnswer: answer,
    options: generateOptions(answer),
    tier,
  };
}

export function getMultiplier(streak: number): number {
  if (streak >= 15) return 5;
  if (streak >= 10) return 4;
  if (streak >= 6) return 3;
  if (streak >= 3) return 2;
  return 1;
}
