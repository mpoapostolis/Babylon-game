export class SoundManager {
  private audioContext: AudioContext;
  private isMuted = false;
  private masterVolume = 0.7;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    console.log("🔊 Sound Manager initialized");
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = "sine"): void {
    if (this.isMuted) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      // Envelope for smooth sound
      const now = this.audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.3, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

      oscillator.start(now);
      oscillator.stop(now + duration);

      console.log(`🔊 Playing ${type} at ${frequency}Hz for ${duration}s`);
    } catch (error) {
      console.error("Sound error:", error);
    }
  }

  play(soundName: string): void {
    if (this.isMuted) return;

    console.log(`🔊 Playing sound: ${soundName}`);

    switch (soundName) {
      case "attack":
        // Whoosh sound
        this.playTone(200, 0.15, "sawtooth");
        setTimeout(() => this.playTone(150, 0.1, "sawtooth"), 50);
        break;

      case "dialogueOpen":
        // High chime
        this.playTone(800, 0.2, "sine");
        setTimeout(() => this.playTone(1000, 0.15, "sine"), 50);
        break;

      case "dialogueClose":
        // Lower chime
        this.playTone(600, 0.15, "sine");
        setTimeout(() => this.playTone(400, 0.2, "sine"), 50);
        break;

      case "dialogueAdvance":
        // Click
        this.playTone(600, 0.08, "sine");
        break;

      case "hit":
        // Impact
        this.playTone(100, 0.15, "square");
        break;

      default:
        console.warn(`Unknown sound: ${soundName}`);
    }
  }

  stop(soundName: string): void {
    // For oscillators, we don't need to manually stop as they auto-stop
    console.log(`🔇 Stop sound: ${soundName}`);
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    console.log(`🔊 Volume set to ${this.masterVolume}`);
  }

  toggleMute(): void {
    this.isMuted = !this.isMuted;
    console.log(`🔊 Muted: ${this.isMuted}`);
  }

  dispose(): void {
    if (this.audioContext.state !== "closed") {
      this.audioContext.close();
    }
  }
}
