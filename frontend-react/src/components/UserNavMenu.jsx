import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  Coins,
  Eye,
  History,
  Loader2,
  LogIn,
  LogOut,
  Settings,
  Trophy,
  Users,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react';
import { renderUserAvatar } from './ProfileModal.jsx';

export const STATUS_OPTIONS = [
  { id: 'online', label: 'Trực tuyến', color: 'bg-emerald-500', dot: 'bg-emerald-500' },
  { id: 'idle', label: 'Đang rảnh', color: 'bg-emerald-400', dot: 'bg-emerald-400' },
  { id: 'away', label: 'Vắng mặt', color: 'bg-amber-400', dot: 'bg-amber-400' },
  { id: 'busy', label: 'Đang bận', color: 'bg-orange-500', dot: 'bg-orange-500' },
  { id: 'invisible', label: 'Ẩn danh', color: 'bg-slate-400', dot: 'bg-slate-400' },
];

function getPlayerRank(totalMatches = 0, winRate = 0) {
  if (totalMatches >= 100 && winRate >= 65) return { title: 'Đại Sư', badge: '👑' };
  if (totalMatches >= 50 && winRate >= 55) return { title: 'Cao Thủ', badge: '🥇' };
  if (totalMatches >= 20) return { title: 'Kỳ Thủ', badge: '🥈' };
  if (totalMatches >= 5) return { title: 'Phong trào', badge: '🥉' };
  return { title: 'Tập sự', badge: '🎖️' };
}

export function UserNavMenu({
  currentUser,
  userCoins,
  onOpenProfile,
  handleLogout,
  onOpenAuth,
  onOpenHistory,
  onOpenFriends,
  handleClaimDaily,
  claimingDaily,
  soundEnabled,
  onToggleSound,
  zenMode,
  setZenMode,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState(() => {
    try {
      return localStorage.getItem('xiangqi_player_status') || 'away';
    } catch {
      return 'away';
    }
  });

  const menuRef = useRef(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectStatus = (newStatus) => {
    setStatus(newStatus);
    try {
      localStorage.setItem('xiangqi_player_status', newStatus);
    } catch {
      // Ignore
    }
  };

  const currentStatus =
    STATUS_OPTIONS.find((s) => s.id === status) || STATUS_OPTIONS[0];

  const rankInfo = getPlayerRank(
    currentUser?.totalMatches ?? 0,
    currentUser?.winRate ?? 0
  );

  // When not logged in: compact login button
  if (!currentUser) {
    return (
      <button
        onClick={onOpenAuth}
        className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#92400e] hover:bg-[#b45309] text-[#fef3c7] border border-[#facc15]/40 flex items-center gap-2 transition cursor-pointer shadow-md"
      >
        <LogIn className="w-3.5 h-3.5" />
        <span>Đăng nhập</span>
      </button>
    );
  }

  const displayName = currentUser.displayName || currentUser.username || 'Kỳ Hữu';
  const formattedCoins = Number(userCoins ?? 0).toLocaleString('vi-VN');

  return (
    <div className="relative" ref={menuRef}>
      {/* TRIGGER PILL (exact match with media_1794421177272_011cdb97.png) */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full transition-all cursor-pointer border select-none ${
          isOpen
            ? 'bg-[#1a3829] border-[#5ec485] shadow-lg ring-2 ring-[#5ec485]/30'
            : 'bg-[#0f241a]/95 hover:bg-[#153424] border-[#848156]/35 hover:border-[#848156]/70 shadow'
        }`}
        title="Menu tài khoản kỳ thủ"
      >
        {/* Avatar with status indicator dot */}
        <div className="relative flex-shrink-0">
          {renderUserAvatar(currentUser.avatar, 'w-7 h-7 sm:w-8 sm:h-8', 'text-sm')}
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0f241a] shadow-sm ${currentStatus.dot}`}
          />
        </div>

        {/* Name and Coins */}
        <div className="flex flex-col text-left leading-tight min-w-0 pr-1">
          <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[110px] sm:max-w-[130px]">
            {displayName}
          </span>
          <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="font-mono">{formattedCoins}</span>
          </span>
        </div>

        {/* Chevron down icon */}
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-white' : ''
          }`}
        />
      </button>

      {/* DROPDOWN MENU (exact match with media_1794421205877_85c0cb8a.png) */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-[#12241b] border border-[#848156]/40 shadow-[0_20px_60px_rgba(0,0,0,0.85)] backdrop-blur-xl p-4 text-[#e8f8ee] flex flex-col gap-3.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header profile card */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex-shrink-0">
                {renderUserAvatar(currentUser.avatar, 'w-12 h-12', 'text-2xl')}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#12241b] ${currentStatus.dot}`}
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm text-white truncate">
                  {displayName}
                </span>
                <span className="text-xs text-[#a7b5ab] truncate">
                  Người chơi cờ tướng
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenProfile?.();
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition cursor-pointer flex-shrink-0"
              title="Chỉnh sửa hồ sơ"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* 2-column stats cards: Vàng & Cấp bậc */}
          <div className="grid grid-cols-2 gap-2">
            {/* Card 1: Vàng */}
            <div className="bg-[#091710] border border-[#848156]/25 rounded-xl p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-amber-300 font-medium">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>Vàng</span>
                </span>
                {handleClaimDaily && (
                  <button
                    onClick={handleClaimDaily}
                    disabled={claimingDaily}
                    className="text-[10px] text-emerald-400 hover:underline cursor-pointer disabled:opacity-50"
                    title="Điểm danh nhận +10.000 xu"
                  >
                    {claimingDaily ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      '+10k xu'
                    )}
                  </button>
                )}
              </div>
              <div className="text-base font-extrabold text-amber-400 font-mono mt-1">
                {formattedCoins}
              </div>
            </div>

            {/* Card 2: Cấp bậc */}
            <div className="bg-[#091710] border border-[#848156]/25 rounded-xl p-3 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-xs text-rose-300 font-medium">
                <Trophy className="w-3.5 h-3.5 text-rose-400" />
                <span>Cấp bậc</span>
              </div>
              <div className="text-xs font-bold text-[#e8f8ee] mt-1 flex items-center gap-1 truncate">
                <span>{rankInfo.badge}</span>
                <span>{rankInfo.title}</span>
              </div>
            </div>
          </div>

          {/* Status selector (Trạng thái) */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[#a7b5ab]">Trạng thái</span>
            <div className="grid grid-cols-2 gap-1.5 bg-[#091710] p-1.5 rounded-xl border border-[#848156]/20">
              {STATUS_OPTIONS.map((opt) => {
                const isSelected = status === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectStatus(opt.id)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                      isSelected
                        ? 'bg-slate-700/60 text-white font-bold shadow'
                        : 'text-slate-400 hover:text-white hover:bg-white/5 font-medium'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick shortcuts */}
          <div className="flex flex-col gap-1 pt-1.5 border-t border-[#848156]/20">
            {onOpenHistory && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenHistory();
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition cursor-pointer"
              >
                <History className="w-4 h-4 text-sky-400" />
                <span>Lịch sử ván đấu & biên bản</span>
              </button>
            )}

            {onOpenFriends && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenFriends();
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition cursor-pointer"
              >
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Kỳ hữu & Chat bạn bè</span>
              </button>
            )}

            {onToggleSound && (
              <button
                onClick={onToggleSound}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-500" />
                  )}
                  <span>Âm thanh bàn cờ</span>
                </div>
                <span className="text-[11px] text-[#a7b5ab]">
                  {soundEnabled ? 'Bật' : 'Tắt'}
                </span>
              </button>
            )}

            {setZenMode && (
              <button
                onClick={() => setZenMode((z) => !z)}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span>Chế độ Zen (Tập trung)</span>
                </div>
                <span className="text-[11px] text-[#a7b5ab]">
                  {zenMode ? 'Bật' : 'Tắt'}
                </span>
              </button>
            )}
          </div>

          {/* Logout button */}
          <div className="pt-2 border-t border-[#848156]/20">
            <button
              onClick={() => {
                setIsOpen(false);
                handleLogout?.();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-950/40 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

