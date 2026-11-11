import {
  cloneBoard,
  getAllLegalMoves,
  isInCheck,
} from './xiangqiEngine.js';

const PIECE_VALUES = {
  k: 10000,
  r: 950,
  c: 480,
  n: 430,
  b: 210,
  a: 210,
  p: 120,
};

const PAWN_BONUS = [
  [10, 20, 30, 40, 45, 40, 30, 20, 10],
  [35, 50, 65, 80, 90, 80, 65, 50, 35],
  [30, 45, 60, 75, 80, 75, 60, 45, 30],
  [25, 35, 50, 60, 65, 60, 50, 35, 25],
  [18, 25, 35, 45, 50, 45, 35, 25, 18],
  [0, 0, 5, 0, 8, 0, 5, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
];

const HORSE_BONUS = [
  [5, 10, 15, 10, 5, 10, 15, 10, 5],
  [10, 20, 35, 30, 20, 30, 35, 20, 10],
  [15, 30, 45, 50, 40, 50, 45, 30, 15],
  [15, 35, 45, 50, 45, 50, 45, 35, 15],
  [10, 25, 35, 40, 35, 40, 35, 25, 10],
  [8, 20, 30, 32, 30, 32, 30, 20, 8],
  [5, 15, 22, 25, 22, 25, 22, 15, 5],
  [5, 10, 18, 15, 12, 15, 18, 10, 5],
  [0, 5, 10, 8, -5, 8, 10, 5, 0],
  [0, -5, 5, 5, 0, 5, 5, -5, 0],
];

const CHARIOT_BONUS = [
  [20, 25, 25, 30, 35, 30, 25, 25, 20],
  [25, 35, 35, 45, 50, 45, 35, 35, 25],
  [20, 30, 30, 40, 42, 40, 30, 30, 20],
  [20, 30, 30, 38, 40, 38, 30, 30, 20],
  [18, 28, 28, 35, 38, 35, 28, 28, 18],
  [15, 25, 25, 30, 32, 30, 25, 25, 15],
  [10, 20, 20, 25, 25, 25, 20, 20, 10],
  [10, 18, 18, 22, 22, 22, 18, 18, 10],
  [12, 22, 18, 25, 20, 25, 18, 22, 12],
  [5, 18, 12, 20, 15, 20, 12, 18, 5],
];

const CANNON_BONUS = [
  [15, 18, 20, 15, 12, 15, 20, 18, 15],
  [15, 20, 22, 25, 28, 25, 22, 20, 15],
  [15, 20, 25, 30, 35, 30, 25, 20, 15],
  [10, 15, 20, 28, 35, 28, 20, 15, 10],
  [8, 12, 18, 25, 32, 25, 18, 12, 8],
  [8, 12, 16, 22, 30, 22, 16, 12, 8],
  [5, 10, 12, 18, 25, 18, 12, 10, 5],
  [10, 22, 15, 20, 32, 20, 15, 22, 10],
  [5, 10, 8, 10, 12, 10, 8, 10, 5],
  [0, 5, 5, 8, 10, 8, 5, 5, 0],
];

function getPositionalBonus(type, side, r, c) {
  const rowIdx = side === 'red' ? r : 9 - r;
  switch (type) {
    case 'p':
      return PAWN_BONUS[rowIdx][c];
    case 'n':
      return HORSE_BONUS[rowIdx][c];
    case 'r':
      return CHARIOT_BONUS[rowIdx][c];
    case 'c':
      return CANNON_BONUS[rowIdx][c];
    case 'a':
    case 'b':
      return c === 4 ? 15 : 8;
    case 'k':
      return rowIdx === 9 && c === 4 ? 20 : 5;
    default:
      return 0;
  }
}

export function evaluateBoard(board, aiSide) {
  let score = 0;

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (!p) continue;
      const val = PIECE_VALUES[p.type] + getPositionalBonus(p.type, p.side, r, c);
      if (p.side === aiSide) {
        score += val;
      } else {
        score -= val;
      }
    }
  }

  return score;
}

export function findBestMove(board, side, difficulty = 2) {
  const legalMoves = getAllLegalMoves(board, side);
  if (legalMoves.length === 0) return null;

  const depthMap = {
    1: 2,
    2: 3,
    3: 3,
    4: 4,
  };
  const maxDepth = depthMap[difficulty] || 3;

  legalMoves.sort((a, b) => {
    const scoreA =
      (a.captured ? PIECE_VALUES[a.captured.type] * 10 - PIECE_VALUES[a.piece.type] : 0) +
      (4 - Math.abs(4 - a.to.col)) * 3;
    const scoreB =
      (b.captured ? PIECE_VALUES[b.captured.type] * 10 - PIECE_VALUES[b.piece.type] : 0) +
      (4 - Math.abs(4 - b.to.col)) * 3;
    return scoreB - scoreA;
  });

  let bestScore = -Infinity;
  let bestMoves = [{ from: legalMoves[0].from, to: legalMoves[0].to }];

  let alpha = -Infinity;
  const beta = Infinity;
  const opponent = side === 'red' ? 'black' : 'red';

  for (const m of legalMoves) {
    const next = cloneBoard(board);
    next[m.to.row][m.to.col] = next[m.from.row][m.from.col];
    next[m.from.row][m.from.col] = null;

    const checkBonus = isInCheck(next, opponent) ? 35 : 0;
    const score =
      minimax(next, maxDepth - 1, alpha, beta, false, side) +
      checkBonus +
      (difficulty === 1 ? Math.random() * 35 - 17 : 0);

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [{ from: m.from, to: m.to }];
    } else if (Math.abs(score - bestScore) <= 4) {
      bestMoves.push({ from: m.from, to: m.to });
    }

    if (score > alpha) {
      alpha = score;
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

function minimax(board, depth, alpha, beta, isMaximizing, aiSide) {
  if (depth === 0) {
    return evaluateBoard(board, aiSide);
  }

  const currentSide = isMaximizing
    ? aiSide
    : aiSide === 'red'
    ? 'black'
    : 'red';
  const moves = getAllLegalMoves(board, currentSide);

  if (moves.length === 0) {
    return isMaximizing ? -90000 - depth * 100 : 90000 + depth * 100;
  }

  moves.sort((a, b) => {
    const valA = a.captured ? PIECE_VALUES[a.captured.type] : 0;
    const valB = b.captured ? PIECE_VALUES[b.captured.type] : 0;
    return valB - valA;
  });

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const m of moves) {
      const next = cloneBoard(board);
      next[m.to.row][m.to.col] = next[m.from.row][m.from.col];
      next[m.from.row][m.from.col] = null;

      const evalScore = minimax(next, depth - 1, alpha, beta, false, aiSide);
      if (evalScore > maxEval) maxEval = evalScore;
      if (evalScore > alpha) alpha = evalScore;
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const m of moves) {
      const next = cloneBoard(board);
      next[m.to.row][m.to.col] = next[m.from.row][m.from.col];
      next[m.from.row][m.from.col] = null;

      const evalScore = minimax(next, depth - 1, alpha, beta, true, aiSide);
      if (evalScore < minEval) minEval = evalScore;
      if (evalScore < beta) beta = evalScore;
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

