import React, { useEffect, useState } from 'react';
import { Coins, Shield, Swords, Trophy, User, X, Loader2, Award, Percent } from 'lucide-react';
import { fetchProfile } from '../services/onlineService.js';
import { renderUserAvatar } from './ProfileModal.jsx';

export function PlayerProfileModal({ username, isOpen, onClose, canKick, onKick }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !username) return;
    setLoading(true);
    fetchProfile(username)
      .then(setProfile)
      .catch(() => setProfile({ username }))
      .finally(() => setLoading(false));
  }, [isOpen, username]);

  if (!isOpen || !username) return null;

  const totalMatches = profile?.totalMatches ?? 0;
  const winRate = profile?.winRate ?? 0;
  const wins = profile?.wins ?? 0;
  const draws = profile?.draws ?? 0;
  const losses = profile?.losses ?? 0;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm rounded-2xl bg-[#14271d] border border-[#5ec485]/45 shadow-[0_20px_70px_rgba(0,0,0,.7)] p-5 text-[#f3ead8] overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-[#9fb0a5] hover:text-white hover:bg-white/10 transition cursor-pointer"
          title="Đóng hồ sơ"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Avatar & Name */}
        <div className="flex flex-col items-center text-center pt-2">
          {renderUserAvatar(profile?.avatar, 'w-20 h-20', 'text-3xl')}
          <h2 className="mt-3 text-xl font-bold text-[#fef3c7]">{profile?.displayName || username}</h2>
          <p className="text-xs text-[#8fa195]">@{username}</p>
        </div>

        {/* Loading state indicator */}
        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-7 h-7 text-[#5ec485] animate-spin" />
            <span className="text-xs text-[#9fb0a5]">Đang tải hồ sơ kỳ thủ...</span>
          </div>
        ) : (
          <>
            {/* Coins & Status */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-black/25 border border-white/10 p-2.5">
                <div className="flex items-center gap-1.5 text-[10px] text-[#8fa195]">
                  <Coins className="w-3.5 h-3.5 text-yellow-400" /> Xu
                </div>
                <div className="mt-1 text-sm font-bold text-[#fef08a]">
                  {Number(profile?.coins ?? 0).toLocaleString('vi-VN')}
                </div>
              </div>
              <div className="rounded-xl bg-black/25 border border-white/10 p-2.5">
                <div className="flex items-center gap-1.5 text-[10px] text-[#8fa195]">
                  <Shield className="w-3.5 h-3.5 text-[#61c887]" /> Trạng thái
                </div>
                <div className="mt-1 text-sm font-bold text-[#bbf7d0]">Đang thi đấu</div>
              </div>
            </div>

            {/* Match Stats */}
            <div className="mt-3 p-3 rounded-xl bg-black/35 border border-white/10">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#8ce8b1] mb-2">
                <span className="flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-yellow-400" /> Thống Kê Thi Đấu
                </span>
                <span className="text-[10px] text-stone-400 font-normal">Đấu Online</span>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2.5">
                <div className="p-2 rounded-lg bg-black/20 border border-white/5 flex flex-col">
                  <span className="text-[10px] text-stone-400 flex items-center gap-1">
                    <Swords className="w-3 h-3 text-cyan-400" /> Số trận
                  </span>
                  <span className="text-base font-bold text-white mt-0.5">{totalMatches}</span>
                </div>
                <div className="p-2 rounded-lg bg-black/20 border border-white/5 flex flex-col">
                  <span className="text-[10px] text-stone-400 flex items-center gap-1">
                    <Percent className="w-3 h-3 text-emerald-400" /> Tỉ lệ thắng
                  </span>
                  <span className="text-base font-bold text-[#fef08a] mt-0.5">{winRate}%</span>
                </div>
              </div>

              {/* Win rate bar */}
              <div className="w-full bg-stone-900/80 rounded-full h-1.5 overflow-hidden flex border border-white/5 mb-2">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-green-400 h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, winRate))}%` }}
                />
              </div>

              {/* W-D-L Badges */}
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/5">
                <span className="text-emerald-400 font-medium">Thắng: <strong className="font-bold text-white">{wins}</strong></span>
                <span className="text-stone-300 font-medium">Hòa: <strong className="font-bold text-white">{draws}</strong></span>
                <span className="text-rose-400 font-medium">Thua: <strong className="font-bold text-white">{losses}</strong></span>
              </div>
            </div>
          </>
        )}

        {canKick && (
          <button
            onClick={() => onKick(username)}
            className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-950/70 hover:bg-red-900/80 border border-red-500/45 text-red-200 text-xs font-bold transition cursor-pointer"
          >
            <User className="w-4 h-4" /> Đá khỏi bàn
          </button>
        )}
      </div>
    </div>
  );
}
