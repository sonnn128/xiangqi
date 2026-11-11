import React from 'react';
import { Trophy, XCircle, Clock, RefreshCw, Handshake, LogOut, Users } from 'lucide-react';

export default function PostMatchOverlay({
  winner,
  winReason,
  mode,
  mySide,
  resultStake = 0,
  countdown = 20,
  hasTwoPlayers = true,
  onStartNewGameNow,
  onContinueWaiting,
  onLeave,
}) {
  if (!winner) return null;

  const isDraw = winner === 'draw';
  const isOnlinePlayer = mode === 'online' && mySide && mySide !== 'spectator';
  const isUserWinner = isOnlinePlayer && winner === mySide;
  const isUserLoser = isOnlinePlayer && !isDraw && winner !== mySide;

  let title = '';
  let titleColor = 'text-[#fef08a]';
  let IconComponent = Trophy;
  let iconColor = 'text-yellow-400';

  if (isDraw) {
    title = 'VÁN CỜ HÒA!';
    titleColor = 'text-[#9ec4ae]';
    IconComponent = Handshake;
    iconColor = 'text-[#61c887]';
  } else if (isUserWinner) {
    title = 'BẠN CHIẾN THẮNG!';
    titleColor = 'text-yellow-300';
    IconComponent = Trophy;
    iconColor = 'text-yellow-400';
  } else if (isUserLoser) {
    title = 'BẠN ĐÃ THUA CUỘC';
    titleColor = 'text-red-400';
    IconComponent = XCircle;
    iconColor = 'text-red-500';
  } else if (mode === 'ai') {
    title = winner === mySide ? 'BẠN ĐÃ THẮNG BOT!' : 'BOT ĐÃ CHIẾN THẮNG';
    titleColor = winner === mySide ? 'text-yellow-300' : 'text-red-400';
    IconComponent = winner === mySide ? Trophy : XCircle;
    iconColor = winner === mySide ? 'text-yellow-400' : 'text-red-500';
  } else {
    title = winner === 'red' ? 'BÊN ĐỎ CHIẾN THẮNG!' : 'BÊN ĐEN CHIẾN THẮNG!';
    titleColor = winner === 'red' ? 'text-red-400' : 'text-[#61c887]';
    IconComponent = Trophy;
    iconColor = winner === 'red' ? 'text-red-400' : 'text-[#61c887]';
  }

  const formatCoin = (n) => Number(n).toLocaleString('vi-VN');

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-4 bg-black/65 backdrop-blur-[3px] select-none animate-fade-in">
      <div className="w-full max-w-[340px] rounded-2xl bg-gradient-to-b from-[#143224]/95 via-[#0f281d]/95 to-[#091a12]/95 border-2 border-[#5ec485]/60 shadow-[0_12px_45px_rgba(0,0,0,0.85)] p-5 flex flex-col items-center text-center">
        {/* Result Icon */}
        <div className="w-14 h-14 rounded-full bg-black/40 border border-white/10 flex items-center justify-center mb-2 shadow-inner">
          <IconComponent className={`w-8 h-8 ${iconColor} drop-shadow-[0_0_10px_currentColor]`} />
        </div>

        {/* Title */}
        <h3 className={`text-lg sm:text-xl font-extrabold tracking-wide ${titleColor} mb-1 drop-shadow`}>
          {title}
        </h3>

        {/* Subtitle / Reason */}
        {winReason && (
          <p className="text-xs text-[#d2cca6] max-w-[90%] leading-relaxed mb-2 font-medium">
            {winReason}
          </p>
        )}

        {/* Stake coins display if any */}
        {isOnlinePlayer && !isDraw && resultStake > 0 && (
          <div className={`text-sm font-extrabold px-3 py-1 rounded-full mb-2 bg-black/30 border ${
            isUserWinner ? 'text-yellow-300 border-yellow-500/40' : 'text-red-400 border-red-500/40'
          }`}>
            {isUserWinner ? `+${formatCoin(resultStake)} Xu` : `-${formatCoin(resultStake)} Xu`}
          </div>
        )}

        {/* Khi có đủ 2 người: hiển thị đếm ngược 20s và nút Ván mới ngay */}
        {hasTwoPlayers && countdown !== null ? (
          <>
            <div className="w-full my-3 py-2.5 px-3.5 rounded-xl bg-black/45 border border-[#848156]/40 flex items-center justify-center gap-2.5 shadow-inner">
              <Clock className="w-4 h-4 text-[#61c887] shrink-0 animate-pulse" />
              <span className="text-xs sm:text-sm font-semibold text-[#f3ead8]">
                Ván mới sẽ bắt đầu sau <strong className="text-[#61c887] font-mono text-base font-extrabold">{countdown}s</strong>
              </span>
            </div>

            <button
              onClick={onStartNewGameNow}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#25593f] to-[#2e6d4e] hover:from-[#2e6d4e] hover:to-[#38855e] text-white text-xs sm:text-sm font-bold shadow-lg border border-[#5ec485]/60 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Ván mới ngay</span>
            </button>
          </>
        ) : (
          /* Khi đối thủ đã rời bàn: KHÔNG đếm ngược, chỉ có nút tiếp tục chờ đối thủ mới hoặc rời bàn */
          <>
            <div className="w-full my-3 py-2.5 px-3 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-center gap-2">
              <Users className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
              <span className="text-xs text-[#fce8ba] font-medium">
                Đối thủ đã rời bàn. Bàn đấu đang trống ghế!
              </span>
            </div>

            {onContinueWaiting && (
              <button
                onClick={onContinueWaiting}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#25593f] to-[#2e6d4e] hover:from-[#2e6d4e] hover:to-[#38855e] text-white text-xs sm:text-sm font-bold shadow-lg border border-[#5ec485]/60 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Ở lại bàn chờ đối thủ mới</span>
              </button>
            )}
          </>
        )}

        {/* Leave Room option */}
        {mode === 'online' && onLeave && (
          <button
            onClick={onLeave}
            className="mt-2.5 flex items-center gap-1.5 text-xs text-[#9ec4ae] hover:text-[#f3ead8] transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Rời bàn</span>
          </button>
        )}
      </div>
    </div>
  );
}

