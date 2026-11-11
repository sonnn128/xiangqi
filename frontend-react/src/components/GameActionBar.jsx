import React from 'react';
import { Clock, Flag } from 'lucide-react';

export function GameActionBar({
  winner,
  postMatchCountdown,
  handleInstantNewGame,
  moveHistoryLength,
  onConfirmSurrender,
  onConfirmDraw,
}) {
  return (
    <>
      {/* Post Match Automatic Countdown Banner */}
      {winner && postMatchCountdown !== null && (
        <div className="w-full max-w-[550px] mt-3 py-2.5 px-4 rounded-2xl bg-[#11281e]/95 border border-[#5ec485]/40 text-xs font-semibold text-[#f3ead8] flex items-center justify-between shadow-xl animate-fade-in select-none">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#61c887] animate-pulse shrink-0" />
            <span>
              Ván mới sẽ bắt đầu sau{' '}
              <strong className="text-[#61c887] font-mono text-sm font-bold">
                {postMatchCountdown}s
              </strong>
            </span>
          </div>
          <button
            onClick={handleInstantNewGame}
            className="px-3 py-1 rounded-xl bg-[#25593f] hover:bg-[#2f6f4f] text-white text-xs font-bold transition cursor-pointer shrink-0 shadow"
          >
            Ván mới ngay
          </button>
        </div>
      )}

      {/* In-game Match Actions (Surrender & Draw offer) */}
      {!winner && moveHistoryLength > 0 && (
        <div className="w-full max-w-[550px] grid grid-cols-2 gap-2 mt-3 select-none">
          <button
            onClick={onConfirmSurrender}
            className="py-2.5 rounded-xl bg-red-950/60 hover:bg-red-900/70 text-red-200 border border-red-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow transition"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Nhận thua</span>
          </button>
          <button
            onClick={onConfirmDraw}
            className="py-2.5 rounded-xl bg-black/30 hover:bg-black/45 text-[#d2cca6] border border-white/15 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow transition"
          >
            <span>Xin hòa</span>
          </button>
        </div>
      )}
    </>
  );
}

