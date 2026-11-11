import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Coins, Gift, Info, Sparkles, X, XCircle } from 'lucide-react';
import { soundFX } from '../utils/sound.js';

export function ToastNotification({ toast, onDismiss }) {
	const {
		id,
		type = 'info',
		title,
		message,
		rewardAmount,
		duration = 3000,
		actionText,
		onAction,
		cancelText,
		onCancel,
		persistent = false,
	} = toast || {};

	useEffect(() => {
		if (!toast) return undefined;

		if (type === 'reward' || type === 'daily') soundFX.playVictory?.();
		if (type === 'error') soundFX.playSelect?.();
		if (type === 'success') soundFX.playPlace?.();
		if (persistent) return undefined;

		const dismissTimeout = setTimeout(() => onDismiss?.(), duration);

		return () => {
			clearTimeout(dismissTimeout);
		};
	}, [toast, id, type, duration]);

	if (!toast) return null;

	const styles = {
		reward: ['from-[#1f190a]/95 to-[#161208]/95', 'border-[#facc15]/80', 'text-[#fef08a]', 'bg-yellow-300', <Gift className="w-6 h-6 text-yellow-300" />],
		daily: ['from-[#172e1e]/95 to-[#0e1d13]/95', 'border-[#5ec485]/80', 'text-[#bbf7d0]', 'bg-emerald-400', <Sparkles className="w-6 h-6 text-[#8ce8b1]" />],
		success: ['from-[#102419]/95 to-[#0b1810]/95', 'border-[#5ec485]/70', 'text-emerald-300', 'bg-emerald-400', <CheckCircle2 className="w-5 h-5 text-emerald-400" />],
		warning: ['from-[#291b0d]/95 to-[#1c1208]/95', 'border-[#f59e0b]/70', 'text-amber-300', 'bg-amber-400', <AlertTriangle className="w-5 h-5 text-amber-400" />],
		error: ['from-[#2b0f0f]/95 to-[#1a0808]/95', 'border-red-500/70', 'text-red-300', 'bg-red-500', <XCircle className="w-5 h-5 text-red-400" />],
		info: ['from-[#0e1e2b]/95 to-[#09131c]/95', 'border-sky-500/70', 'text-sky-300', 'bg-sky-400', <Info className="w-5 h-5 text-sky-400" />],
	}[type] || ['from-[#142d20]/95 to-[#0c1f16]/95', 'border-[#848156]/60', 'text-[#fef3c7]', 'bg-[#5ec485]', <Info className="w-5 h-5 text-[#8ce8b1]" />];

	return (
		<div className="fixed top-4 sm:top-6 inset-x-0 mx-auto z-[100] w-[calc(100%-1.5rem)] sm:w-[92vw] max-w-md px-0 pointer-events-none animate-toast-slide-down">
			<div
				role="status"
				aria-live="polite"
				data-toast-type={type}
				className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${styles[0]} backdrop-blur-xl border ${styles[1]} ring-1 ring-white/10 shadow-[0_18px_55px_rgba(0,0,0,0.42)] p-3.5 sm:p-4 text-white pointer-events-auto`}
			>
				<div className="absolute inset-x-0 top-0 h-px bg-white/20" />
				<button
					onClick={onDismiss}
					className="absolute top-2.5 right-2.5 p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 transition"
					title="Đóng thông báo"
					aria-label="Đóng thông báo"
				>
					<X className="w-4 h-4" />
				</button>
				<div className="flex items-start gap-3.5">
					<div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-black/30 border border-white/15 shadow-inner flex items-center justify-center shrink-0">{styles[4]}</div>
					<div className="flex-1 min-w-0 pr-5">
						<h4 className={`text-[13px] sm:text-sm font-bold tracking-wide leading-tight ${styles[2]}`}>{title || 'THÔNG BÁO'}</h4>
						<p className="text-xs text-[#e5ded0] mt-1 leading-relaxed break-words font-medium">{message}</p>
						{rewardAmount && <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/30 border border-yellow-300/20 text-[#fef08a] text-xs font-bold"><Coins className="w-4 h-4 text-yellow-400" />+{rewardAmount.toLocaleString('vi-VN')} xu</div>}
						{(actionText || cancelText) && <div className="flex flex-wrap items-center gap-2 mt-3">
							{actionText && <button onClick={() => { onAction?.(); onDismiss?.(); }} className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-emerald-950 text-xs font-extrabold shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200">{actionText}</button>}
							{cancelText && <button onClick={() => { onCancel?.(); onDismiss?.(); }} className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-stone-200 text-xs font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40">{cancelText}</button>}
						</div>}
					</div>
				</div>
				<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/40"><div className={`h-full ${styles[3]} animate-toast-progress`} style={{ animationDuration: `${duration}ms` }} /></div>
			</div>
		</div>
	);
}
