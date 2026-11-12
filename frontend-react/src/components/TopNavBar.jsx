import React from 'react';
import {
  Bot,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  PenTool,
  Zap,
} from 'lucide-react';
import { UserNavMenu } from './UserNavMenu.jsx';

export function TopNavBar({
  currentRoom,
  handleExitRoom,
  onNavigateHome,
  zenMode,
  setZenMode,
  pathname,
  onSelectLobby,
  onSelectAi,
  onSelectEditor,
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
              onClick={onSelectEditor}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                pathname === '/editor'
                  ? 'bg-[#25593f] text-[#e8f8ee] shadow border border-[#5ec485]/50'
                  : 'text-[#c2baa3] hover:text-white hover:bg-white/5'
              }`}
            >
              <PenTool className="w-4 h-4 text-[#fbbf24]" />
              <span>Xếp Cờ Thế</span>
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
          <div className="flex items-center gap-2.5">
            {/* Quick Match Lightning Button */}
            {onOpenQuickMatch && (
              <button
                onClick={onOpenQuickMatch}
                title="Ghép trận online nhanh"
                className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-stone-950 text-xs font-bold shadow-md flex items-center gap-1.5 transition-transform hover:scale-105 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Chơi Nhanh</span>
              </button>
            )}

            {/* Consolidated User Profile Menu Dropdown */}
            <UserNavMenu
              currentUser={currentUser}
              userCoins={userCoins}
              onOpenProfile={onOpenProfile}
              handleLogout={handleLogout}
              onOpenAuth={onOpenAuth}
              onOpenHistory={onOpenHistory}
              onOpenFriends={onOpenFriends}
              handleClaimDaily={handleClaimDaily}
              claimingDaily={claimingDaily}
              soundEnabled={soundEnabled}
              onToggleSound={onToggleSound}
              zenMode={zenMode}
              setZenMode={setZenMode}
            />
          </div>
        )}
      </div>
    </header>
  );
}
