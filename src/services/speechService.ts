/**
 * Aura Accessible Speech & Announcement Service
 * Handles text-to-speech, screen-reader live announcements,
 * and voice recognition input.
 */

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private lastSpokenText: string = '';
  private lastSpokenTime: number = 0;
  private speechRate: number = 1.0;
  private isMuted: boolean = false;
  private liveAnnouncerEl: HTMLElement | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  setSpeechRate(rate: number) {
    this.speechRate = Math.max(0.7, Math.min(1.5, rate));
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stop();
    }
  }

  isSpeechMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Speak a concise directional guidance instruction or confirmation.
   * Avoids repeating the exact same phrase within 3 seconds unless force = true.
   */
  speak(text: string, priority: 'immediate' | 'queue' = 'immediate', force = false) {
    if (!text || this.isMuted) return;

    const cleanText = text.trim();
    const now = Date.now();

    if (!force && cleanText === this.lastSpokenText && now - this.lastSpokenTime < 3000) {
      return;
    }

    this.lastSpokenText = cleanText;
    this.lastSpokenTime = now;

    // Also update screen reader live region
    this.announceToScreenReader(cleanText, priority === 'immediate' ? 'assertive' : 'polite');

    if (!this.synth) {
      // Fallback: log to console
      return;
    }

    try {
      if (priority === 'immediate') {
        this.synth.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = this.speechRate;
      utterance.pitch = 1.0;

      // Select preferred voice if available (high quality English)
      const voices = this.synth.getVoices();
      const preferred = voices.find(
        (v) =>
          (v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Google') || v.name.includes('Daniel')) &&
          v.lang.startsWith('en')
      );
      if (preferred) {
        utterance.voice = preferred;
      }

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    } catch (err) {
      console.warn('SpeechSynthesis error:', err);
    }
  }

  stop() {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {}
    }
  }

  /**
   * Screen reader accessibility announcer (aria-live region)
   */
  announceToScreenReader(message: string, politeness: 'polite' | 'assertive' = 'polite') {
    if (typeof document === 'undefined') return;

    let announcer = document.getElementById('aura-aria-live-announcer');
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'aura-aria-live-announcer';
      announcer.className = 'sr-only';
      announcer.setAttribute('aria-atomic', 'true');
      document.body.appendChild(announcer);
    }

    announcer.setAttribute('aria-live', politeness);
    announcer.textContent = '';
    // Small timeout ensures screen readers notice text node replacement
    setTimeout(() => {
      if (announcer) {
        announcer.textContent = message;
      }
    }, 50);
  }

  /**
   * Check if speech recognition is available in this browser
   */
  isRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  /**
   * Start listening for voice input
   */
  startVoiceInput(onResult: (transcript: string) => void, onError: (err: string) => void): () => void {
    if (typeof window === 'undefined') {
      onError('Not supported in this environment');
      return () => {};
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      onError('Speech recognition not available on this device');
      return () => {};
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          onResult(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        onError(event.error || 'Voice input error');
      };

      recognition.start();

      return () => {
        try {
          recognition.stop();
        } catch {}
      };
    } catch (e: any) {
      onError(e.message || 'Could not start microphone');
      return () => {};
    }
  }
}

export const speech = new SpeechService();
