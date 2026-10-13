/**
 * Kitchen Bell / Order Notification Audio Utility using Web Audio API
 * Generates an energetic, loud restaurant kitchen bell / chime.
 */

class AudioNotifier {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    // Lazy initialized on first user interaction to comply with autoplay policy
  }

  public init() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * Plays a loud, crisp 3-tone notification chime (D5 -> F#5 -> A5 -> D6)
   */
  public playNewOrderAlert() {
    if (!this.soundEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // Note 1: 587.33 Hz (D5)
      this.playTone(587.33, now, 0.15, 0.35);

      // Note 2: 739.99 Hz (F#5)
      this.playTone(739.99, now + 0.12, 0.15, 0.4);

      // Note 3: 880.00 Hz (A5)
      this.playTone(880.00, now + 0.24, 0.18, 0.45);

      // Note 4: 1174.66 Hz (D6 - ringing bell)
      this.playBell(1174.66, now + 0.38, 0.8, 0.5);
    } catch (e) {
      console.warn('Audio alert playback error:', e);
    }
  }

  private playTone(freq: number, startTime: number, duration: number, gainLevel: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(gainLevel, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  private playBell(freq: number, startTime: number, duration: number, gainLevel: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const oscHarmonic = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    oscHarmonic.type = 'triangle';
    oscHarmonic.frequency.setValueAtTime(freq * 2, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(gainLevel, startTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    oscHarmonic.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(startTime);
    oscHarmonic.start(startTime);
    osc.stop(startTime + duration);
    oscHarmonic.stop(startTime + duration);
  }
}

export const orderNotifier = new AudioNotifier();
