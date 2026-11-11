import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Check,
  Coins,
  Edit3,
  Image,
  Loader2,
  Percent,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  User,
  X,
} from 'lucide-react';
import { updateProfile, fetchProfile } from '../services/onlineService.js';

export const AVATAR_PRESETS = [
  {
    id: 'avatar_1',
    name: 'Kỳ Vương',
    char: '帥',
    bg: 'from-amber-600 to-red-800',
    color: '#fee2e2',
    border: 'border-amber-400',
  },
  {
    id: 'avatar_2',
    name: 'Đại Tướng',
    char: '將',
    bg: 'from-stone-700 to-stone-900',
    color: '#fef08a',
    border: 'border-yellow-500',
  },
  {
    id: 'avatar_3',
    name: 'Thần Xa',
    char: '俥',
    bg: 'from-red-700 to-rose-950',
    color: '#ffffff',
    border: 'border-rose-400',
  },
  {
    id: 'avatar_4',
    name: 'Phi Mã',
    char: '傌',
    bg: 'from-emerald-700 to-green-950',
    color: '#d1fae5',
    border: 'border-emerald-400',
  },
  {
    id: 'avatar_5',
    name: 'Pháo Thủ',
    char: '炮',
    bg: 'from-orange-600 to-amber-900',
    color: '#ffedd5',
    border: 'border-orange-400',
  },
  {
    id: 'avatar_6',
    name: 'Thượng Tướng',
    char: '象',
    bg: 'from-cyan-700 to-blue-950',
    color: '#cffafe',
    border: 'border-cyan-400',
  },
  {
    id: 'avatar_7',
    name: 'Thị Vệ',
    char: '仕',
    bg: 'from-purple-700 to-indigo-950',
    color: '#f3e8ff',
    border: 'border-purple-400',
  },
  {
    id: 'avatar_8',
    name: 'Tiên Phong',
    char: '兵',
    bg: 'from-yellow-600 to-amber-950',
    color: '#fef9c3',
    border: 'border-yellow-400',
  },
];

export function renderUserAvatar(avatarId, size = 'w-10 h-10', textSize = 'text-xl') {
  if (avatarId && (avatarId.startsWith('http://') || avatarId.startsWith('https://'))) {
    return (
      <img
        src={avatarId}
        alt="Avatar"
        className={`${size} rounded-full object-cover border-2 border-amber-400 shadow`}
      />
    );
  }
  const preset = AVATAR_PRESETS.find((p) => p.id === avatarId) || AVATAR_PRESETS[0];
  return (
    <div
      className={`${size} rounded-full bg-gradient-to-br ${preset.bg} ${preset.border} border-2 flex items-center justify-center shadow select-none`}
    >
      <span
        className={`${textSize} font-bold leading-none`}
        style={{
          color: preset.color,
          fontFamily: "'LXGW WenKai TC', 'KaiTi', 'Noto Serif TC', serif",
        }}
      >
        {preset.char}
      </span>
    </div>
  );
}

export function ProfileModal({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated,
}) {
  const [displayName, setDisplayName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('avatar_1');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [isCustomUrlMode, setIsCustomUrlMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [stats, setStats] = useState({
    totalMatches: currentUser?.totalMatches ?? 0,
    winRate: currentUser?.winRate ?? 0,
    wins: currentUser?.wins ?? 0,
    draws: currentUser?.draws ?? 0,
    losses: currentUser?.losses ?? 0,
  });

  useEffect(() => {
    if (isOpen && currentUser?.username) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setDisplayName(currentUser.displayName || currentUser.username || '');
      setBirthDate(currentUser.birthDate || '');
      const av = currentUser.avatar || 'avatar_1';
      if (av.startsWith('http://') || av.startsWith('https://')) {
        setIsCustomUrlMode(true);
        setCustomAvatarUrl(av);
        setSelectedAvatar(av);
      } else {
        setIsCustomUrlMode(false);
        setSelectedAvatar(av);
      }

      // Fetch fresh profile & statistics from backend
      setLoadingProfile(true);
      fetchProfile(currentUser.username)
        .then((data) => {
          if (data) {
            if (data.displayName) setDisplayName(data.displayName);
            if (data.birthDate) setBirthDate(data.birthDate);
            if (data.avatar) {
              if (data.avatar.startsWith('http')) {
                setIsCustomUrlMode(true);
                setCustomAvatarUrl(data.avatar);
                setSelectedAvatar(data.avatar);
              } else {
                setSelectedAvatar(data.avatar);
              }
            }
            setStats({
              totalMatches: data.totalMatches ?? 0,
              winRate: data.winRate ?? 0,
              wins: data.wins ?? 0,
              draws: data.draws ?? 0,
              losses: data.losses ?? 0,
            });
          }
        })
        .catch(() => {})
        .finally(() => setLoadingProfile(false));
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrorMsg('Vui lòng nhập tên hiển thị!');
      return;
    }

    const finalAvatar = isCustomUrlMode && customAvatarUrl.trim()
      ? customAvatarUrl.trim()
      : selectedAvatar;

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const updatedData = await updateProfile({
        username: currentUser.username,
        displayName: displayName.trim(),
        birthDate: birthDate ? birthDate.trim() : '',
        avatar: finalAvatar,
      });

      const updatedUser = {
        ...currentUser,
        displayName: updatedData.displayName || displayName.trim(),
        birthDate: updatedData.birthDate || birthDate,
        avatar: updatedData.avatar || finalAvatar,
        ...stats,
      };

      onUserUpdated(updatedUser);
      setSuccessMsg('Đã cập nhật thông tin cá nhân thành công!');
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      setErrorMsg(err.message || 'Cập nhật thông tin thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#142d20] to-[#0c1f16] border border-[#848156]/50 shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#10241a]/90 border-b border-[#848156]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#facc15] to-[#ca8a04] flex items-center justify-center text-stone-900 shadow">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2
                className="text-lg font-bold text-[#fef3c7]"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                HỒ SƠ KỲ THỦ
              </h2>
              <p className="text-[11px] text-[#8ce8b1]">
                Chỉnh sửa thông tin cá nhân và đại diện tướng cờ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Current Profile Preview */}
          <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-black/35 border border-white/10">
            {renderUserAvatar(
              isCustomUrlMode && customAvatarUrl.trim() ? customAvatarUrl : selectedAvatar,
              'w-16 h-16',
              'text-3xl'
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white truncate">
                  {displayName || currentUser.username}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-[#8ce8b1] border border-emerald-500/40">
                  Kỳ thủ
                </span>
              </div>
              <div className="text-xs text-stone-400 mt-0.5">
                Tài khoản: <strong className="text-stone-300 font-mono">@{currentUser.username}</strong>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#fef08a] mt-1">
                <Coins className="w-3.5 h-3.5 text-yellow-400" />
                <span>{(currentUser.coins ?? 20000).toLocaleString('vi-VN')} xu</span>
              </div>
            </div>
          </div>

          {/* Match Statistics Card */}
          <div className="p-3.5 rounded-2xl bg-black/30 border border-[#5ec485]/30">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-[#8ce8b1] flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-yellow-400" /> Chiến Tích Thi Đấu
              </span>
              {loadingProfile ? (
                <span className="text-[10px] text-stone-400 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin text-[#5ec485]" /> Đang cập nhật...
                </span>
              ) : (
                <span className="text-[10px] text-stone-400">Đấu trực tuyến</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="p-2.5 rounded-xl bg-black/25 border border-white/5 flex flex-col">
                <span className="text-[10px] text-stone-400 flex items-center gap-1">
                  <Swords className="w-3 h-3 text-cyan-400" /> Số trận đã đấu
                </span>
                <span className="text-lg font-bold text-white mt-0.5">
                  {loadingProfile ? '...' : stats.totalMatches}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/25 border border-white/5 flex flex-col">
                <span className="text-[10px] text-stone-400 flex items-center gap-1">
                  <Percent className="w-3 h-3 text-emerald-400" /> Tỉ lệ thắng
                </span>
                <span className="text-lg font-bold text-[#fef08a] mt-0.5">
                  {loadingProfile ? '...' : `${stats.winRate}%`}
                </span>
              </div>
            </div>

            {/* Win rate bar */}
            <div className="w-full bg-stone-900/80 rounded-full h-1.5 overflow-hidden flex border border-white/5 mb-2">
              <div
                className="bg-gradient-to-r from-emerald-500 to-green-400 h-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, stats.winRate))}%` }}
              />
            </div>

            {/* Win - Draw - Loss Details */}
            <div className="flex items-center justify-between text-xs pt-1 px-1">
              <span className="text-emerald-400">Thắng: <strong className="text-white font-bold">{stats.wins}</strong></span>
              <span className="text-stone-300">Hòa: <strong className="text-white font-bold">{stats.draws}</strong></span>
              <span className="text-rose-400">Thua: <strong className="text-white font-bold">{stats.losses}</strong></span>
            </div>
          </div>

          {/* Field: Username (Readonly) */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-300 flex items-center justify-between">
              <span>Tên đăng nhập (Tài khoản)</span>
              <span className="text-[10px] text-stone-400 font-normal">Cố định không thể đổi</span>
            </label>
            <input
              type="text"
              value={currentUser.username}
              disabled
              className="w-full px-3.5 py-2 rounded-xl bg-black/45 border border-white/10 text-stone-400 text-xs font-mono cursor-not-allowed select-none"
            />
          </div>

          {/* Field: Display Name (Editable) */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-300 flex items-center justify-between">
              <span>Tên hiển thị (Nickname)</span>
              <span className="text-[10px] text-emerald-400">Khác tên tài khoản</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="VD: Độc Cô Cầu Bại, Kỳ Vương Sài Gòn..."
                maxLength={30}
                className="w-full px-3.5 py-2 pl-9 rounded-xl bg-black/35 border border-white/20 text-white text-xs placeholder:text-stone-500 focus:outline-none focus:border-[#5ec485]"
              />
              <Edit3 className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>
            <p className="text-[11px] text-stone-400">
              Tên này sẽ xuất hiện trên bàn cờ, bảng xếp hạng và tin nhắn trò chuyện.
            </p>
          </div>

          {/* Field: Birth Date */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <span>Ngày tháng năm sinh</span>
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-black/35 border border-white/20 text-white text-xs focus:outline-none focus:border-[#5ec485]"
            />
          </div>

          {/* Field: Avatar Picker */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                <span>Chọn Avatar Tướng Cờ</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCustomUrlMode((v) => !v)}
                className="text-[11px] text-[#8ce8b1] hover:underline cursor-pointer"
              >
                {isCustomUrlMode ? 'Dùng Avatar Tướng' : 'Nhập Link ảnh ngoài'}
              </button>
            </div>

            {isCustomUrlMode ? (
              <div className="space-y-1">
                <div className="relative">
                  <input
                    type="url"
                    value={customAvatarUrl}
                    onChange={(e) => setCustomAvatarUrl(e.target.value)}
                    placeholder="https://example.com/my-avatar.png"
                    className="w-full px-3.5 py-2 pl-9 rounded-xl bg-black/35 border border-white/20 text-white text-xs placeholder:text-stone-500 focus:outline-none focus:border-[#5ec485]"
                  />
                  <Image className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
                </div>
                <p className="text-[10px] text-stone-400">
                  Dán đường dẫn trực tiếp tới ảnh đại diện của bạn.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2.5">
                {AVATAR_PRESETS.map((p) => {
                  const isSelected = selectedAvatar === p.id && !isCustomUrlMode;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedAvatar(p.id)}
                      className={`relative p-2 rounded-2xl flex flex-col items-center gap-1.5 cursor-pointer border transition-all ${
                        isSelected
                          ? 'bg-[#25593f]/80 border-emerald-400 shadow-[0_0_15px_rgba(94,196,133,0.3)] scale-105'
                          : 'bg-black/30 border-white/10 hover:border-white/30 hover:bg-black/40'
                      }`}
                    >
                      {renderUserAvatar(p.id, 'w-11 h-11', 'text-2xl')}
                      <span className="text-[11px] font-semibold text-stone-200 truncate">
                        {p.name}
                      </span>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 text-stone-950 flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-black/40 hover:bg-black/60 text-stone-300 text-xs font-semibold border border-white/10 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white text-xs font-bold shadow-lg transition-transform hover:scale-[1.02] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                'Lưu Thay Đổi'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

