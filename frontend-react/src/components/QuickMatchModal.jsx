import React, { useState } from 'react';
import { Zap, X, Coins, Sparkles, ShieldCheck } from 'lucide-react';

export const BET_TIERS = [
  { value: 0, label: '0 xu (Tập sự)', short: '0 xu' },
  { value: 1000, label: '1.000 xu (1k)', short: '1k xu' },
  { value: 2000, label: '2.000 xu (2k)', short: '2k xu' },
  { value: 5000, label: '5.000 xu (5k)', short: '5k xu' },
  { value: 10000, label: '10.000 xu (10k)', short: '10k xu', recommended: true },
  { value: 20000, label: '20.000 xu (20k)', short: '20k xu' },
  { value: 50000, label: '50.000 xu (50k)', short: '50k xu' },
  { value: 100000, label: '100.000 xu (100k)', short: '100k xu' },
  { value: 200000, label: '200.000 xu (200k)', short: '200k xu' },
  { value: 500000, label: '500.000 xu (500k)', short: '500k xu' },
  { value: 1000000, label: '1.000.000 xu (1M)', short: '1M xu' },
  { value: 2000000, label: '2.000.000 xu (2M)', short: '2M xu' },
  { value: 5000000, label: '5.000.000 xu (5M)', short: '5M xu' },
];

export function QuickMatchModal({
  isOpen,
  onClose,
  onConfirm,
  userCoins,
  loading,
}) {
  const [selectedBet, setSelectedBet] = useState(10000);

  if (!isOpen) return null;

  const handleStart = () => {
    if (selectedBet > (userCoins ?? 20000)) {
      alert(`Số dư hiện tại (${userCoins?.toLocaleString('vi-VN')} xu) không đủ mức cược ${selectedBet.toLocaleString('vi-VN')} xu.`);
      return;
    }
    onConfirm(selectedBet);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg p-6 rounded-2xl bg-[#12241b] border border-[#848156]/40 shadow-[0_20px_60px_rgba(0,0,0,0.85)] text-[#f3ead8]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#a7b5ab] hover:text-white hover:bg-white/10 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#facc15] to-[#ca8a04] flex items-center justify-center shadow-lg text-[#422006]">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h2
              className="text-2xl font-bold tracking-wide text-[#fef3c7]"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              CHƠI NHANH • TỰ ĐỘNG GHÉP BÀN
            </h2>
            <p className="text-xs text-[#9ec4ae]">
              Hệ thống sẽ ghép bạn với kỳ thủ phù hợp hoặc mở ngay phòng chờ
            </p>
          </div>
        </div>

        {/* User Balance Banner */}
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#c2baa3]">
            <Coins className="w-4 h-4 text-[#fbbf24]" />
            <span>Số dư của bạn:</span>
          </div>
          <div className="text-sm font-bold text-[#fef08a] font-mono">
            {userCoins?.toLocaleString('vi-VN')} Xu
          </div>
        </div>

        {/* Bet Selection Header */}
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-bold text-[#c2baa3] uppercase tracking-wider">
            Chọn mức cược trận đấu:
          </span>
          <span className="text-[#8ce8b1] font-semibold">
            Đã chọn: {BET_TIERS.find((b) => b.value === selectedBet)?.short}
          </span>
        </div>

        {/* Bet Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-5 max-h-56 overflow-y-auto pr-1">
          {BET_TIERS.map((tier) => {
            const isSelected = selectedBet === tier.value;
            const isAffordable = (userCoins ?? 20000) >= tier.value;
            return (
              <button
                key={tier.value}
                onClick={() => setSelectedBet(tier.value)}
                className={`relative p-2.5 rounded-xl text-center text-xs font-bold border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#25593f] text-[#fef08a] border-[#5ec485] shadow-[0_0_15px_rgba(94,196,133,0.3)] scale-[1.02]'
                    : isAffordable
                    ? 'bg-black/30 text-[#d2cca6] border-white/10 hover:bg-white/5 hover:border-white/20'
                    : 'bg-black/20 text-[#6b7c72] border-transparent opacity-60'
                }`}
              >
                {tier.recommended && (
                  <span className="absolute -top-1.5 right-1 px-1.5 py-0.2 rounded-full bg-[#eab308] text-[#422006] text-[8px] font-extrabold uppercase tracking-tight">
                    Hot
                  </span>
                )}
                <div>{tier.short}</div>
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-2 border-t border-white/10">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-black/35 hover:bg-black/50 text-xs font-semibold text-[#c2baa3] transition cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleStart}
            disabled={loading}
            className="flex-2 py-2.5 rounded-xl bg-gradient-to-r from-[#15803d] to-[#16a34a] hover:from-[#166534] hover:to-[#15803d] text-white text-xs font-bold shadow-lg transition-transform hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>{loading ? 'Đang ghép bàn...' : 'Ghép Trận Ngay'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

