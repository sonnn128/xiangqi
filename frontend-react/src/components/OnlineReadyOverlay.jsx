import React, { useEffect, useState } from 'react';
import { Swords, CheckCircle2, Clock, Users, Copy, Check } from 'lucide-react';
import { soundFX } from '../utils/sound.js';

export default function OnlineReadyOverlay({
  currentRoom,
  currentUser,
  playerName,
  onSetReady,
  onReadyTimeout,
  onCopyRoomCode,
}) {
  const [countdown, setCountdown] = useState(20);
  const [copied, setCopied] = useState(false);

  const myUsername = currentUser?.username || playerName;
  const isRed = currentRoom?.redPlayer === myUsername;
  const isBlack = currentRoom?.blackPlayer === myUsername;
  const isParticipant = isRed || isBlack;

  const hasTwoPlayers = Boolean(currentRoom?.redPlayer && currentRoom?.blackPlayer);
  const isMyReady = isRed ? currentRoom?.redReady : isBlack ? currentRoom?.blackReady : false;

  // Countdown timer: ticks when both players are present and game is waiting
  useEffect(() => {
    if (!hasTwoPlayers || currentRoom?.status !== 'WAITING') {
      setCountdown(20);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (isParticipant) onReadyTimeout?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasTwoPlayers, currentRoom?.status, isParticipant, isMyReady, onReadyTimeout]);

  const handleButtonClick = () => {
    soundFX.playSelect();
    if (!isMyReady) {
      onSetReady(true);
    } else {
      onSetReady(false);
    }
  };

  const handleCopy = () => {
    if (onCopyRoomCode) {
      onCopyRoomCode(currentRoom?.roomId);
    } else {
      navigator.clipboard.writeText(currentRoom?.roomId || '');
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-between p-4 sm:p-6 bg-black/60 backdrop-blur-[3px] select-none animate-fade-in">
      {/* Center Section: Chuẩn bị, Swords & Big 3D Button */}
      <div className="flex flex-col items-center justify-center text-center my-auto px-4 py-2">
        {/* Calligraphic Title "Chuẩn bị" */}
        <h1
          className="text-4xl sm:text-5xl font-extrabold tracking-widest uppercase mb-1"
          style={{
            fontFamily: "'LXGW WenKai TC', 'KaiTi', 'Noto Serif TC', serif",
            color: '#ffdd73',
            textShadow:
              '0 0 20px rgba(255, 221, 115, 0.6), 0 0 40px rgba(217, 130, 20, 0.4), 0 4px 8px rgba(0,0,0,0.9)',
          }}
        >
          Chuẩn bị
        </h1>

        {/* Animated Crossed Swords */}
        <div className="relative my-2">
          <div className="w-14 h-14 rounded-full bg-gradient-to-b from-[#4a2e0e]/80 to-[#1e1306]/90 border border-[#ffd269]/60 shadow-[0_0_25px_rgba(255,210,105,0.35)] flex items-center justify-center">
            <Swords className="w-7 h-7 text-[#ffe699] animate-pulse" />
          </div>
        </div>

        {/* Match Specs / Stakes matching user image */}
        <div className="w-full max-w-xs flex items-center justify-between text-[11px] text-[#fce8ba] font-medium px-2 py-1 mb-3">
          <div className="flex flex-col items-start leading-tight">
            <span>Cờ tướng</span>
            <span className="text-yellow-400 font-bold">
              {currentRoom?.betCoins > 0
                ? `${Number(currentRoom.betCoins).toLocaleString()} xu`
                : 'Giao hữu'}
            </span>
          </div>
          <div className="flex flex-col items-end leading-tight">
            <span>10'/ván</span>
            <span className="text-yellow-400 font-bold">60s/nước</span>
          </div>
        </div>

        {/* Ready Action or Waiting for 2nd Player */}
        {!hasTwoPlayers ? (
          <div className="bg-[#142c1f]/90 border border-[#6ec48c]/40 rounded-2xl p-4 shadow-2xl flex flex-col items-center gap-2.5 max-w-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <Users className="w-4 h-4 animate-bounce" />
              <span>Đang đợi kỳ hữu vào bàn...</span>
            </div>
            <div className="text-[11px] text-[#d2cca6]">
              Chia sẻ mã phòng cho bạn bè:
            </div>
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/15">
              <span className="font-mono font-bold text-sm text-yellow-300 tracking-wider">
                {currentRoom?.roomId}
              </span>
              <button
                onClick={handleCopy}
                className="p-1 rounded hover:bg-white/10 text-[#d2cca6] hover:text-white transition cursor-pointer"
                title="Sao chép mã phòng"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            {/* Big 3D Wooden-Golden Button */}
            {isParticipant ? (
              <button
                onClick={handleButtonClick}
                className={`group relative px-10 py-3.5 rounded-2xl font-black text-lg tracking-wider uppercase transition-all duration-150 cursor-pointer ${
                  isMyReady
                    ? 'bg-gradient-to-b from-[#2b6b47] via-[#1d5234] to-[#123822] text-[#bbf7d0] border-2 border-[#4ade80] shadow-[0_6px_0_#0f2e1c,0_10px_20px_rgba(0,0,0,0.6)]'
                    : 'bg-gradient-to-b from-[#ffdf80] via-[#e5a823] to-[#ad6c0a] text-[#422204] border-2 border-[#fff0ad] shadow-[0_7px_0_#6b4103,0_12px_22px_rgba(0,0,0,0.7)] hover:brightness-105 active:translate-y-1 active:shadow-[0_2px_0_#6b4103]'
                }`}
                style={{
                  fontFamily: "'LXGW WenKai TC', 'KaiTi', serif",
                }}
              >
                <div className="flex items-center gap-2.5">
                  {isMyReady ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                      <span>Đã sẵn sàng</span>
                    </>
                  ) : (
                    <>
                      <Swords className="w-5 h-5 fill-current opacity-80" />
                      <span>Bắt đầu</span>
                    </>
                  )}
                </div>
              </button>
            ) : (
              <div className="px-6 py-2.5 rounded-xl bg-black/60 border border-white/20 text-xs text-yellow-200">
                Bạn đang xem trận đấu (Khán giả)
              </div>
            )}

            {/* 20-second countdown indicator */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 border border-white/10 text-xs text-[#eedcb4]">
              <Clock className="w-3.5 h-3.5 text-yellow-400 animate-spin" style={{ animationDuration: '4s' }} />
              <span>Thời gian chuẩn bị:</span>
              <span className="font-mono font-extrabold text-sm text-yellow-300">
                {countdown}s
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="text-[11px] text-[#b8ae93]/80 text-center">
        {hasTwoPlayers
          ? isMyReady
            ? 'Đang chờ đối thủ nhấn Sẵn sàng (hết 20s không sẵn sàng sẽ bị mời ra khỏi bàn)...'
            : 'Vui lòng nhấn Bắt đầu trong 20s, nếu không bạn sẽ bị mời ra khỏi bàn!'
          : 'Trận đấu sẽ bắt đầu đếm ngược 20s ngay khi đối thủ vào bàn.'}
      </div>
    </div>
  );
}

