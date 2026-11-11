import React from 'react';
import { AlertTriangle, Layers, Play, Home } from 'lucide-react';
import { soundFX } from '../utils/sound.js';

export function DuplicateTabModal({ isOpen, username, onReclaim, onExit }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#1c140d] to-[#0e0906] border-2 border-amber-600/50 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] p-6 sm:p-8 text-center text-[#f5ebd7] overflow-hidden">
        {/* Decorative corner glows */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Pulsing Warning Icon */}
        <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-950/70 border-2 border-amber-500/60 flex items-center justify-center mb-5 shadow-[0_0_25px_rgba(245,158,11,0.25)] relative">
          <Layers className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 animate-pulse" />
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-600 border-2 border-[#1c140d] flex items-center justify-center">
            <AlertTriangle className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-black text-amber-300 font-serif tracking-wide uppercase drop-shadow-md">
          Đang Mở Ở Tab Khác
        </h2>

        {/* Username pill */}
        {username && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-900/40 border border-amber-600/30 text-amber-200 text-xs font-semibold mt-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Tài khoản: <span className="text-amber-100 font-bold">{username}</span>
          </div>
        )}

        {/* Explanation */}
        <p className="text-stone-300 text-sm leading-relaxed mt-4 px-2">
          Bạn vừa mở hoặc chuyển sang một tab khác của trò chơi.
          Để đảm bảo tính công bằng và tránh xung đột nước đi, tab này đã tạm dừng kết nối.
        </p>

        <div className="p-3 my-4 rounded-xl bg-amber-950/30 border border-amber-500/20 text-xs text-amber-300/90 text-left flex items-start gap-2.5">
          <span className="text-base leading-none">💡</span>
          <span>
            Bạn có thể tiếp tục chơi ở tab mới mở, hoặc nhấn nút bên dưới để chuyển quyền điều khiển về tab này.
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 mt-6">
          <button
            onClick={() => {
              soundFX.playSelect?.();
              onReclaim?.();
            }}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm sm:text-base text-amber-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-[0_4px_20px_rgba(245,158,11,0.35)] hover:shadow-[0_4px_25px_rgba(245,158,11,0.5)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            Sử dụng tab này
          </button>

          <button
            onClick={() => {
              soundFX.playSelect?.();
              onExit?.();
            }}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm text-stone-300 hover:text-white bg-stone-800/80 hover:bg-stone-700/80 border border-stone-700/60 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Về sảnh chính
          </button>
        </div>
      </div>
    </div>
  );
}

