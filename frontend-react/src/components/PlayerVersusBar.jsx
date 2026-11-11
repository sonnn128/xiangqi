import React from 'react';
import { Check, Copy, Plus, Trophy, Users, XCircle } from 'lucide-react';

export function PlayerVersusBar({
  currentRoom,
  turn,
  winner,
  resultStake,
  redTime,
  blackTime,
  formatClock,
  formatCoinText,
  getPlayerHealthColor,
  moveTimerPercent,
  isMySide,
  handleOpenPlayerProfile,
  handleInviteFriend,
  showToast,
}) {
  if (!currentRoom) return null;

  return (
    <>
      <div className="w-full max-w-[550px] grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4 mb-3 px-2 py-2 rounded-2xl bg-[#11281e]/90 border border-[#848156]/35 shadow-lg select-none">
        {/* Red Player */}
        {currentRoom.redPlayer ? (
          <div className="flex items-center gap-2 min-w-0">
            <div
              onClick={() => handleOpenPlayerProfile?.(currentRoom.redPlayer)}
              className="relative w-12 h-12 rounded-full flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 transition-transform"
              style={{
                background: `conic-gradient(${getPlayerHealthColor?.('red')} ${
                  turn === 'red' ? moveTimerPercent : 100
                }%, rgba(255,255,255,.12) 0)`,
              }}
              title="Xem hồ sơ quân Đỏ"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#f5e4c8] to-[#cfa978] flex items-center justify-center border border-[#b91c1c]">
                <span className="text-[#9e1c13] font-semibold text-lg">帥</span>
              </div>
              {currentRoom.status === 'WAITING' && currentRoom.redReady && (
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#11281e] flex items-center justify-center shadow">
                  <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-[#f3ead8] truncate">
                {currentRoom.redPlayer}
              </div>
              {currentRoom.status === 'WAITING' ? (
                <div className="text-[10px] font-semibold leading-tight mt-0.5">
                  {currentRoom.redReady ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                      Đã sẵn sàng
                    </span>
                  ) : (
                    <span className="text-amber-300 animate-pulse flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-300 inline-block" />
                      Chưa sẵn sàng
                    </span>
                  )}
                </div>
              ) : (
                <div
                  className={`text-[10px] ${
                    turn === 'red'
                      ? isMySide?.('red')
                        ? 'text-[#8ce8b1] font-bold'
                        : 'text-red-400 font-bold'
                      : 'text-[#8fa195]'
                  }`}
                >
                  {formatClock?.(redTime)}
                </div>
              )}
            </div>
            {winner && winner !== 'draw' && resultStake > 0 && (
              <div
                className={`shrink-0 flex items-center gap-1 text-lg font-black ${
                  winner === 'red' ? 'text-yellow-300' : 'text-red-600'
                }`}
              >
                {winner === 'red' ? (
                  <Trophy className="w-4 h-4 text-amber-300" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                {winner === 'red' ? '+' : '-'}
                {formatCoinText?.(resultStake)}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleInviteFriend}
            className="flex items-center gap-2 text-left group cursor-pointer transition hover:scale-105"
            title="Nhấn để mời bạn bè vào bàn"
          >
            <div className="w-11 h-11 rounded-full border-2 border-dashed border-[#5ec485]/60 group-hover:border-[#5ec485] bg-[#163827]/70 group-hover:bg-[#1f4d36] flex items-center justify-center transition shadow">
              <Plus className="w-5 h-5 text-[#8ce8b1] group-hover:rotate-90 transition-transform duration-300" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-[#8ce8b1] group-hover:text-white transition">
                Mời bạn
              </div>
              <div className="text-[10px] text-[#8fa195]">Nhấn để chia sẻ</div>
            </div>
          </button>
        )}

        <span className="text-[10px] font-extrabold text-[#9ec4ae] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-center">
          VS
        </span>

        {/* Black Player */}
        {currentRoom.blackPlayer ? (
          <div className="flex items-center justify-end gap-2 min-w-0 text-right">
            {winner && winner !== 'draw' && resultStake > 0 && (
              <div
                className={`shrink-0 flex items-center gap-1 text-lg font-black ${
                  winner === 'black' ? 'text-yellow-300' : 'text-red-600'
                }`}
              >
                {winner === 'black' ? (
                  <Trophy className="w-4 h-4 text-amber-300" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                {winner === 'black' ? '+' : '-'}
                {formatCoinText?.(resultStake)}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-[#f3ead8] truncate">
                {currentRoom.blackPlayer}
              </div>
              {currentRoom.status === 'WAITING' ? (
                <div className="text-[10px] font-semibold leading-tight mt-0.5 flex justify-end">
                  {currentRoom.blackReady ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      Đã sẵn sàng
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    </span>
                  ) : (
                    <span className="text-amber-300 animate-pulse flex items-center gap-1">
                      Chưa sẵn sàng
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-300 inline-block" />
                    </span>
                  )}
                </div>
              ) : (
                <div
                  className={`text-[10px] ${
                    turn === 'black'
                      ? isMySide?.('black')
                        ? 'text-[#8ce8b1] font-bold'
                        : 'text-red-400 font-bold'
                      : 'text-[#8fa195]'
                  }`}
                >
                  {formatClock?.(blackTime)}
                </div>
              )}
            </div>
            <div
              onClick={() => handleOpenPlayerProfile?.(currentRoom.blackPlayer)}
              className="relative w-12 h-12 rounded-full flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 transition-transform"
              style={{
                background: `conic-gradient(${getPlayerHealthColor?.('black')} ${
                  turn === 'black' ? moveTimerPercent : 100
                }%, rgba(255,255,255,.12) 0)`,
              }}
              title="Xem hồ sơ quân Đen"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#f5e4c8] to-[#cfa978] flex items-center justify-center border border-[#262422]">
                <span className="text-[#24201c] font-semibold text-lg">將</span>
              </div>
              {currentRoom.status === 'WAITING' && currentRoom.blackReady && (
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#11281e] flex items-center justify-center shadow">
                  <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                </span>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={handleInviteFriend}
            className="flex items-center justify-end gap-2 text-right group cursor-pointer transition hover:scale-105"
            title="Nhấn để mời bạn bè vào bàn"
          >
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-[#8ce8b1] group-hover:text-white transition">
                Mời bạn
              </div>
              <div className="text-[10px] text-[#8fa195]">Nhấn để chia sẻ</div>
            </div>
            <div className="w-11 h-11 rounded-full border-2 border-dashed border-[#5ec485]/60 group-hover:border-[#5ec485] bg-[#163827]/70 group-hover:bg-[#1f4d36] flex items-center justify-center transition shadow">
              <Plus className="w-5 h-5 text-[#8ce8b1] group-hover:rotate-90 transition-transform duration-300" />
            </div>
          </button>
        )}
      </div>

      {/* Waiting banner when one seat is missing */}
      {(!currentRoom.redPlayer || !currentRoom.blackPlayer) && (
        <div className="mb-3 w-full max-w-[550px] px-4 py-2.5 rounded-2xl bg-[#142f22]/95 border border-[#5ec485]/60 shadow-lg flex items-center justify-between gap-3 text-xs animate-fade-in select-none">
          <div className="flex items-center gap-2 text-[#f3ead8]">
            <Users className="w-4 h-4 text-[#8ce8b1] shrink-0" />
            <span>
              Đang chờ bạn vào chơi! Mã phòng:{' '}
              <strong className="font-mono text-[#fef08a] text-sm bg-black/40 px-2 py-0.5 rounded border border-white/10">
                {currentRoom.roomId}
              </strong>
            </span>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(currentRoom.roomId);
              showToast?.({
                type: 'success',
                title: 'ĐÃ SAO CHÉP MÃ PHÒNG',
                message: `Đã sao chép mã phòng: ${currentRoom.roomId}. Hãy gửi mã này cho bạn bè!`,
              });
            }}
            className="px-2.5 py-1.5 rounded-xl bg-[#25593f] hover:bg-[#2e6d4e] text-white font-bold flex items-center gap-1 cursor-pointer shrink-0"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy mã</span>
          </button>
        </div>
      )}
    </>
  );
}

