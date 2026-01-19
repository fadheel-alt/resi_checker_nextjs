/**
 * Sound Player Utility
 * Manages audio playback with localStorage-based mute/unmute functionality
 */

const STORAGE_KEY = 'scanSoundEnabled';

class SoundPlayer {
  private audio: HTMLAudioElement | null = null;
  private enabled: boolean = true;
  private soundPath: string;
  private isPreloaded: boolean = false;

  constructor(soundPath: string) {
    this.soundPath = soundPath;

    // Load enabled state from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      this.enabled = stored === null ? true : stored === 'true';
    }
  }

  /**
   * Preload the audio file for instant playback
   */
  async preload(): Promise<void> {
    if (typeof window === 'undefined' || this.isPreloaded) {
      return;
    }

    try {
      this.audio = new Audio(this.soundPath);
      this.audio.preload = 'auto';

      // Wait for audio to be loaded
      await new Promise<void>((resolve, reject) => {
        if (!this.audio) {
          reject(new Error('Audio element not initialized'));
          return;
        }

        this.audio.addEventListener('canplaythrough', () => resolve(), { once: true });
        this.audio.addEventListener('error', (e) => reject(e), { once: true });

        // Load the audio
        this.audio.load();
      });

      this.isPreloaded = true;
    } catch (error) {
      console.warn('Failed to preload sound:', error);
      // Graceful degradation - app continues without sound
    }
  }

  /**
   * Play the sound (respects enabled state)
   */
  play(): void {
    if (!this.enabled || typeof window === 'undefined') {
      return;
    }

    try {
      if (!this.audio) {
        // Fallback: create audio on-the-fly if preload failed
        this.audio = new Audio(this.soundPath);
      }

      // Clone and play to allow overlapping sounds if needed
      const audioClone = this.audio.cloneNode() as HTMLAudioElement;
      audioClone.play().catch((error) => {
        console.warn('Failed to play sound:', error);
        // Silent fallback - user interaction might be required for autoplay
      });
    } catch (error) {
      console.warn('Failed to play sound:', error);
      // Graceful degradation
    }
  }

  /**
   * Enable or disable sound playback
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(enabled));
    }
  }

  /**
   * Check if sound is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Toggle sound on/off
   */
  toggle(): boolean {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }
}

// Export singleton instance
export const successSound = new SoundPlayer('/sounds/success.wav');
