export const INITIAL_FEN =
  'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1';

// Exact opening position from the reference screenshot (Pháo đầu đối Bình Phong Mã, Xe 9 bình 8)
export const SCREENSHOT_FEN =
  'rnbakab1r/9/1c3nc2/p1p1p1p1p/9/9/P1P1P1P1P/1C2CN3/9/RNBAKAB1R w - - 0 4';

export const PIECE_CHARS = {
  black: {
    r: '車',
    n: '馬',
    b: '象',
    a: '士',
    k: '將',
    c: '砲',
    p: '卒',
  },
  red: {
    r: '俥',
    n: '傌',
    b: '相',
    a: '仕',
    k: '帥',
    c: '炮',
    p: '兵',
  },
};

export const PIECE_VI_NAMES = {
  k: 'Tướng',
  a: 'Sĩ',
  b: 'Tượng',
  n: 'Mã',
  r: 'Xe',
  c: 'Pháo',
  p: 'Tốt',
};

export const PUZZLE_PRESETS = [
  {
    id: 'screenshot-opening',
    name: 'Khai Cuộc Trong Ảnh (Ngũ Thất Pháo đối Bình Phong Mã)',
    subtitle: 'Thế trận kinh điển trong ảnh mẫu Vô Danh Kỳ Hữu',
    difficulty: 'Trung bình',
    fen: SCREENSHOT_FEN,
    turn: 'red',
    description:
      'Đỏ vừa lên Mã 2 tiến 3 và vào Pháo đầu, Đen vừa xuất động Xe 9 bình 8 giữ lộ sườn. Đến lượt Đỏ đi tiếp.',
    hint: 'Đỏ có thể xuất động Xe 1 bình 2 (hoặc Xe 9 tiến 1) để tranh tiên lộ sườn.',
  },
  {
    id: 'khong-minh-ta-tien',
    name: 'Khổng Minh Tá Tiễn',
    subtitle: 'Thế cờ cổ điển sát cục liên hoàn',
    difficulty: 'Dễ',
    fen: '3ak4/4a4/4b4/6N2/9/9/9/4C4/4r4/3K1R3 w - - 0 1',
    turn: 'red',
    description:
      'Đỏ đang bị Xe Đen đe dọa sát cục nhưng có Mã, Pháo và Xe phối hợp chiếu rút liên hoàn.',
    hint: 'Dùng Mã chiếu tướng ở lộ 4 hoặc lộ 6, mở đường cho Xe và Pháo phối hợp.',
  },
  {
    id: 'nhi-ma-phanh-xa',
    name: 'Nhị Mã Phanh Xa',
    subtitle: 'Song Mã công thành phá Sĩ Tượng bền',
    difficulty: 'Trung bình',
    fen: '3akab2/9/3ab4/9/9/9/3NN4/9/4r4/3K1R3 w - - 0 1',
    turn: 'red',
    description:
      'Song Mã giao chân cùng Xe Đỏ tạo thế sát cục tinh diệu trước hàng phòng thủ dày đặc.',
    hint: 'Hãy tận dụng nước chiếu của Mã để ép Tướng Đen lộ mặt hoặc khóa chặt cung Tướng.',
  },
  {
    id: 'don-dao-phu-hoi',
    name: 'Đơn Đao Phó Hội',
    subtitle: 'Quan Vũ một mình một đao phá vây',
    difficulty: 'Khó',
    fen: '3k1ab2/4a4/4b4/3R5/9/9/9/9/3r1p3/4K4 w - - 0 1',
    turn: 'red',
    description:
      'Đỏ chỉ còn độc nhất một chiến Xa nhưng khéo léo lợi dụng mặt Tướng để trừ khử Sĩ Tượng đối phương.',
    hint: 'Chiếu Tướng bắt Sĩ trung tâm hoặc buộc Tướng Đen rời vị trí che chắn.',
  },
  {
    id: 'that-tinh-tu-hoi',
    name: 'Thất Tinh Tụ Hội (Cải Biên)',
    subtitle: 'Vua của các thế cờ giang hồ',
    difficulty: 'Tuyệt đỉnh',
    fen: '4k4/3P1P3/9/9/9/9/9/4C4/3p1p3/3K1R3 w - - 0 1',
    turn: 'red',
    description:
      'Thế cờ tàn giang hồ hiểm hóc, Đỏ đi tiên cần từng nước chính xác tuyệt đối để giành chiến thắng.',
    hint: 'Dùng Tốt lụt hoặc Xe chiếu liên hoàn để giải sát trước khi Tốt Đen ập xuống.',
  },
];

export function cloneBoard(board) {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

export function parseFen(fen) {
  const parts = fen.trim().split(/\s+/);
  const rowsStr = parts[0].split('/');
  const turn = parts[1] === 'b' ? 'black' : 'red';

  const board = Array.from({ length: 10 }, () => Array(9).fill(null));

  for (let r = 0; r < Math.min(10, rowsStr.length); r++) {
    let c = 0;
    for (const ch of rowsStr[r]) {
      if (c >= 9) break;
      if (ch >= '1' && ch <= '9') {
        c += parseInt(ch, 10);
      } else {
        const lower = ch.toLowerCase();
        const side = ch === ch.toUpperCase() ? 'red' : 'black';
        board[r][c] = { type: lower, side };
        c++;
      }
    }
  }

  return { board, turn };
}

export function toFen(board, turn, moveCount = 1) {
  const rows = [];
  for (let r = 0; r < 10; r++) {
    let empty = 0;
    let rowStr = '';
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (!p) {
        empty++;
      } else {
        if (empty > 0) {
          rowStr += empty.toString();
          empty = 0;
        }
        rowStr += p.side === 'red' ? p.type.toUpperCase() : p.type.toLowerCase();
      }
    }
    if (empty > 0) rowStr += empty.toString();
    rows.push(rowStr);
  }
  return `${rows.join('/')} ${turn === 'red' ? 'w' : 'b'} - - 0 ${moveCount}`;
}

export function getPositionKey(board, turn) {
  return toFen(board, turn, 0).split(' ').slice(0, 2).join(' ');
}

export function inBounds(r, c) {
  return r >= 0 && r < 10 && c >= 0 && c < 9;
}

export function inPalace(r, c, side) {
  if (c < 3 || c > 5) return false;
  if (side === 'black') return r >= 0 && r <= 2;
  return r >= 7 && r <= 9;
}

export function getPseudoMoves(board, r, c) {
  const piece = board[r][c];
  if (!piece) return [];

  const { type, side } = piece;
  const moves = [];

  const canLand = (tr, tc) => {
    if (!inBounds(tr, tc)) return false;
    const target = board[tr][tc];
    return !target || target.side !== side;
  };

  if (type === 'k') {
    const dirs = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
    for (const [dr, dc] of dirs) {
      const tr = r + dr;
      const tc = c + dc;
      if (inPalace(tr, tc, side) && canLand(tr, tc)) {
        moves.push({ row: tr, col: tc });
      }
    }
  } else if (type === 'a') {
    const dirs = [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];
    for (const [dr, dc] of dirs) {
      const tr = r + dr;
      const tc = c + dc;
      if (inPalace(tr, tc, side) && canLand(tr, tc)) {
        moves.push({ row: tr, col: tc });
      }
    }
  } else if (type === 'b') {
    const dirs = [
      [-2, -2, -1, -1],
      [-2, 2, -1, 1],
      [2, -2, 1, -1],
      [2, 2, 1, 1],
    ];
    for (const [dr, dc, er, ec] of dirs) {
      const tr = r + dr;
      const tc = c + dc;
      const eyeR = r + er;
      const eyeC = c + ec;
      if (!inBounds(tr, tc)) continue;
      if (side === 'black' && tr > 4) continue;
      if (side === 'red' && tr < 5) continue;
      if (board[eyeR][eyeC] !== null) continue;
      if (canLand(tr, tc)) {
        moves.push({ row: tr, col: tc });
      }
    }
  } else if (type === 'n') {
    const jumps = [
      [-2, -1, -1, 0],
      [-2, 1, -1, 0],
      [2, -1, 1, 0],
      [2, 1, 1, 0],
      [-1, -2, 0, -1],
      [1, -2, 0, -1],
      [-1, 2, 0, 1],
      [1, 2, 0, 1],
    ];
    for (const [dr, dc, lr, lc] of jumps) {
      const tr = r + dr;
      const tc = c + dc;
      const legR = r + lr;
      const legC = c + lc;
      if (!inBounds(tr, tc)) continue;
      if (board[legR][legC] !== null) continue;
      if (canLand(tr, tc)) {
        moves.push({ row: tr, col: tc });
      }
    }
  } else if (type === 'r') {
    const dirs = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
    for (const [dr, dc] of dirs) {
      let tr = r + dr;
      let tc = c + dc;
      while (inBounds(tr, tc)) {
        const target = board[tr][tc];
        if (!target) {
          moves.push({ row: tr, col: tc });
        } else {
          if (target.side !== side) {
            moves.push({ row: tr, col: tc });
          }
          break;
        }
        tr += dr;
        tc += dc;
      }
    }
  } else if (type === 'c') {
    const dirs = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
    for (const [dr, dc] of dirs) {
      let tr = r + dr;
      let tc = c + dc;
      let jumped = false;
      while (inBounds(tr, tc)) {
        const target = board[tr][tc];
        if (!jumped) {
          if (!target) {
            moves.push({ row: tr, col: tc });
          } else {
            jumped = true;
          }
        } else {
          if (target) {
            if (target.side !== side) {
              moves.push({ row: tr, col: tc });
            }
            break;
          }
        }
        tr += dr;
        tc += dc;
      }
    }
  } else if (type === 'p') {
    const forward = side === 'red' ? -1 : 1;
    const crossedRiver = side === 'red' ? r <= 4 : r >= 5;

    if (canLand(r + forward, c)) {
      moves.push({ row: r + forward, col: c });
    }
    if (crossedRiver) {
      if (canLand(r, c - 1)) moves.push({ row: r, col: c - 1 });
      if (canLand(r, c + 1)) moves.push({ row: r, col: c + 1 });
    }
  }

  return moves;
}

export function findGeneral(board, side) {
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (p && p.type === 'k' && p.side === side) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

export function areGeneralsFacing(board) {
  const redGen = findGeneral(board, 'red');
  const blackGen = findGeneral(board, 'black');
  if (!redGen || !blackGen) return false;
  if (redGen.col !== blackGen.col) return false;

  const col = redGen.col;
  const minR = Math.min(redGen.row, blackGen.row);
  const maxR = Math.max(redGen.row, blackGen.row);
  for (let r = minR + 1; r < maxR; r++) {
    if (board[r][col] !== null) return false;
  }
  return true;
}

export function isInCheck(board, side) {
  if (areGeneralsFacing(board)) return true;
  const gen = findGeneral(board, side);
  if (!gen) return true;

  const enemy = side === 'red' ? 'black' : 'red';
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (p && p.side === enemy) {
        const attacks = getPseudoMoves(board, r, c);
        if (attacks.some((m) => m.row === gen.row && m.col === gen.col)) {
          return true;
        }
      }
    }
  }
  return false;
}

export function getLegalMovesForSquare(board, r, c) {
  const piece = board[r][c];
  if (!piece) return [];

  const pseudo = getPseudoMoves(board, r, c);
  const legal = [];

  for (const target of pseudo) {
    const next = cloneBoard(board);
    next[target.row][target.col] = next[r][c];
    next[r][c] = null;

    if (!areGeneralsFacing(next) && !isInCheck(next, piece.side)) {
      legal.push(target);
    }
  }

  return legal;
}

export function getAllLegalMoves(board, side) {
  const result = [];
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (p && p.side === side) {
        const targets = getLegalMovesForSquare(board, r, c);
        for (const to of targets) {
          result.push({
            from: { row: r, col: c },
            to,
            piece: p,
            captured: board[to.row][to.col],
          });
        }
      }
    }
  }
  return result;
}

export function formatVietnameseNotation(piece, from, to) {
  const name = PIECE_VI_NAMES[piece.type];
  const fileFrom = piece.side === 'red' ? 9 - from.col : from.col + 1;
  const fileTo = piece.side === 'red' ? 9 - to.col : to.col + 1;

  if (from.row === to.row) {
    return `${name} ${fileFrom} bình ${fileTo}`;
  }

  const isForward =
    piece.side === 'red' ? to.row < from.row : to.row > from.row;
  const action = isForward ? 'tiến' : 'thoái';

  if (piece.type === 'n' || piece.type === 'a' || piece.type === 'b') {
    return `${name} ${fileFrom} ${action} ${fileTo}`;
  } else {
    const steps = Math.abs(to.row - from.row);
    return `${name} ${fileFrom} ${action} ${steps}`;
  }
}

export function applyMove(board, from, to, moveCount = 1) {
  const piece = board[from.row][from.col];
  if (!piece) {
    throw new Error('Không có quân cờ tại vị trí xuất phát');
  }
  const captured = board[to.row][to.col];
  const fenBefore = toFen(board, piece.side, moveCount);

  const nextBoard = cloneBoard(board);
  nextBoard[to.row][to.col] = piece;
  nextBoard[from.row][from.col] = null;

  const nextTurn = piece.side === 'red' ? 'black' : 'red';
  const fenAfter = toFen(nextBoard, nextTurn, moveCount + 1);
  const notation = formatVietnameseNotation(piece, from, to);

  return {
    nextBoard,
    nextTurn,
    move: {
      from,
      to,
      piece,
      captured,
      notation,
      fenBefore,
      fenAfter,
    },
  };
}

