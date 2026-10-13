/**
 * Aura Haptic Guidance Service
 * Implements tactile vibration cues for blind & low-vision navigation,
 * with Web Audio API click/haptic sound fallbacks when physical vibration
 * is unavailable or blocked in the browser.
 */

class HapticService {
  private audioCtx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Synthesize a subtle tactile click / audio tone
   */
  private playHapticTone(freq: number, durationMs: number, type: OscillatorType = 'sine', gainVal = 0.15) {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch {
      // Audio autoplay may be prevented before gesture
    }
  }

  /**
   * Target detected in camera frame (light pulse)
   */
  targetDetected() {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(60);
      } catch {}
    }
    this.playHapticTone(520, 80, 'sine', 0.12);
  }

  /**
   * Target is aligned in front of user (11 to 1 o'clock)
   * Strong distinct triple pulse
   */
  targetCentered() {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([100, 60, 100, 60, 120]);
      } catch {}
    }
    // High-pitched reassuring double chime
    this.playHapticTone(880, 90, 'triangle', 0.2);
    setTimeout(() => {
      this.playHapticTone(1100, 120, 'sine', 0.22);
    }, 110);
  }

  /**
   * User is getting closer to the target (rapid double tap)
   */
  gettingCloser() {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([50, 40, 70]);
      } catch {}
    }
    this.playHapticTone(660, 60, 'sine', 0.15);
  }

  /**
   * Warning: trip hazard or obstruction detected ahead
   */
  hazardAlert() {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([220, 100, 220]);
      } catch {}
    }
    // Deep alert low tone
    this.playHapticTone(220, 200, 'sawtooth', 0.25);
  }

  /**
   * Standard button tap feedback
   */
  tapFeedback() {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(25);
      } catch {}
    }
    this.playHapticTone(400, 40, 'sine', 0.08);
  }
}

export const haptic = new HapticService();
