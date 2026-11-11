const SOUND_FILES = {
  select: '/sounds/click.wav?v=8',
  slide: '/sounds/slide.wav?v=8',
  move: '/sounds/move.wav?v=8',
  moveAlt: '/sounds/move2.wav?v=8',
  capture: '/sounds/capture.wav?v=8',
  captureAlt: '/sounds/capture2.wav?v=8',
  check: '/sounds/check.wav?v=8',
  mate: '/sounds/mate.wav?v=8',
  victory: '/sounds/win.wav?v=8',
  defeat: '/sounds/loss.wav?v=8',
  newgame: '/sounds/newgame.wav?v=8',
  battle_start: '/sounds/battle_start.wav?v=2',
};

class SoundEffects {
  constructor() {
    this.enabled = true;
    this.ctx = null;
    this.buffers = {};
    this.audioPool = {};
    this.preloaded = false;

    if (typeof window !== 'undefined') {
      this.preloadHtmlAudio();
    }
  }

  preloadHtmlAudio() {
    Object.entries(SOUND_FILES).forEach(([key, url]) => {
      const audio = new Audio(url);
      audio.preload = 'auto';
      this.audioPool[key] = audio;
    });
  }

  async ensureBuffers() {
    if (this.preloaded || typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    this.preloaded = true;

    await Promise.all(
      Object.entries(SOUND_FILES).map(async ([key, url]) => {
        try {
          const res = await fetch(url);
          const arr = await res.arrayBuffer();
          const decoded = await this.ctx.decodeAudioData(arr);
          this.buffers[key] = decoded;
        } catch {
          // Fallback to HTMLAudioElement if decode fails
        }
      })
    );
  }

  playSample(key, volume = 0.9, playbackRate = 1.0) {
    if (!this.enabled) return;

    // Trigger background buffer preload on first user gesture
    this.ensureBuffers();

    if (this.ctx && this.buffers[key]) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      const source = this.ctx.createBufferSource();
      source.buffer = this.buffers[key];
      source.playbackRate.value = playbackRate;

      const gain = this.ctx.createGain();
      gain.gain.value = volume;

      source.connect(gain);
      gain.connect(this.ctx.destination);
      source.start(0);
      return;
    }

    // Immediate fallback using cloned HTMLAudioElement
    const baseAudio = this.audioPool[key];
    if (baseAudio) {
      const clone = baseAudio.cloneNode();
      clone.volume = Math.min(1, volume);
      clone.playbackRate = playbackRate;
      clone.play().catch(() => {});
    }
  }

  // Phần 1: Cờ đang được chọn (trích từ sound.mp3 gốc)
  playSelect() {
    this.playSample('select', 1.0, 1.0);
  }

  // Phần 2: Cờ trong quá trình đi đến đích (lướt trong 460ms)
  playSlide() {
    this.playSample('slide', 1.0, 1.0);
  }

  // Phần cuối: Âm thanh cờ đáp đích (tiếng đặt cờ đanh chắc từ sound.mp3)
  playMove() {
    const key = Math.random() > 0.5 ? 'move' : 'moveAlt';
    this.playSample(key, 1.0, 1.0);
  }

  // Cờ đáp đích ăn quân uy lực
  playCapture() {
    const key = Math.random() > 0.5 ? 'capture' : 'captureAlt';
    this.playSample(key, 1.05, 1.0);
  }

  // Âm báo Chiếu tướng đanh thép "CỐP - CỐP!" vang vọng
  playCheck() {
    this.playSample('check', 1.0, 1.0);
  }

  // Âm hiệu Tuyệt Sát: đồng bộ chuẩn âm thanh giống Chiếu theo yêu cầu
  playMate() {
    this.playCheck();
  }

  // Nhạc hiệu Chiến thắng ván cờ
  playVictory() {
    this.playSample('victory', 1.0, 1.0);
  }

  // Âm hiệu Thua cuộc
  playDefeat() {
    this.playSample('defeat', 0.9, 1.0);
  }

  // Âm hiệu bắt đầu ván mới
  playNewGame() {
    this.playSample('newgame', 0.85, 1.0);
  }

  // Âm hiệu bắt đầu trận đấu: đồng bộ chuẩn giống như tiếng Chiếu tướng theo yêu cầu
  playBattleStart() {
    this.playCheck();
  }

  // Âm hiệu đếm ngược từng giây "tụt tụt" chuẩn xác bằng Web Audio API
  playCountdownTick() {
    if (!this.enabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        if (!this.ctx) {
          this.ctx = new AudioCtx();
        }
        if (this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Độ trượt tần số từ 580Hz xuống 160Hz tạo tiếng "tụt" giọt nước đanh gọn êm ái
        osc.type = 'sine';
        osc.frequency.setValueAtTime(580, t);
        osc.frequency.exponentialRampToValueAtTime(150, t + 0.07);

        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.075);
        return;
      }
    } catch {
      // Fallback nếu browser chặn AudioContext
    }
    this.playSample('select', 0.6, 1.2);
  }

  // Tiếng gõ cửa "Cốc... cốc!" khi có kỳ hữu bước vào bàn đấu
  playDoorKnock() {
    if (!this.enabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        if (!this.ctx) this.ctx = new AudioCtx();
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
        const t = this.ctx.currentTime;

        // Tiếng gõ 1 (t)
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(320, t);
        osc1.frequency.exponentialRampToValueAtTime(140, t + 0.055);
        gain1.gain.setValueAtTime(0.55, t);
        gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        osc1.start(t);
        osc1.stop(t + 0.065);

        // Tiếng gõ 2 (t + 0.13s)
        const t2 = t + 0.13;
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(360, t2);
        osc2.frequency.exponentialRampToValueAtTime(160, t2 + 0.06);
        gain2.gain.setValueAtTime(0.65, t2);
        gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.065);
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(t2);
        osc2.stop(t2 + 0.07);
        return;
      }
    } catch {
      // Fallback
    }
    this.playSample('move', 0.85, 1.2);
    setTimeout(() => this.playSample('move', 0.95, 1.3), 130);
  }

  // Tiếng đóng cửa "Cạch - cộc" khi có kỳ hữu rời khỏi bàn đấu
  playDoorLeave() {
    if (!this.enabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        if (!this.ctx) this.ctx = new AudioCtx();
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
        const t = this.ctx.currentTime;

        // Tiếng lẫy cửa mở (t)
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'square';
        osc1.frequency.setValueAtTime(500, t);
        osc1.frequency.exponentialRampToValueAtTime(240, t + 0.035);
        gain1.gain.setValueAtTime(0.2, t);
        gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        osc1.start(t);
        osc1.stop(t + 0.045);

        // Tiếng cánh cửa gỗ đóng sập "cộc" (t + 0.065s)
        const t2 = t + 0.065;
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(180, t2);
        osc2.frequency.exponentialRampToValueAtTime(50, t2 + 0.11);
        gain2.gain.setValueAtTime(0.55, t2);
        gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.12);
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(t2);
        osc2.stop(t2 + 0.13);
        return;
      }
    } catch {
      // Fallback
    }
    this.playSample('slide', 0.7, 0.7);
  }
}

export const soundFX = new SoundEffects();
