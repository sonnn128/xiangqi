import React, { useEffect, useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Coins,
  Copy,
  Eye,
  History,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Trophy,
  X,
} from 'lucide-react';
import { XiangqiBoard } from './XiangqiBoard.jsx';
import { INITIAL_FEN, parseFen } from '../engine/xiangqiEngine.js';
import { fetchMatchHistory } from '../services/onlineService.js';

export function MatchHistoryModal({
  isOpen,
  onClose,
  currentUser,
  playerName,
}) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  // Replay State
  const [replayMoveIdx, setReplayMoveIdx] = useState(0);
  const [replayParsedMoves, setReplayParsedMoves] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchMatchHistory(currentUser?.username || playerName)
        .then((data) => {
          setMatches(data || []);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, currentUser?.username, playerName]);

  // When a match is selected for replay
  useEffect(() => {
    if (selectedMatch) {
      try {
        const moves = JSON.parse(selectedMatch.moveHistoryJson || '[]');
        setReplayParsedMoves(moves);
        setReplayMoveIdx(moves.length); // default to end of match
      } catch {
        setReplayParsedMoves([]);
        setReplayMoveIdx(0);
      }
    } else {
      setReplayParsedMoves([]);
      setReplayMoveIdx(0);
    }
  }, [selectedMatch]);

  if (!isOpen) return null;

  // Compute board state at replayMoveIdx
  const getReplayBoardAtStep = () => {
    if (!selectedMatch || replayParsedMoves.length === 0 || replayMoveIdx === 0) {
      return {
        board: parseFen(INITIAL_FEN).board,
        turn: 'red',
        lastMove: null,
      };
    }
    const targetMove = replayParsedMoves[replayMoveIdx - 1];
    const fen = targetMove.fenAfter || INITIAL_FEN;
    const parsed = parseFen(fen);

    const lastMove = {
      from: { row: Number(targetMove.fromRow), col: Number(targetMove.fromCol) },
      to: { row: Number(targetMove.toRow), col: Number(targetMove.toCol) },
      piece: {
        type: String(targetMove.piece || 'p').toLowerCase(),
        side: targetMove.side || 'red',
      },
    };

    return {
      board: parsed.board,
      turn: parsed.turn,
      lastMove,
    };
  };

  const { board: replayBoard, turn: replayTurn, lastMove: replayLastMove } =
    getReplayBoardAtStep();

  const formatCoinText = (c) => {
    if (!c || c === 0) return '0 xu';
    if (c >= 1000000) return `${(c / 1000000).toFixed(c % 1000000 === 0 ? 0 : 1)}M`;
    if (c >= 1000) return `${Math.floor(c / 1000)}k`;
    return `${c}`;
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    } catch {
      return '';
    }
  };

  const user = currentUser?.username || playerName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in text-[#f3ead8]">
      <div className="relative w-full max-w-4xl max-h-[92vh] rounded-3xl bg-[#11241a] border border-[#848156]/40 shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-[#152e21] border-b border-[#848156]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#facc15] to-[#ca8a04] flex items-center justify-center text-[#422006] shadow">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2
                className="text-xl sm:text-2xl font-bold tracking-wide text-[#fef3c7]"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                {selectedMatch ? 'XEM LẠI VÁN CỜ' : 'LỊCH SỬ THI ĐẤU'}
              </h2>
              <p className="text-xs text-[#9ec4ae]">
                {selectedMatch
                  ? `${selectedMatch.roomName} • ${selectedMatch.redPlayer || 'Đỏ'} vs ${selectedMatch.blackPlayer || 'Đen'}`
                  : `Kỳ thủ: ${user} • Tổng cộng ${matches.length} ván đấu`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedMatch && (
              <button
                onClick={() => setSelectedMatch(null)}
                className="px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 text-xs font-semibold text-[#8ce8b1] border border-white/10 transition cursor-pointer"
              >
                ← Danh sách ván
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {!selectedMatch ? (
            /* MATCH LIST VIEW */
            loading ? (
              <div className="py-20 text-center text-xs text-[#9ec4ae]">
                Đang tải lịch sử thi đấu...
              </div>
            ) : matches.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center text-xs text-[#8fa195]">
                <History className="w-12 h-12 text-[#5ec485]/30 mb-2" />
                <p className="text-sm font-semibold text-[#f3ead8]">
                  Chưa có lịch sử đấu nào
                </p>
                <p className="text-xs text-[#7d8f83] mt-1">
                  Hãy vào Sảnh thi đấu các ván cờ cược để lưu giữ kỳ phổ của bạn nhé!
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {matches.map((m) => {
                  const isRed = m.redPlayer === user;
                  const isBlack = m.blackPlayer === user;
                  const isWinner =
                    (m.winner === 'red' && isRed) || (m.winner === 'black' && isBlack);
                  const isDraw = m.winner === 'draw';
                  const isLoser =
                    (isRed || isBlack) && !isWinner && !isDraw;

                  const outcomeBadge = isWinner
                    ? { text: 'THẮNG', bg: 'bg-emerald-950 text-emerald-300 border-emerald-500/40' }
                    : isDraw
                    ? { text: 'HÒA', bg: 'bg-amber-950 text-amber-300 border-amber-500/40' }
                    : isLoser
                    ? { text: 'THUA', bg: 'bg-rose-950 text-rose-300 border-rose-500/40' }
                    : { text: 'KẾT THÚC', bg: 'bg-black/40 text-gray-300 border-white/10' };

                  return (
                    <div
                      key={m.id}
                      className="p-3.5 sm:p-4 rounded-2xl bg-black/35 hover:bg-black/50 border border-white/10 hover:border-[#5ec485]/50 shadow transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${outcomeBadge.bg}`}
                        >
                          {outcomeBadge.text}
                        </span>

                        <div>
                          <div className="text-sm font-bold text-[#fef3c7] flex items-center gap-2">
                            <span>{m.roomName}</span>
                            {m.betCoins > 0 && (
                              <span className="text-xs font-mono font-bold text-amber-300">
                                🪙 {isWinner ? '+' : isLoser ? '-' : ''}
                                {formatCoinText(m.betCoins)} xu
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[#a7b5ab] mt-0.5 flex flex-wrap items-center gap-2">
                            <span className="text-red-400 font-semibold">
                              Đỏ: {m.redPlayer || 'Ẩn danh'}
                            </span>
                            <span>vs</span>
                            <span className="text-gray-300 font-semibold">
                              Đen: {m.blackPlayer || 'Ẩn danh'}
                            </span>
                            <span>•</span>
                            <span>{m.totalMoves || 0} nước</span>
                            <span>•</span>
                            <span>{formatDate(m.finishedAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => setSelectedMatch(m)}
                          className="px-3 py-1.5 rounded-xl bg-[#25593f] hover:bg-[#2e6d4e] text-white text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Xem lại ván cờ</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* MATCH REPLAYER VIEW */
            <div className="flex flex-col lg:flex-row items-center justify-center gap-6">
              {/* Board View */}
              <div className="flex flex-col items-center">
                <XiangqiBoard
                  board={replayBoard}
                  turn={replayTurn}
                  selectedPos={null}
                  legalMoves={[]}
                  lastMove={replayLastMove}
                  hintMove={null}
                  flipped={selectedMatch.blackPlayer === user}
                  showViLabels={true}
                  animatingMove={null}
                  inCheckSide={null}
                  winner={replayMoveIdx === replayParsedMoves.length ? selectedMatch.winner : null}
                  winReason={replayMoveIdx === replayParsedMoves.length ? selectedMatch.winReason : null}
                  onSquareClick={() => {}}
                />

                {/* Replay Controls Slider & Buttons */}
                <div className="w-full max-w-md mt-4 p-3 rounded-2xl bg-black/45 border border-white/10 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-[#9ec4ae] font-semibold">
                    <span>
                      Nước đi: <strong>{replayMoveIdx} / {replayParsedMoves.length}</strong>
                    </span>
                    <span>
                      {replayMoveIdx > 0
                        ? replayParsedMoves[replayMoveIdx - 1]?.notation || ''
                        : 'Khai cuộc'}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max={replayParsedMoves.length}
                    value={replayMoveIdx}
                    onChange={(e) => setReplayMoveIdx(Number(e.target.value))}
                    className="w-full accent-[#5ec485] cursor-pointer"
                  />

                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      onClick={() => setReplayMoveIdx(0)}
                      disabled={replayMoveIdx === 0}
                      title="Về nước đầu"
                      className="p-2 rounded-xl bg-[#1b3f2c] hover:bg-[#25593f] disabled:opacity-40 text-white cursor-pointer"
                    >
                      <SkipBack className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setReplayMoveIdx((v) => Math.max(0, v - 1))}
                      disabled={replayMoveIdx === 0}
                      title="Lùi 1 nước"
                      className="p-2 rounded-xl bg-[#1b3f2c] hover:bg-[#25593f] disabled:opacity-40 text-white cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        setReplayMoveIdx((v) =>
                          Math.min(replayParsedMoves.length, v + 1)
                        )
                      }
                      disabled={replayMoveIdx === replayParsedMoves.length}
                      title="Tiến 1 nước"
                      className="p-2 rounded-xl bg-[#1b3f2c] hover:bg-[#25593f] disabled:opacity-40 text-white cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setReplayMoveIdx(replayParsedMoves.length)}
                      disabled={replayMoveIdx === replayParsedMoves.length}
                      title="Đến nước cuối"
                      className="p-2 rounded-xl bg-[#1b3f2c] hover:bg-[#25593f] disabled:opacity-40 text-white cursor-pointer"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Move List Log */}
              <div className="w-full lg:w-72 h-[420px] rounded-2xl bg-black/45 border border-white/10 p-3.5 flex flex-col">
                <h4 className="text-xs font-bold uppercase text-[#9ec4ae] pb-2 border-b border-white/10 flex items-center justify-between">
                  <span>Biên bản ván đấu</span>
                  <span>{selectedMatch.winner === 'red' ? 'Đỏ thắng' : selectedMatch.winner === 'black' ? 'Đen thắng' : 'Hòa cờ'}</span>
                </h4>

                <div className="flex-1 overflow-y-auto pt-2 space-y-1 text-xs font-mono">
                  {Array.from({
                    length: Math.ceil(replayParsedMoves.length / 2),
                  }).map((_, pairIdx) => {
                    const redIdx = pairIdx * 2 + 1;
                    const blackIdx = pairIdx * 2 + 2;
                    const redMove = replayParsedMoves[pairIdx * 2];
                    const blackMove = replayParsedMoves[pairIdx * 2 + 1];

                    const isRedActive = replayMoveIdx === redIdx;
                    const isBlackActive = replayMoveIdx === blackIdx;

                    return (
                      <div
                        key={pairIdx}
                        className="grid grid-cols-7 items-center py-1 px-1.5 rounded-lg hover:bg-white/5 transition"
                      >
                        <span className="col-span-1 text-[#8fa195]">
                          {pairIdx + 1}.
                        </span>
                        <span
                          onClick={() => setReplayMoveIdx(redIdx)}
                          className={`col-span-3 cursor-pointer px-1 rounded ${
                            isRedActive
                              ? 'bg-[#991b1b] text-white font-bold'
                              : 'text-red-300 hover:text-white'
                          }`}
                        >
                          {redMove?.notation}
                        </span>
                        <span
                          onClick={() => blackMove && setReplayMoveIdx(blackIdx)}
                          className={`col-span-3 cursor-pointer px-1 rounded ${
                            isBlackActive
                              ? 'bg-[#1f2937] text-white font-bold'
                              : 'text-gray-300 hover:text-white'
                          }`}
                        >
                          {blackMove?.notation || ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

