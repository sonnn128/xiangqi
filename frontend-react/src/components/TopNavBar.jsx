import React from 'react';
import {
  Bot,
  Coins,
  Compass,
  Eye,
  Gift,
  History,
  LayoutDashboard,
  Loader2,
  LogIn,
  LogOut,
  MessageSquare,
  Users,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { renderUserAvatar } from './ProfileModal.jsx';

export function TopNavBar({
  currentRoom,
  handleExitRoom,
  onNavigateHome,
  zenMode,
  setZenMode,
  pathname,
  onSelectLobby,
  onSelectAi,
  onSelectPuzzle,
  handleOpenRoomChat,
  roomChatUnread = 0,
  onOpenQuickMatch,
  userCoins,
  handleClaimDaily,
  claimingDaily,
  currentUser,
  onOpenProfile,
  handleLogout,
  onOpenAuth,
  onOpenHistory,
  onOpenFriends,
  soundEnabled,
  onToggleSound,
}) {
  return (
    <header className="relative z-20 w-full px-3 sm:px-6 py-2.5 bg-[#10261c]/85 backdrop-blur-md border-b border-[#848156]/30">
      <div className="w-full max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {currentRoom ? (
          <button
            onClick={handleExitRoom}
            className="ml-2 sm:ml-6 md:ml-12 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-950/70 hover:bg-red-900/80 border border-red-500/50 text-red-200 text-sm font-bold transition cursor-pointer shadow-md"
          >
            <LogOut className="w-4 h-4" />
            <span>Thoát bàn</span>
          </button>
        ) : (
          <div
            onClick={onNavigateHome}
            className="flex items-center gap-3 cursor-pointer group select-none"
            title="Trở về Sảnh cờ chính"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#f5e4c8] to-[#cfa978] flex items-center justify-center shadow-md border border-[#8a5a32] group-hover:scale-105 transition-transform">
              <span
                className="text-[#9e1c13] font-semibold text-xl leading-none"
                style={{
                  fontFamily: "'LXGW WenKai TC', 'KaiTi', 'Noto Serif TC', serif",
                }}
              >
                帥
              </span>
            </div>
            <div>
              <h1
                className="text-lg sm:text-xl font-bold tracking-wide text-[#f4ead5] flex items-center gap-2 group-hover:text-white transition-colors"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                VÔ DANH KỲ HỮU
              </h1>
            </div>
          </div>
        )}

        {/* Mode Switcher Pills */}
        {!currentRoom && !zenMode && (
          <nav className="flex items-center gap-1 sm:gap-1.5 bg-[#0c1d15]/90 p-1 rounded-xl border border-[#848156]/30">
            <button
              onClick={onSelectLobby}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                pathname === '/' || pathname === '/lobby'
                  ? 'bg-[#25593f] text-[#e8f8ee] shadow border border-[#5ec485]/50'
                  : 'text-[#c2baa3] hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-[#a7f3d0]" />
              <span>Sảnh Cờ</span>
            </button>

            <button
              onClick={onSelectAi}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                pathname === '/ai'
                  ? 'bg-[#25593f] text-[#e8f8ee] shadow border border-[#5ec485]/50'
                  : 'text-[#c2baa3] hover:text-white hover:bg-white/5'
              }`}
            >
              <Bot className="w-4 h-4 text-[#66c989]" />
              <span>Luyện tập với Bot</span>
            </button>

            <button
              onClick={onSelectPuzzle}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                pathname === '/puzzle'
                  ? 'bg-[#25593f] text-[#e8f8ee] shadow border border-[#5ec485]/50'
                  : 'text-[#c2baa3] hover:text-white hover:bg-white/5'
              }`}
            >
              <Compass className="w-4 h-4 text-[#f472b6]" />
              <span>Cờ Thế</span>
            </button>
          </nav>
        )}

        {/* User Account, Coins & Quick Play Bar */}
        {currentRoom ? (
          <button
            onClick={handleOpenRoomChat}
            className="mr-2 sm:mr-6 md:mr-12 relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#153124] hover:bg-[#1e4432] border border-[#5ec485]/45 text-[#bbf7d0] text-sm font-bold transition cursor-pointer shadow-md"
            title="Mở chat trong phòng"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat</span>
            {roomChatUnread > 0 && (
              <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-[#10261c]">
                {roomChatUnread > 9 ? '9+' : roomChatUnread}
              </span>
            )}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            {/* Quick Match Lightning Button */}
            <button
              onClick={onOpenQuickMatch}
              title="Ghép trận online nhanh"
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-stone-950 text-xs font-bold shadow-md flex items-center gap-1.5 transition-transform hover:scale-105 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Chơi Nhanh</span>
            </button>

            {/* User Coins Badge */}
            <div
              title="Số xu hiện có"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0e2419] border border-[#facc15]/40 text-[#fef08a] text-xs font-bold shadow-inner"
            >
              <Coins className="w-4 h-4 text-[#fbbf24]" />
              <span className="font-mono">{userCoins?.toLocaleString('vi-VN')}</span>
              <span className="text-[10px] text-[#facc15] font-normal">xu</span>
            </div>

            {/* Daily Bonus Claim Button */}
            <button
              onClick={handleClaimDaily}
              disabled={claimingDaily}
              title="Điểm danh mỗi ngày nhận +10.000 xu"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#1b4332] hover:bg-[#245942] text-[#8ce8b1] border border-[#5ec485]/40 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              {claimingDaily ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#fbbf24]" />
              ) : (
                <Gift className="w-3.5 h-3.5 text-[#fbbf24]" />
              )}
              <span>+10k xu</span>
            </button>

            {/* User Auth Info */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-1 border-l border-white/10">
                <button
                  onClick={onOpenProfile}
                  className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition bg-black/25 hover:bg-black/45 px-2.5 py-1 rounded-xl border border-white/10"
                  title={`Xem và sửa hồ sơ kỳ thủ: ${currentUser.totalMatches ?? 0} trận · Thắng ${currentUser.winRate ?? 0}%`}
                >
                  {renderUserAvatar(currentUser.avatar, 'w-6 h-6', 'text-xs')}
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-[#8ce8b1] max-w-[100px] truncate leading-tight">
                      {currentUser.displayName || currentUser.username}
                    </span>
                    <span className="text-[9px] text-[#fef08a] font-medium leading-tight">
                      {currentUser.totalMatches ?? 0} trận ({currentUser.winRate ?? 0}%)
                    </span>
                  </div>
                </button>
                <button
                  onClick={handleLogout}
                  title="Đăng xuất"
                  className="p-1.5 rounded-lg text-red-300 hover:text-white hover:bg-red-950/50 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#92400e] hover:bg-[#b45309] text-[#fef3c7] border border-[#facc15]/40 flex items-center gap-1.5 transition cursor-pointer shadow"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng nhập</span>
              </button>
            )}

            {/* Match History Button */}
            <button
              onClick={onOpenHistory}
              title="Xem lịch sử đấu và biên bản ván cờ"
              className="p-2 rounded-lg bg-[#153124] hover:bg-[#1e4432] text-[#93c5fd] border border-[#3b82f6]/40 transition cursor-pointer"
            >
              <History className="w-4 h-4 text-[#60a5fa]" />
            </button>

            {/* Friends & Direct Chat Button */}
            <button
              onClick={onOpenFriends}
              title="Kỳ hữu & Chat bạn bè"
              className="p-2 rounded-lg bg-[#153124] hover:bg-[#1e4432] text-[#7dd3fc] border border-[#38bdf8]/40 transition cursor-pointer"
            >
              <Users className="w-4 h-4 text-[#38bdf8]" />
            </button>

            {/* Sound Toggle */}
            <button
              onClick={onToggleSound}
              title="Bật/tắt âm thanh quân cờ"
              className="p-2 rounded-lg bg-[#153124] hover:bg-[#1e4432] text-[#d2cca6] border border-[#848156]/40 transition cursor-pointer"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-[#66c989]" />
              ) : (
                <VolumeX className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {/* Zen Mode */}
            <button
              onClick={() => setZenMode?.((z) => !z)}
              title="Ẩn/hiện menu điều khiển"
              className={`p-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                zenMode
                  ? 'bg-[#25593f] text-[#8ce8b1] border-[#5ec485]'
                  : 'bg-[#153124] text-[#d2cca6] border-[#848156]/40 hover:bg-[#1e4432]'
              }`}
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
