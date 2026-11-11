import React, { useState, useMemo } from 'react';
import {
  Eraser,
  Trash2,
  RotateCcw,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Bot,
  Layers,
  Download,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { XiangqiBoard } from './XiangqiBoard.jsx';
import {
  PIECE_CHARS,
  PIECE_VI_NAMES,
  INITIAL_FEN,
  parseFen,
  toFen,
  cloneBoard,
  findGeneral,
  areGeneralsFacing,
} from '../engine/xiangqiEngine.js';
import { soundFX } from '../utils/sound.js';

export const PIECE_LIMITS = {
  k: 1, // Tướng
  a: 2, // Sĩ
  b: 2, // Tượng
  r: 2, // Xe
  c: 2, // Pháo
  n: 2, // Mã
  p: 5, // Tốt
};

const PIECE_ORDER = ['k', 'a', 'b', 'r', 'c', 'n', 'p'];

export function isLegalPlacement(type, side, r, c) {
  if (r < 0 || r > 9 || c < 0 || c > 8) return false;

  // General / Tướng (Must stay inside Palace)
  if (type === 'k') {
    if (c < 3 || c > 5) return false;
    return side === 'red' ? r >= 7 && r <= 9 : r >= 0 && r <= 2;
  }

  // Advisor / Sĩ (Must stay at the 5 palace diagonal intersections)
  if (type === 'a') {
    if (side === 'red') {
      return (
        (r === 7 && (c === 3 || c === 5)) ||
        (r === 8 && c === 4) ||
        (r === 9 && (c === 3 || c === 5))
      );
    } else {
      return (
        (r === 0 && (c === 3 || c === 5)) ||
        (r === 1 && c === 4) ||
        (r === 2 && (c === 3 || c === 5))
      );
    }
  }

  // Elephant / Tượng (Cannot cross river & must be on 7 fixed intersection spots)
  if (type === 'b') {
    if (side === 'red') {
      return (
        (r === 9 && (c === 2 || c === 6)) ||
        (r === 7 && (c === 0 || c === 4 || c === 8)) ||
        (r === 5 && (c === 2 || c === 6))
      );
    } else {
      return (
        (r === 0 && (c === 2 || c === 6)) ||
        (r === 2 && (c === 0 || c === 4 || c === 8)) ||
        (r === 4 && (c === 2 || c === 6))
      );
    }
  }

  // Soldier / Tốt / Binh
  if (type === 'p') {
    if (side === 'red') {
      if (r > 6) return false; // Pawns cannot be behind initial rank (rows 7, 8, 9)
      if (r >= 5 && r <= 6) {
        // Before river (rows 5, 6), pawns can only be at initial columns 0, 2, 4, 6, 8
        return c % 2 === 0;
      }
      return true; // Across river, can be anywhere
    } else {
      if (r < 3) return false; // Pawns cannot be behind initial rank (rows 0, 1, 2)
      if (r >= 3 && r <= 4) {
        return c % 2 === 0;
      }
      return true;
    }
  }

  // Chariot (r), Cannon (c), Horse (n) can be placed anywhere on the board
  return true;
}

export function BoardEditor({ onPlayWithAi, showToast }) {
  // Empty board by default, matching screenshot
  const [board, setBoard] = useState(() =>
    Array.from({ length: 10 }, () => Array(9).fill(null))
  );

  // Selected piece from tray: defaults to Red King { side: 'red', type: 'k' }, matching screenshot!
  const [selectedTool, setSelectedTool] = useState({ side: 'red', type: 'k' });
  const [eraserMode, setEraserMode] = useState(false);
  const [turn, setTurn] = useState('red');
  const [flipped, setFlipped] = useState(false);

  // Accordion & FEN tools
  const [showFenAccordion, setShowFenAccordion] = useState(false);
  const [customFenInput, setCustomFenInput] = useState('');
  const [copied, setCopied] = useState(false);

  // Piece counts on current board
  const pieceCounts = useMemo(() => {
    const counts = {
      red: { k: 0, a: 0, b: 0, r: 0, c: 0, n: 0, p: 0 },
      black: { k: 0, a: 0, b: 0, r: 0, c: 0, n: 0, p: 0 },
    };
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        const piece = board[r][c];
        if (piece && counts[piece.side]?.[piece.type] !== undefined) {
          counts[piece.side][piece.type]++;
        }
      }
    }
    return counts;
  }, [board]);

  // Current FEN string
  const currentFen = useMemo(() => {
    return toFen(board, turn, 1);
  }, [board, turn]);

  // Calculate placement indicator dots for the selected piece
  const placementDots = useMemo(() => {
    if (eraserMode || !selectedTool) return [];
    const dots = [];
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        if (isLegalPlacement(selectedTool.type, selectedTool.side, r, c)) {
          dots.push({ row: r, col: c });
        }
      }
    }
    return dots;
  }, [eraserMode, selectedTool]);

  // Select a piece from tray
  const handleSelectPiece = (side, type) => {
    soundFX.playSelect();
    setEraserMode(false);
    setSelectedTool({ side, type });
  };

  // Toggle eraser mode
  const handleToggleEraser = () => {
    soundFX.playSelect();
    setEraserMode((prev) => !prev);
  };

  // Clear entire board to empty
  const handleClearBoard = () => {
    soundFX.playDoorLeave();
    setBoard(Array.from({ length: 10 }, () => Array(9).fill(null)));
    if (showToast) {
      showToast({
        type: 'info',
        title: 'BÀN CỜ TRỐNG',
        message: 'Đã xóa toàn bộ quân cờ trên bàn.',
      });
    }
  };

  // Reset to standard starting position
  const handleResetStandard = () => {
    soundFX.playBattleStart();
    const parsed = parseFen(INITIAL_FEN);
    setBoard(parsed.board);
    setTurn('red');
    if (showToast) {
      showToast({
        type: 'success',
        title: 'BÀN CỜ CHUẨN',
        message: 'Đã nạp thế cờ khai cuộc tiêu chuẩn 32 quân.',
      });
    }
  };

  // Click on a board square
  const handleSquareClick = (r, c) => {
    // 1. Eraser Mode: Remove piece
    if (eraserMode) {
      if (board[r][c]) {
        const next = cloneBoard(board);
        next[r][c] = null;
        setBoard(next);
        soundFX.playCapture();
      }
      return;
    }

    // 2. Piece Placement
    if (selectedTool) {
      const { side, type } = selectedTool;

      if (!isLegalPlacement(type, side, r, c)) {
        if (showToast) {
          showToast({
            type: 'warning',
            title: 'VỊ TRÍ KHÔNG HỢP LỆ',
            message: `Quân ${PIECE_VI_NAMES[type]} không thể đặt tại vị trí này theo luật cờ tướng.`,
          });
        }
        return;
      }

      const next = cloneBoard(board);

      // If placing King, remove any existing King of the same side (only 1 King allowed)
      if (type === 'k') {
        for (let row = 0; row < 10; row++) {
          for (let col = 0; col < 9; col++) {
            if (next[row][col]?.type === 'k' && next[row][col]?.side === side) {
              next[row][col] = null;
            }
          }
        }
      } else {
        // Check maximum pieces limit
        const currentCount = pieceCounts[side][type];
        const existingAtSpot = next[r][c];
        const isSamePiece =
          existingAtSpot?.side === side && existingAtSpot?.type === type;

        if (!isSamePiece && currentCount >= PIECE_LIMITS[type]) {
          if (showToast) {
            showToast({
              type: 'warning',
              title: 'ĐÃ ĐẠT GIỚI HẠN',
              message: `Đã có tối đa ${PIECE_LIMITS[type]} quân ${PIECE_VI_NAMES[type]} ${side === 'red' ? 'Đỏ' : 'Đen'} trên bàn cờ.`,
            });
          }
          return;
        }
      }

      next[r][c] = { type, side };
      setBoard(next);
      soundFX.playMove();
    }
  };

  // Right-click on a board square to quickly delete piece
  const handleSquareRightClick = (r, c) => {
    if (board[r][c]) {
      const next = cloneBoard(board);
      next[r][c] = null;
      setBoard(next);
      soundFX.playCapture();
    }
  };

  // Copy FEN string
  const handleCopyFen = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(currentFen);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (showToast) {
        showToast({
          type: 'success',
          title: 'ĐÃ SAO CHÉP FEN',
          message: 'Chuỗi FEN đã được lưu vào khay nhớ tạm.',
        });
      }
    }
  };

  // Apply imported FEN
  const handleApplyFen = () => {
    if (!customFenInput.trim()) return;
    try {
      const parsed = parseFen(customFenInput.trim());
      setBoard(parsed.board);
      setTurn(parsed.turn);
      soundFX.playMove();
      if (showToast) {
        showToast({
          type: 'success',
          title: 'NẠP FEN THÀNH CÔNG',
          message: 'Bàn cờ đã được cập nhật từ chuỗi FEN.',
        });
      }
    } catch {
      if (showToast) {
        showToast({
          type: 'error',
          title: 'LỖI FEN',
          message: 'Chuỗi FEN không đúng định dạng chuẩn cờ tướng.',
        });
      }
    }
  };

  // Play / Test against AI
  const handlePlayTestWithAi = () => {
    const redKing = findGeneral(board, 'red');
    const blackKing = findGeneral(board, 'black');

    if (!redKing) {
      if (showToast) {
        showToast({
          type: 'warning',
          title: 'THIẾU QUÂN TƯỚNG',
          message: 'Vui lòng đặt Tướng ĐỎ (帥) lên cung Tướng trước khi chơi!',
        });
      }
      return;
    }

    if (!blackKing) {
      if (showToast) {
        showToast({
          type: 'warning',
          title: 'THIẾU QUÂN TƯỚNG',
          message: 'Vui lòng đặt Tướng ĐEN (將) lên cung Tướng trước khi chơi!',
        });
      }
      return;
    }

    if (areGeneralsFacing(board)) {
      if (showToast) {
        showToast({
          type: 'error',
          title: 'LỘ MẶT TƯỚNG',
          message: 'Hai Tướng đang đối mặt nhau trực tiếp trên cùng một cột lộ. Vui lòng xếp quân cản!',
        });
      }
      return;
    }

    soundFX.playBattleStart();
    if (onPlayWithAi) {
      onPlayWithAi(currentFen, turn);
    }
  };

  return (
    <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 px-3 sm:px-6 py-4 max-w-[1440px] w-full mx-auto">
      {/* LEFT: Xiangqi Board */}
      <section className="relative flex flex-col items-center justify-center order-1">
        <XiangqiBoard
          board={board}
          placementDots={placementDots}
          flipped={flipped}
          onSquareClick={handleSquareClick}
          onSquareRightClick={handleSquareRightClick}
        />

        <div className="mt-3 flex items-center gap-2 text-xs text-[#a3a27a]/80 bg-[#10261c]/60 px-4 py-2 rounded-xl border border-[#848156]/20">
          <HelpCircle className="w-3.5 h-3.5 text-amber-400/80" />
          <span>
            Nhấp ô có chấm đỏ để đặt quân. <b>Nhấp chuột phải</b> lên quân cờ để xóa nhanh.
          </span>
        </div>
      </section>

      {/* RIGHT: Piece Tray & Setup Controls (Kho quân cờ) */}
      <section className="order-2 w-full max-w-[480px] flex flex-col gap-3.5">
        <div className="bg-[#10261c]/90 backdrop-blur-md border border-[#848156]/35 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-4 text-white">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#848156]/20 pb-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
              <Layers className="w-5 h-5 text-emerald-400" />
              <span>Kho quân cờ</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFlipped((prev) => !prev)}
                className="text-xs text-[#c2baa3] hover:text-white px-2.5 py-1 rounded-lg bg-black/25 hover:bg-black/40 border border-[#848156]/30 flex items-center gap-1 transition cursor-pointer"
                title="Xoay bàn cờ"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-300" />
                <span>Xoay bàn</span>
              </button>
              <button
                onClick={handleResetStandard}
                className="text-xs text-[#c2baa3] hover:text-white px-2.5 py-1 rounded-lg bg-black/25 hover:bg-black/40 border border-[#848156]/30 flex items-center gap-1 transition cursor-pointer"
                title="Khôi phục 32 quân cờ chuẩn"
              >
                <RotateCcw className="w-3.5 h-3.5 text-cyan-300" />
                <span>Cờ chuẩn</span>
              </button>
            </div>
          </div>

          {/* Selection Status & Action Buttons Box */}
          <div className="bg-[#091710]/95 border border-[#848156]/25 rounded-xl p-3 flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3">
              {eraserMode ? (
                <div className="w-10 h-10 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.3)]">
                  <Eraser className="w-5 h-5" />
                </div>
              ) : selectedTool ? (
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-serif text-xl font-bold shadow-md border-2 ${
                    selectedTool.side === 'red'
                      ? 'bg-gradient-to-br from-[#fef08a] to-[#d97706] text-[#991b1b] border-[#ef4444]'
                      : 'bg-gradient-to-br from-[#1e293b] to-[#0f172a] text-[#34d399] border-[#10b981]'
                  }`}
                  style={{
                    fontFamily: "'LXGW WenKai TC', 'KaiTi', 'Noto Serif TC', serif",
                  }}
                >
                  {PIECE_CHARS[selectedTool.side][selectedTool.type]}
                </div>
              ) : null}

              <div className="flex flex-col">
                <span className="text-[11px] text-[#a3a27a] font-medium leading-none mb-1">
                  Đang chọn:
                </span>
                <span className="text-sm font-bold leading-none">
                  {eraserMode ? (
                    <span className="text-amber-400 flex items-center gap-1">
                      Xóa quân
                    </span>
                  ) : selectedTool ? (
                    <span
                      className={
                        selectedTool.side === 'red'
                          ? 'text-red-400'
                          : 'text-emerald-400'
                      }
                    >
                      {selectedTool.side === 'red' ? 'ĐỎ' : 'ĐEN'} •{' '}
                      {PIECE_VI_NAMES[selectedTool.type]}
                    </span>
                  ) : (
                    'Chưa chọn'
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleEraser}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                  eraserMode
                    ? 'bg-amber-500/30 text-amber-200 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                    : 'bg-[#153124] hover:bg-[#1c3f2e] text-[#d1fae5] border-[#848156]/30'
                }`}
              >
                <Eraser className="w-3.5 h-3.5 text-amber-400" />
                <span>Xóa quân</span>
              </button>

              <button
                onClick={handleClearBoard}
                className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-200 border border-red-500/40 transition cursor-pointer"
                title="Xóa toàn bộ quân cờ trên bàn"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>Xóa sạch</span>
              </button>
            </div>
          </div>

          {/* BLACK PIECES TRAY */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider px-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                <span>ĐEN</span>
              </div>
              <span className="text-[11px] text-slate-400 normal-case font-normal">
                {Object.values(pieceCounts.black).reduce((a, b) => a + b, 0)}/16 quân
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 bg-[#091710]/60 p-2 sm:p-2.5 rounded-xl border border-[#848156]/20">
              {PIECE_ORDER.map((type) => {
                const count = pieceCounts.black[type];
                const max = PIECE_LIMITS[type];
                const isSelected =
                  !eraserMode &&
                  selectedTool?.side === 'black' &&
                  selectedTool?.type === type;

                return (
                  <button
                    key={`black-${type}`}
                    onClick={() => handleSelectPiece('black', type)}
                    className={`relative aspect-square rounded-full flex items-center justify-center cursor-pointer transition-all ${
                      isSelected
                        ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#091710] scale-105 shadow-[0_0_12px_rgba(52,211,153,0.5)]'
                        : 'hover:scale-105 opacity-90 hover:opacity-100'
                    }`}
                    style={{
                      background: 'radial-gradient(circle at 35% 30%, #334155, #0f172a 80%)',
                      border: '1.5px solid #475569',
                      boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), 0 3px 6px rgba(0,0,0,0.5)',
                    }}
                    title={`${PIECE_VI_NAMES[type]} Đen (${count}/${max})`}
                  >
                    <span
                      className="text-emerald-400 font-bold text-base sm:text-lg leading-none"
                      style={{
                        fontFamily: "'LXGW WenKai TC', 'KaiTi', 'Noto Serif TC', serif",
                      }}
                    >
                      {PIECE_CHARS.black[type]}
                    </span>

                    {/* Count badge */}
                    <span
                      className={`absolute -bottom-1 -right-1 text-[9px] font-bold px-1 rounded-full leading-tight border ${
                        count >= max
                          ? 'bg-amber-900/90 text-amber-200 border-amber-600'
                          : 'bg-black/80 text-slate-300 border-slate-600'
                      }`}
                    >
                      {count}/{max}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RED PIECES TRAY */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-red-400 uppercase tracking-wider px-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
                <span>ĐỎ</span>
              </div>
              <span className="text-[11px] text-slate-400 normal-case font-normal">
                {Object.values(pieceCounts.red).reduce((a, b) => a + b, 0)}/16 quân
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 bg-[#091710]/60 p-2 sm:p-2.5 rounded-xl border border-[#848156]/20">
              {PIECE_ORDER.map((type) => {
                const count = pieceCounts.red[type];
                const max = PIECE_LIMITS[type];
                const isSelected =
                  !eraserMode &&
                  selectedTool?.side === 'red' &&
                  selectedTool?.type === type;

                return (
                  <button
                    key={`red-${type}`}
                    onClick={() => handleSelectPiece('red', type)}
                    className={`relative aspect-square rounded-full flex items-center justify-center cursor-pointer transition-all ${
                      isSelected
                        ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-[#091710] scale-105 shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                        : 'hover:scale-105 opacity-90 hover:opacity-100'
                    }`}
                    style={{
                      background: 'radial-gradient(circle at 35% 30%, #fef08a, #d97706 75%)',
                      border: '1.5px solid #b45309',
                      boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.4), 0 3px 6px rgba(0,0,0,0.5)',
                    }}
                    title={`${PIECE_VI_NAMES[type]} Đỏ (${count}/${max})`}
                  >
                    <span
                      className="text-[#991b1b] font-bold text-base sm:text-lg leading-none"
                      style={{
                        fontFamily: "'LXGW WenKai TC', 'KaiTi', 'Noto Serif TC', serif",
                      }}
                    >
                      {PIECE_CHARS.red[type]}
                    </span>

                    {/* Count badge */}
                    <span
                      className={`absolute -bottom-1 -right-1 text-[9px] font-bold px-1 rounded-full leading-tight border ${
                        count >= max
                          ? 'bg-amber-900/90 text-amber-200 border-amber-600'
                          : 'bg-black/80 text-amber-200 border-amber-600'
                      }`}
                    >
                      {count}/{max}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Turn selector */}
          <div className="flex items-center justify-between bg-[#091710]/80 px-3 py-2 rounded-xl border border-[#848156]/20">
            <span className="text-xs font-semibold text-[#c2baa3]">Bên đi trước:</span>
            <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-[#848156]/20">
              <button
                onClick={() => setTurn('red')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                  turn === 'red'
                    ? 'bg-red-700 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Đỏ đi trước
              </button>
              <button
                onClick={() => setTurn('black')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                  turn === 'black'
                    ? 'bg-emerald-700 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Đen đi trước
              </button>
            </div>
          </div>

          {/* Accordion: Công cụ xuất / nhập FEN */}
          <div className="border border-[#848156]/25 rounded-xl overflow-hidden bg-[#091710]/50">
            <button
              onClick={() => setShowFenAccordion((prev) => !prev)}
              className="w-full px-3 py-2.5 flex items-center justify-between text-xs font-bold text-[#d1fae5] hover:bg-white/5 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Công cụ xuất / nhập FEN</span>
              </div>
              {showFenAccordion ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showFenAccordion && (
              <div className="p-3 border-t border-[#848156]/20 flex flex-col gap-3 bg-[#08140e]/80">
                {/* Current FEN */}
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-[#a3a27a]">Chuỗi FEN hiện tại:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={currentFen}
                      className="flex-1 bg-black/40 border border-[#848156]/30 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-mono select-all focus:outline-none"
                    />
                    <button
                      onClick={handleCopyFen}
                      className="px-3 py-1.5 bg-[#153124] hover:bg-[#1d4331] border border-[#5ec485]/40 rounded-lg text-xs font-bold text-[#bbf7d0] flex items-center gap-1 transition cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Import FEN */}
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-[#a3a27a]">Nạp thế cờ từ FEN:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Dán chuỗi FEN cờ tướng vào đây..."
                      value={customFenInput}
                      onChange={(e) => setCustomFenInput(e.target.value)}
                      className="flex-1 bg-black/40 border border-[#848156]/30 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={handleApplyFen}
                      className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      Áp dụng
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* PRIMARY BIG BUTTON: Chơi thử với máy */}
          <button
            onClick={handlePlayTestWithAi}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-base text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-[0.98] transition-all shadow-lg shadow-red-950/60 flex items-center justify-center gap-2.5 cursor-pointer border border-red-400/40"
          >
            <Bot className="w-5 h-5 text-red-100" />
            <span>Chơi thử với máy</span>
          </button>
        </div>
      </section>
    </div>
  );
}

