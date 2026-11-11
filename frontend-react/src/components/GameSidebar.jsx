import React from 'react';
import {
  Bot,
  Compass,
  Lightbulb,
  RefreshCw,
  RotateCcw,
  Undo2,
} from 'lucide-react';
import { INITIAL_FEN, PIECE_CHARS, PUZZLE_PRESETS } from '../engine/xiangqiEngine.js';

const DIFFICULTY_LABELS = {
  1: 'Tập Sự (Dễ)',
  2: 'Kỳ Thủ (Vừa)',
  3: 'Cao Thủ (Khó)',
  4: 'Đại Sư (Rất Khó)',
};

export function GameSidebar({
  mode,
  turn,
  winner,
  myOnlineSide,
  currentRoom,
  handleOpenPlayerProfile,
  getPlayerHealthColor,
  moveTimerPercent,
  formatClock,
  blackTime,
  redTime,
  capturedByBlack,
  capturedByRed,
  aiDifficulty,
  setAiDifficulty,
  playerSide,
  setPlayerSide,
  setFlipped,
  loadBoardFromFen,
  activePuzzle,
  setActivePuzzle,
  showPuzzleHint,
  setShowPuzzleHint,
  loadScreenshotDemo,
  customFenInput,
  setCustomFenInput,
  handleUndo,
  moveHistoryLength,
  animatingMove,
  handleHint,
  handleNewGame,
}) {
  if (mode === 'online') return null;

  return (
    <aside className="w-full lg:w-[310px] flex flex-col gap-3 order-2 lg:order-1 select-none">
      {/* Black Player Card */}
      <div
        className={`rounded-2xl p-3.5 bg-[#11281e]/85 backdrop-blur-md border transition-all ${
          turn === 'black' && !winner
            ? 'border-[#61c887] shadow-[0_0_20px_rgba(97,200,135,0.25)]'
            : 'border-[#848156]/35'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              onClick={() => handleOpenPlayerProfile?.(currentRoom?.blackPlayer)}
              className="relative w-14 h-14 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
              style={{
                background: `conic-gradient(${getPlayerHealthColor?.('black')} ${
                  turn === 'black' ? moveTimerPercent : 100
                }%, rgba(255,255,255,.12) 0)`,
              }}
              title="Xem hồ sơ đối thủ"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f5e4c8] to-[#cfa978] flex items-center justify-center border border-[#6b4c30] shadow">
                <span
                  className="text-[#24201c] font-semibold text-xl"
                  style={{
                    fontFamily:
                      "'LXGW WenKai TC', 'KaiTi', '楷体', 'STKaiti', serif",
                  }}
                >
                  將
                </span>
              </div>
            </div>
            {turn === 'black' && !winner && (
              <span className="w-2 h-2 rounded-full animate-ping bg-[#61c887]" />
            )}
          </div>
          <div
            className={`px-2.5 py-1 rounded-lg font-mono text-sm font-bold ${
              turn === 'black'
                ? 'bg-[#204d37] text-[#8ce8b1] border border-[#5ec485]/40'
                : 'bg-black/30 text-[#9ca89e]'
            }`}
          >
            {formatClock?.(blackTime)}
          </div>
        </div>

        {capturedByBlack?.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-wrap gap-1">
            {capturedByBlack.map((p, i) => (
              <span
                key={i}
                className="w-6 h-6 rounded-full bg-[#edd3ae] text-[#9e1c13] font-semibold text-xs flex items-center justify-center shadow border border-[#6b4c30]/50"
                style={{
                  fontFamily: "'LXGW WenKai TC', 'KaiTi', 'Noto Serif TC', serif",
                }}
              >
                {PIECE_CHARS[p.side][p.type]}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Red Player Card */}
      <div
        className={`rounded-2xl p-3.5 bg-[#11281e]/85 backdrop-blur-md border transition-all ${
          turn === 'red' && !winner
            ? 'border-[#61c887] shadow-[0_0_20px_rgba(97,200,135,0.25)]'
            : 'border-[#848156]/35'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              onClick={() => handleOpenPlayerProfile?.(currentRoom?.redPlayer)}
              className="relative w-14 h-14 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
              style={{
                background: `conic-gradient(${getPlayerHealthColor?.('red')} ${
                  turn === 'red' ? moveTimerPercent : 100
                }%, rgba(255,255,255,.12) 0)`,
              }}
              title="Xem hồ sơ đối thủ"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f5e4c8] to-[#cfa978] flex items-center justify-center border border-[#6b4c30] shadow">
                <span
                  className="text-[#9e1c13] font-semibold text-xl"
                  style={{
                    fontFamily:
                      "'LXGW WenKai TC', 'KaiTi', 'Noto Serif TC', serif",
                  }}
                >
                  帥
                </span>
              </div>
            </div>
            {turn === 'red' && !winner && (
              <span className="w-2 h-2 rounded-full animate-ping bg-[#61c887]" />
            )}
          </div>
          <div
            className={`px-2.5 py-1 rounded-lg font-mono text-sm font-bold ${
              turn === 'red'
                ? 'bg-[#204d37] text-[#8ce8b1] border border-[#5ec485]/40'
                : 'bg-black/30 text-[#9ca89e]'
            }`}
          >
            {formatClock?.(redTime)}
          </div>
        </div>

        {capturedByRed?.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-wrap gap-1">
            {capturedByRed.map((p, i) => (
              <span
                key={i}
                className="w-6 h-6 rounded-full bg-[#edd3ae] text-[#24201c] font-semibold text-xs flex items-center justify-center shadow border border-[#6b4c30]/50"
                style={{
                  fontFamily: "'LXGW WenKai TC', 'KaiTi', 'Noto Serif TC', serif",
                }}
              >
                {PIECE_CHARS[p.side][p.type]}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Mode-Specific Control Card */}
      <div className="rounded-2xl p-4 bg-[#11281e]/85 backdrop-blur-md border border-[#848156]/35 flex flex-col gap-3">
        {mode === 'ai' && (
          <>
            <div className="text-xs font-bold uppercase tracking-wider text-[#9ec4ae] flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-[#61c887]" />
              Thiết lập Luyện tập với Bot
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {[1, 2, 3, 4].map((lv) => (
                <button
                  key={lv}
                  onClick={() => setAiDifficulty?.(lv)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                    aiDifficulty === lv
                      ? 'bg-[#25593f] text-[#8ce8b1] border-[#5ec485]'
                      : 'bg-black/25 text-[#c2baa3] border-white/10 hover:bg-white/5'
                  }`}
                >
                  {DIFFICULTY_LABELS[lv]}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-xs text-[#c2baa3]">Chọn quân:</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => {
                    setPlayerSide?.('red');
                    setFlipped?.(false);
                    loadBoardFromFen?.(INITIAL_FEN);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    playerSide === 'red'
                      ? 'bg-[#991b1b] text-white border border-red-400'
                      : 'bg-black/30 text-gray-300'
                  }`}
                >
                  Đỏ (Đi Tiên)
                </button>
                <button
                  onClick={() => {
                    setPlayerSide?.('black');
                    setFlipped?.(true);
                    loadBoardFromFen?.(INITIAL_FEN);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    playerSide === 'black'
                      ? 'bg-[#1f2937] text-white border border-gray-400'
                      : 'bg-black/30 text-gray-300'
                  }`}
                >
                  Đen (Đi Hậu)
                </button>
              </div>
            </div>
          </>
        )}

        {mode === 'puzzle' && (
          <>
            <div className="text-xs font-bold uppercase tracking-wider text-[#9ec4ae] flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-[#f472b6]" />
              Chọn Thế Cờ Giang Hồ
            </div>
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
              {PUZZLE_PRESETS.map((pz) => (
                <button
                  key={pz.id}
                  onClick={() => {
                    setActivePuzzle?.(pz);
                    setShowPuzzleHint?.(false);
                    if (pz.id === 'screenshot-opening') {
                      loadScreenshotDemo?.();
                    } else {
                      loadBoardFromFen?.(pz.fen);
                    }
                  }}
                  className={`text-left p-2 rounded-xl border transition cursor-pointer ${
                    activePuzzle?.id === pz.id
                      ? 'bg-[#25593f]/90 border-[#5ec485] text-white'
                      : 'bg-black/25 border-white/10 text-[#d2cca6] hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{pz.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-[#8ce8b1]">
                      {pz.difficulty}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#b4c2b8] mt-0.5 line-clamp-1">
                    {pz.subtitle}
                  </p>
                </button>
              ))}
            </div>
            <p className="text-xs text-[#d2cca6] bg-black/25 p-2.5 rounded-xl border border-white/5">
              {activePuzzle?.description}
            </p>
            <button
              onClick={() => setShowPuzzleHint?.((s) => !s)}
              className="text-xs text-[#fbbf24] hover:underline text-left font-medium cursor-pointer"
            >
              {showPuzzleHint
                ? `💡 Bí quyết: ${activePuzzle?.hint}`
                : '💡 Xem gợi ý giải thế cờ'}
            </button>

            <div className="flex gap-1.5 pt-1">
              <input
                value={customFenInput}
                onChange={(e) => setCustomFenInput?.(e.target.value)}
                placeholder="Dán mã FEN thế cờ..."
                className="flex-1 bg-black/35 border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white placeholder:text-gray-400 focus:outline-none focus:border-[#5ec485]"
              />
              <button
                onClick={() => {
                  if (customFenInput?.trim()) {
                    loadBoardFromFen?.(customFenInput.trim());
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-[#25593f] text-xs font-semibold text-white hover:bg-[#2f6f4f] cursor-pointer"
              >
                Nạp
              </button>
            </div>
          </>
        )}

        {/* Action Buttons Bar */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
          <button
            onClick={handleUndo}
            disabled={moveHistoryLength === 0 || !!animatingMove}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#183829] hover:bg-[#214b37] disabled:opacity-40 text-xs font-semibold text-[#e6dec8] border border-[#848156]/40 transition cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5 text-[#61c887]" />
            Đi lại (Undo)
          </button>

          <button
            onClick={handleHint}
            disabled={!!winner || !!animatingMove}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#183829] hover:bg-[#214b37] disabled:opacity-40 text-xs font-semibold text-[#e6dec8] border border-[#848156]/40 transition cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5 text-[#fbbf24]" />
            Gợi ý nước đi
          </button>

          <button
            onClick={() => setFlipped?.((f) => !f)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#183829] hover:bg-[#214b37] text-xs font-semibold text-[#e6dec8] border border-[#848156]/40 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#60a5fa]" />
            Xoay bàn cờ
          </button>

          <button
            onClick={handleNewGame}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#25593f] hover:bg-[#2e6c4d] text-xs font-bold text-white border border-[#5ec485]/50 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Ván mới
          </button>
        </div>
      </div>
    </aside>
  );
}
