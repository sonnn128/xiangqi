import React, { useState } from 'react';
import { Coins, KeyRound, Lock, LogIn, Sparkles, UserPlus, X } from 'lucide-react';
import { loginUser, registerUser } from '../services/onlineService.js';

export function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await registerUser(username.trim(), password.trim());
        // Auto login right after registration
        const authData = await loginUser(username.trim(), password.trim());
        onAuthSuccess({
          username: authData.username || username.trim(),
          coins: authData.coins || 20000,
          token: authData.token,
        });
        onClose();
      } else {
        const authData = await loginUser(username.trim(), password.trim());
        onAuthSuccess({
          username: authData.username || username.trim(),
          coins: authData.coins || 20000,
          token: authData.token,
        });
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Đã có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md p-6 rounded-2xl bg-[#14231b] border border-[#848156]/40 shadow-[0_18px_50px_rgba(0,0,0,0.8)] text-[#f3ead8]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#a7b5ab] hover:text-white hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 mb-2 rounded-full bg-gradient-to-br from-[#edd0a3] to-[#ad824a] border border-[#ffdb9e]/60 shadow-md">
            <Coins className="w-6 h-6 text-[#7a4817]" />
          </div>
          <h2
            className="text-2xl font-bold tracking-wide text-[#fef3c7]"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            {isRegister ? 'ĐĂNG KÝ KỲ HỮU' : 'ĐĂNG NHẬP KỲ HỮU'}
          </h2>
          <div className="flex items-center justify-center gap-1.5 mt-1 text-xs text-[#8ce8b1] font-medium">
            <Sparkles className="w-3.5 h-3.5 text-[#fbbf24]" />
            <span>Mỗi tài khoản mới nhận ngay <strong>20.000 Xu</strong> khởi nghiệp!</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1.5 p-1 mb-4 rounded-xl bg-black/40 border border-white/10 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError(null);
            }}
            className={`py-2 rounded-lg transition ${
              !isRegister
                ? 'bg-[#25593f] text-[#e8f8ee] shadow border border-[#5ec485]/40'
                : 'text-[#c2baa3] hover:text-white'
            }`}
          >
            Đăng Nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError(null);
            }}
            className={`py-2 rounded-lg transition ${
              isRegister
                ? 'bg-[#25593f] text-[#e8f8ee] shadow border border-[#5ec485]/40'
                : 'text-[#c2baa3] hover:text-white'
            }`}
          >
            Đăng Ký (+20k Xu)
          </button>
        </div>

        {error && (
          <div className="p-3 mb-3 rounded-xl text-xs font-medium text-red-200 bg-red-950/70 border border-red-500/40 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
            {isRegister && error.toLowerCase().includes('đã tồn tại') && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setIsRegister(false);
                }}
                className="self-start text-[11px] font-bold text-amber-300 hover:text-white underline cursor-pointer"
              >
                👉 Tài khoản đã tồn tại! Bấm vào đây để chuyển sang Đăng Nhập
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block mb-1 text-xs font-medium text-[#c2baa3]">
              Tên tài khoản / Kỳ hiệu
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ví dụ: kythulongho..."
                className="w-full px-3.5 py-2 pl-9 rounded-xl bg-black/45 border border-white/15 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#5ec485]"
                required
              />
              <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-[#8fa195]" />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-xs font-medium text-[#c2baa3]">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                className="w-full px-3.5 py-2 pl-9 rounded-xl bg-black/45 border border-white/15 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#5ec485]"
                required
              />
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-[#8fa195]" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2 rounded-xl bg-gradient-to-r from-[#20543b] via-[#2d6f4f] to-[#20543b] hover:brightness-110 text-white font-bold text-sm tracking-wide shadow-lg border border-[#61c887]/50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition"
          >
            {loading ? (
              <span>Đang xử lý...</span>
            ) : isRegister ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Đăng Ký & Nhận 20.000 Xu</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Đăng Nhập Vào Game</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-[#8fa195]">
          {isRegister ? (
            <span>
              Đã có tài khoản?{' '}
              <button
                onClick={() => {
                  setIsRegister(false);
                  setError(null);
                }}
                className="text-[#8ce8b1] hover:underline font-bold"
              >
                Đăng nhập ngay
              </button>
            </span>
          ) : (
            <span>
              Chưa có tài khoản?{' '}
              <button
                onClick={() => {
                  setIsRegister(true);
                  setError(null);
                }}
                className="text-[#8ce8b1] hover:underline font-bold"
              >
                Đăng ký nhận 20k xu
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

