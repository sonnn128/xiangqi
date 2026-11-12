import React, { useState } from 'react';
import {
  Bot,
  Coins,
  Compass,
  Copy,
  Eye,
  Filter,
  Flame,
  Globe,
  History,
  Loader2,
  Lock,
  PenTool,
  Percent,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Swords,
  Trophy,
  UserCheck,
  UserPlus,
  UserX,
  Users,
  Zap,
} from 'lucide-react';
import { BET_TIERS } from './QuickMatchModal.jsx';
import { renderUserAvatar } from './ProfileModal.jsx';

export function XiangqiLobby({
  currentUser,
  userCoins,
  playerName,
  onlineRooms = [],
  backendConnected,
  loadingRooms = false,
  joiningRoomId = null,
  onRefreshRooms,
  onQuickMatch,
  onJoinRoom,
  onKickPlayer,
  onCreateRoom,
  onOpenAuth,
  onClaimDaily,
  onOpenGlobalChat,
  onOpenHistory,
  onOpenFriends,
  onSelectMode,
  showToast,
}) {
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'waiting', 'playing'
  const [betFilter, setBetFilter] = useState('all'); // 'all', 'free', 'low', 'mid', 'high'
  const [searchQuery, setSearchQuery] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');

  // Create Room Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [customBet, setCustomBet] = useState(10000);
  const [timeLimit, setTimeLimit] = useState(600); // 300, 600, 900
  const [moveTimeLimit, setMoveTimeLimit] = useState(60);
  const [creating, setCreating] = useState(false);

  const RANDOM_ROOM_TITLES = [
    'Kỳ Đài Thượng Đỉnh',
    'Phong Vân Kỳ Hội',
    'Long Hổ Tranh Đấu',
    'Thanh Phong Luận Cờ',
    'Kỳ Nghệ Đối Quyết',
    'Bách Chiến Kỳ Đài',
    'Ngọa Hổ Tàng Long',
    'Hào Kiệt Tương Phùng',
    'Tiếu Ngạo Kỳ Đàn',
    'Vô Danh Kỳ Quán',
    'Thiên Hạ Đệ Nhất Bàn',
    'Anh Hùng Tương Hội',
  ];

  const getRandomRoomTitle = () => {
    const title = RANDOM_ROOM_TITLES[Math.floor(Math.random() * RANDOM_ROOM_TITLES.length)];
    const num = Math.floor(100 + Math.random() * 900);
    return `${title} #${num}`;
  };

  // Filter logic
  const filteredRooms = onlineRooms.filter((rm) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = rm.roomName?.toLowerCase().includes(q);
      const matchId = rm.roomId?.toLowerCase().includes(q);
      const matchPlayer =
        rm.redPlayer?.toLowerCase().includes(q) ||
        rm.blackPlayer?.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchPlayer) return false;
    }

    // Status filter
    if (activeTab === 'waiting' && rm.status === 'PLAYING') return false;
    if (activeTab === 'playing' && rm.status !== 'PLAYING') return false;

    // Bet filter
    const bet = rm.betCoins || 0;
    if (betFilter === 'free' && bet > 0) return false;
    if (betFilter === 'low' && (bet < 1000 || bet > 10000)) return false;
    if (betFilter === 'mid' && (bet < 20000 || bet > 100000)) return false;
    if (betFilter === 'high' && bet < 200000) return false;

    return true;
  });

  const activeGameRoom = currentUser?.username
    ? onlineRooms.find(
        (room) =>
          room.status === 'PLAYING' &&
          (room.redPlayer === currentUser.username || room.blackPlayer === currentUser.username)
      )
    : null;

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (customBet > (userCoins ?? 20000) && currentUser) {
      if (showToast) {
        showToast({
          type: 'warning',
          title: 'KHÔNG ĐỦ XU CƯỢC',
          message: `Số dư hiện tại (${userCoins?.toLocaleString('vi-VN')} xu) không đủ mức cược ${customBet.toLocaleString('vi-VN')} xu.`,
        });
      }
      return;
    }

    setCreating(true);
    try {
      await onCreateRoom({
        roomName: getRandomRoomTitle(),
        preferredSide: 'red',
        betCoins: customBet,
        timeLimitSeconds: timeLimit,
        moveTimeLimitSeconds: moveTimeLimit,
      });
      setShowCreateModal(false);
    } catch {
      if (showToast) {
        showToast({
          type: 'error',
          title: 'LỖI TẠO BÀN CỜ',
          message: 'Không thể tạo bàn cờ, vui lòng thử lại sau!',
        });
      }
    } finally {
      setCreating(false);
    }
  };

  const formatCoinBadge = (c) => {
    if (!c || c === 0) return 'Miễn phí';
    if (c >= 1000000) return `${(c / 1000000).toFixed(c % 1000000 === 0 ? 0 : 1)}M xu`;
    if (c >= 1000) return `${Math.floor(c / 1000)}k xu`;
    return `${c} xu`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-4 flex flex-col gap-6 animate-fade-in text-[#f3ead8]">
      {activeGameRoom && (
        <button
          onClick={() => onJoinRoom(activeGameRoom.roomId, 'auto')}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-[#25593f] to-[#1b4332] hover:from-[#2e6d4e] hover:to-[#25593f] border border-[#5ec485]/60 text-left shadow-lg transition cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#fbbf24] text-[#422006] flex items-center justify-center shrink-0">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-white truncate">Bạn đang có một ván đấu</div>
              <div className="text-[11px] text-[#b8e8c8] truncate">
                {activeGameRoom.roomName} · Mã {activeGameRoom.roomId}
              </div>
            </div>
          </div>
          <span className="shrink-0 px-3 py-1.5 rounded-xl bg-[#fbbf24] text-[#422006] text-xs font-bold">
            Tiếp tục ván
          </span>
        </button>
      )}

      {/* KỲ THỦ STATS BANNER (Khi đã đăng nhập) */}
      {currentUser && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-[#142d20]/95 via-[#0e2118]/95 to-[#142d20]/95 border border-[#5ec485]/35 shadow-lg">
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            {renderUserAvatar(currentUser.avatar, 'w-12 h-12', 'text-2xl')}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-[#fef3c7] truncate">
                  {currentUser.displayName || currentUser.username}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-[#8ce8b1] border border-emerald-500/40">
                  Kỳ thủ
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#a7b5ab] mt-0.5">
                <span className="flex items-center gap-1 text-[#fef08a] font-mono font-bold">
                  <Coins className="w-3.5 h-3.5 text-yellow-400" />
                  {Number(userCoins ?? 20000).toLocaleString('vi-VN')} xu
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats Summary */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-around sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-white/10">
            <div className="flex flex-col items-center sm:items-end px-3 py-1 rounded-xl bg-black/30 border border-white/5">
              <span className="text-[10px] text-stone-400 flex items-center gap-1">
                <Swords className="w-2.5 h-2.5 text-cyan-400" /> Số trận
              </span>
              <span className="text-sm font-bold text-white">{currentUser.totalMatches ?? 0}</span>
            </div>
            <div className="flex flex-col items-center sm:items-end px-3 py-1 rounded-xl bg-black/30 border border-white/5">
              <span className="text-[10px] text-stone-400 flex items-center gap-1">
                <Percent className="w-2.5 h-2.5 text-emerald-400" /> Tỉ lệ thắng
              </span>
              <span className="text-sm font-bold text-[#fef08a]">{currentUser.winRate ?? 0}%</span>
            </div>
            <div className="flex flex-col items-center sm:items-end px-3 py-1 rounded-xl bg-black/30 border border-white/5">
              <span className="text-[10px] text-stone-400 flex items-center gap-1">
                <Trophy className="w-2.5 h-2.5 text-yellow-400" /> Thành tích
              </span>
              <span className="text-xs font-semibold text-[#8ce8b1]">
                <span className="text-emerald-400">{currentUser.wins ?? 0}T</span> ·{' '}
                <span className="text-stone-300">{currentUser.draws ?? 0}H</span> ·{' '}
                <span className="text-rose-400">{currentUser.losses ?? 0}B</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3 GATEWAY CARDS: Chơi Nhanh, Chơi Với Bạn, Chọn Bàn */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Chơi Nhanh */}
        <div
          onClick={() => onQuickMatch()}
          className="group relative p-5 rounded-2xl bg-gradient-to-br from-[#123022]/90 to-[#0c1f16]/90 border border-[#5ec485]/40 hover:border-[#5ec485] shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(34,197,94,0.2)] cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#facc15] to-[#ca8a04] flex items-center justify-center text-[#422006] shadow-md group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            {/* <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40">
              Ghép 3 giây
            </span> */}
          </div>
          <div className="mt-4">
            <h3
              className="text-xl font-bold text-[#fef3c7] group-hover:text-white transition-colors"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              CHƠI NHANH
            </h3>
            <p className="text-xs text-[#a7b5ab] mt-1">
              Tự động tìm kiếm kỳ thủ ngang tài cùng mức cược hoặc tự khởi tạo bàn chờ người vào.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-[#8ce8b1]">
            <span>Vào ghép trận ngay</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>

        {/* Card 2: Chơi Với Bạn */}
        <div
          onClick={() => setShowCreateModal(true)}
          className="group relative p-5 rounded-2xl bg-gradient-to-br from-[#182e38]/90 to-[#0e1d24]/90 border border-[#38bdf8]/40 hover:border-[#38bdf8] shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(56,189,248,0.2)] cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#38bdf8] to-[#0284c7] flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
              <UserPlus className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-500/40">
              Tạo bàn riêng
            </span>
          </div>
          <div className="mt-4">
            <h3
              className="text-xl font-bold text-[#fef3c7] group-hover:text-white transition-colors"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              CHƠI VỚI BẠN
            </h3>
            <p className="text-xs text-[#a7b5ab] mt-1">
              Tạo bàn cờ tùy biến mức cược, lấy mã phòng gửi bạn bè để cùng tỉ thí ván cờ tao nhã.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-[#38bdf8]">
            <span>Mở bàn & Chia sẻ mã</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>

        {/* Card 3: Nhập Mã Phòng */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#272115]/90 to-[#18140c]/90 border border-[#f59e0b]/40 shadow-lg flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#fbbf24] to-[#d97706] flex items-center justify-center text-[#451a03] shadow-md">
              <Lock className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/40">
              Vào trực tiếp
            </span>
          </div>
          <div className="mt-4">
            <h3
              className="text-xl font-bold text-[#fef3c7]"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              VÀO BẰNG MÃ PHÒNG
            </h3>
            <p className="text-xs text-[#a7b5ab] mt-1">
              Nhập mã phòng được bạn bè chia sẻ để tham gia trực tiếp vào bàn cờ.
            </p>
          </div>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
              placeholder="VD: VDKH01"
              className="flex-1 px-3 py-1.5 rounded-xl bg-black/45 border border-white/15 text-xs text-white uppercase font-mono tracking-wider focus:outline-none focus:border-[#fbbf24]"
            />
            <button
              onClick={() => {
                if (roomCodeInput.trim()) {
                  onJoinRoom(roomCodeInput.trim(), 'auto');
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-[#d97706] hover:bg-[#b45309] text-xs font-bold text-white transition cursor-pointer"
            >
              Vào
            </button>
          </div>
        </div>
      </div>

      {/* Chế độ chơi khác: Luyện tập với Bot, Xếp Cờ Thế */}
      {onSelectMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            onClick={() => onSelectMode('ai')}
            className="p-3.5 rounded-2xl bg-[#0d2218]/80 hover:bg-[#133022] border border-[#5ec485]/30 hover:border-[#5ec485]/70 transition-all cursor-pointer flex items-center gap-3 group shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-[#1b4332] text-[#8ce8b1] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5 text-[#66c989]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-[#e8f8ee] group-hover:text-[#8ce8b1] transition-colors">
                Luyện Tập Với Bot
              </div>
              <div className="text-[11px] text-[#a7b5ab] truncate">
                Luyện cờ 4 cấp độ: Tập Sự, Kỳ Thủ, Cao Thủ, Đại Sư
              </div>
            </div>
            <span className="text-xs text-[#8ce8b1] font-bold group-hover:translate-x-1 transition-transform">→</span>
          </div>

          <div
            onClick={() => onSelectMode('editor')}
            className="p-3.5 rounded-2xl bg-[#0d2218]/80 hover:bg-[#133022] border border-[#fbbf24]/30 hover:border-[#fbbf24]/70 transition-all cursor-pointer flex items-center gap-3 group shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-[#382b13] text-[#fbbf24] flex items-center justify-center group-hover:scale-105 transition-transform">
              <PenTool className="w-5 h-5 text-[#fbbf24]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-[#e8f8ee] group-hover:text-[#fbbf24] transition-colors">
                Xếp Cờ Thế
              </div>
              <div className="text-[11px] text-[#a7b5ab] truncate">
                Tự do bày cờ, xuất nhập FEN & chơi thử với AI
              </div>
            </div>
            <span className="text-xs text-[#fbbf24] font-bold group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>
      )}

      {/* DANH SÁCH BÀN CỜ (CHỌN BÀN) */}
      <div className="rounded-3xl p-5 sm:p-6 bg-[#0f2319]/90 border border-[#848156]/35 shadow-xl flex flex-col gap-4">
        {/* Toolbar: Search, Filters & Create Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <h2
              className="text-xl font-bold text-[#fef3c7] flex items-center gap-2"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              DANH SÁCH BÀN CỜ
              <span className="text-xs font-sans font-semibold px-2 py-0.5 rounded-full bg-black/40 text-[#8ce8b1] border border-white/10 flex items-center gap-1.5">
                {onlineRooms.length} bàn đang mở
              </span>
            </h2>
            {onRefreshRooms && (
              <button
                onClick={onRefreshRooms}
                disabled={loadingRooms}
                className="p-1.5 rounded-xl bg-black/30 hover:bg-black/50 text-[#8ce8b1] hover:text-white border border-white/10 transition cursor-pointer disabled:opacity-50"
                title="Làm mới danh sách bàn cờ"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingRooms ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên bàn, mã phòng..."
                className="w-full px-3 py-1.5 pl-8 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder:text-gray-400 focus:outline-none focus:border-[#5ec485]"
              />
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
            </div>

            {/* Create Room Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#15803d] to-[#16a34a] hover:from-[#166534] hover:to-[#15803d] text-white text-xs font-bold shadow flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Bàn Mới</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-black/35 p-1 rounded-xl border border-white/10">
            {[
              { id: 'all', label: 'Tất Cả' },
              { id: 'waiting', label: 'Đang Chờ Ghép' },
              { id: 'playing', label: 'Đang Thi Đấu' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#25593f] text-[#e8f8ee] border border-[#5ec485]/40 shadow-sm'
                    : 'text-[#c2baa3] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Bet Tier Filters */}
          <div className="flex items-center gap-1 bg-black/35 p-1 rounded-xl border border-white/10 overflow-x-auto">
            <span className="text-[10px] uppercase font-bold text-[#8fa195] px-2 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Cược:
            </span>
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'free', label: '0 xu' },
              { id: 'low', label: '1k - 10k' },
              { id: 'mid', label: '20k - 100k' },
              { id: 'high', label: '200k+' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setBetFilter(f.id)}
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                  betFilter === f.id
                    ? 'bg-[#854d0e] text-[#fef08a] border border-[#facc15]/40'
                    : 'text-[#c2baa3] hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Chinese Chess Table Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
          {loadingRooms && onlineRooms.length === 0 ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-[#142d20]/50 border border-white/5 animate-pulse flex flex-col justify-between gap-3 min-h-[160px]"
              >
                <div className="flex justify-between items-center">
                  <div className="h-4 w-32 bg-white/10 rounded" />
                  <div className="h-4 w-16 bg-white/10 rounded-full" />
                </div>
                <div className="h-16 bg-black/25 rounded-xl border border-white/5" />
                <div className="flex justify-between items-center pt-1">
                  <div className="h-3 w-20 bg-white/10 rounded" />
                  <div className="h-7 w-20 bg-white/10 rounded-xl" />
                </div>
              </div>
            ))
          ) : filteredRooms.length === 0 ? (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-center text-xs text-[#8fa195]">
              <Users className="w-12 h-12 text-[#5ec485]/30 mb-2" />
              <p className="text-sm font-semibold text-[#f3ead8]">
                Không tìm thấy bàn cờ nào phù hợp
              </p>
              <p className="text-xs text-[#7d8f83] mt-1 max-w-sm">
                Hãy đổi bộ lọc hoặc tạo một bàn cược mới để mọi người vào giao lưu nhé!
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-[#25593f] hover:bg-[#2e6d4e] text-white font-bold transition cursor-pointer"
              >
                Tạo Bàn Ngay Bây Giờ
              </button>
            </div>
          ) : (
            filteredRooms.map((rm) => {
              const isPlaying = rm.status === 'PLAYING';
              const hasRed = Boolean(rm.redPlayer);
              const hasBlack = Boolean(rm.blackPlayer);
              const isFull = hasRed && hasBlack;
              const isRoomOwner = currentUser?.username &&
                (rm.hostPlayer ? rm.hostPlayer === currentUser.username : rm.redPlayer === currentUser.username);

              return (
                <div
                  key={rm.roomId}
                  className="relative p-4 rounded-2xl bg-gradient-to-b from-[#142d20] to-[#0d1e15] border border-[#848156]/35 hover:border-[#5ec485]/70 shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between gap-3"
                >
                  {/* Table Header: Room Name, Code & Stake */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-[#fef3c7] line-clamp-1">
                        {rm.roomName}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#8fa195] font-mono mt-0.5">
                        <span>Mã: {rm.roomId}</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(rm.roomId)}
                          className="hover:text-white cursor-pointer"
                          title="Sao chép mã phòng"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="whitespace-nowrap px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-950 to-amber-900 border border-amber-500/40 text-amber-300 text-[11px] font-bold">
                        🪙 {formatCoinBadge(rm.betCoins)}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          isPlaying
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {isPlaying ? '● Đang thi đấu' : '○ Đang chờ'}
                      </span>
                    </div>
                  </div>

                  {/* Visual Table Seats: Red vs Black */}
                  <div className="p-3 rounded-xl bg-black/35 border border-white/5 flex items-center justify-around">
                    {/* Red Player Seat */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-[#edd3ae] to-[#a37941] flex items-center justify-center border-2 border-[#b91c1c] shadow">
                        <span
                          className="text-lg font-bold text-[#991b1b] leading-none"
                          style={{ fontFamily: "'LXGW WenKai TC', 'KaiTi', serif" }}
                        >
                          帥
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-[#fca5a5] max-w-[85px] truncate">
                        {rm.redPlayer || 'Ghế Đỏ trống'}
                      </span>
                    </div>

                    {/* VS Badge */}
                    <div className="text-[11px] font-extrabold text-[#9ec4ae] px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10">
                      VS
                    </div>

                    {/* Black Player Seat */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-[#edd3ae] to-[#a37941] flex items-center justify-center border-2 border-[#1f2937] shadow">
                        <span
                          className="text-lg font-bold text-[#1f2937] leading-none"
                          style={{ fontFamily: "'LXGW WenKai TC', 'KaiTi', serif" }}
                        >
                          將
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-[#d1d5db] max-w-[85px] truncate">
                        {rm.blackPlayer || 'Ghế Đen trống'}
                      </span>
                    </div>
                  </div>

                  {/* Table Action Button */}
                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[10px] text-[#7d8f83]">
                      Thời gian: 10 phút
                    </span>
                    <div className="flex items-center gap-1.5">
                      {!isPlaying && isFull && isRoomOwner && (
                        <button
                          onClick={() => onKickPlayer?.(rm.roomId, rm.redPlayer === currentUser.username ? rm.blackPlayer : rm.redPlayer)}
                          className="p-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/40 transition cursor-pointer"
                          title="Đá người chơi khỏi phòng"
                          aria-label="Đá người chơi khỏi phòng"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onJoinRoom(rm.roomId, isFull ? 'spectator' : 'auto')}
                        disabled={Boolean(joiningRoomId)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                          isFull
                            ? 'bg-black/40 hover:bg-black/60 text-[#d2cca6] border border-white/10'
                            : 'bg-[#25593f] hover:bg-[#2e6d4e] text-white shadow'
                        }`}
                      >
                        {joiningRoomId === rm.roomId ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Đang vào...</span>
                          </>
                        ) : isFull ? (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Vào Xem</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Vào Ngồi</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* CREATE ROOM MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg p-6 rounded-2xl bg-[#12241b] border border-[#848156]/40 shadow-[0_20px_60px_rgba(0,0,0,0.85)] text-[#f3ead8]">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
              <h3
                className="text-2xl font-bold text-[#fef3c7]"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                TẠO BÀN CỜ TƯỚNG MỚI
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Host Default Red & Auto-swap note */}
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-200">
                <span className="w-8 h-8 rounded-full bg-red-900 border border-red-500 flex items-center justify-center font-bold text-red-200 shrink-0">
                  帥
                </span>
                <span className="leading-snug">
                  Chủ bàn mặc định cầm <strong>Quân Đỏ (Đi Tiên)</strong>. Sau mỗi ván đấu, hai bên sẽ tự động đổi bên cờ <strong>Đỏ ⇄ Đen</strong>.
                </span>
              </div>

              {/* Stake Selection */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-[#c2baa3] mb-1.5">
                  <span>Mức cược ván đấu:</span>
                  <span className="text-[#fef08a] font-bold">
                    Số dư: {userCoins?.toLocaleString('vi-VN')} xu
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {BET_TIERS.map((tier) => {
                    const isSelected = customBet === tier.value;
                    const canAfford = (userCoins ?? 20000) >= tier.value;
                    return (
                      <button
                        type="button"
                        key={tier.value}
                        onClick={() => setCustomBet(tier.value)}
                        className={`p-2 rounded-xl text-center text-xs font-bold border transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#25593f] text-[#fef08a] border-[#5ec485] shadow'
                            : canAfford
                            ? 'bg-black/30 text-[#d2cca6] border-white/10 hover:bg-white/5'
                            : 'bg-black/15 text-[#5e6c63] border-transparent opacity-50'
                        }`}
                      >
                        {tier.short}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#c2baa3] mb-1.5">
                    Thời gian mỗi bên (phút):
                  </label>
                  <select
                    value={timeLimit / 60}
                    onChange={(e) => setTimeLimit(Number(e.target.value) * 60)}
                    className="w-full px-3 py-2 rounded-xl bg-black/45 border border-white/15 text-xs text-white focus:outline-none focus:border-[#5ec485]"
                  >
                    {[3, 5, 10, 15, 30].map((minutes) => (
                      <option key={minutes} value={minutes}>
                        {minutes} phút / bên
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#c2baa3] mb-1.5">
                    Giới hạn mỗi nước (giây):
                  </label>
                  <select
                    value={moveTimeLimit}
                    onChange={(e) => setMoveTimeLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-black/45 border border-white/15 text-xs text-white focus:outline-none focus:border-[#5ec485]"
                  >
                    {[15, 30, 60, 90, 120].map((seconds) => (
                      <option key={seconds} value={seconds}>
                        {seconds} giây / nước
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-black/40 hover:bg-black/60 text-xs font-semibold text-[#c2baa3] cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-2 py-2.5 rounded-xl bg-gradient-to-r from-[#15803d] to-[#16a34a] hover:from-[#166534] hover:to-[#15803d] text-white text-xs font-bold shadow transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Đang tạo bàn...</span>
                    </>
                  ) : (
                    'Tạo Bàn & Vào Ngồi'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

