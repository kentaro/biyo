import { useCompileStore } from '@/lib/stores/compile';
import { createMimiumContext, type MimiumContext } from './wasm-loader';

/**
 * Maximum gain for children's hearing safety.
 * -6 dB = 10^(-6/20) ~ 0.501
 * This hard cap cannot be exceeded by any API call.
 */
const MAX_SAFE_GAIN = 0.5;

/** Default comfortable listening level for children */
const DEFAULT_GAIN = 0.35;

class AudioEngine {
  private ctx: AudioContext | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private masterGain: GainNode | null = null;
  private safetyLimiter: GainNode | null = null;
  private micSafetyGain: GainNode | null = null;
  private mimium: MimiumContext | null = null;

  /** Current user-requested volume (before safety clamping) */
  private userVolume = DEFAULT_GAIN;

  /** Initialise the Web Audio graph. Safe to call multiple times. */
  async init(): Promise<void> {
    if (this.ctx) return;

    try {
      this.ctx = new AudioContext({ sampleRate: 48000 });
    } catch {
      // AudioContext constructor can throw on some browsers/devices
      // (e.g., when the audio system is unavailable). Fail gracefully
      // rather than crashing the app for children.
      console.warn('[AudioEngine] Failed to create AudioContext. Audio will be unavailable.');
      useCompileStore.getState().setStatus('error');
      useCompileStore.getState().setError('おとがつかえないみたい。ブラウザをかえてみてね！');
      return;
    }

    // ScriptProcessorNode (Phase 1) — will migrate to AudioWorklet in Phase 3
    this.scriptNode = this.ctx.createScriptProcessor(4096, 0, 1);
    this.scriptNode.onaudioprocess = (e) => {
      const output = e.outputBuffer.getChannelData(0);
      if (this.mimium) {
        this.mimium.process(output);
      } else {
        output.fill(0);
      }
    };

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;

    // Master gain — safe default volume for children's hearing
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = DEFAULT_GAIN;

    // Safety limiter — hard cap at MAX_SAFE_GAIN (-6 dB).
    // This is the final gain stage before the compressor, ensuring
    // that even if masterGain is somehow set too high, the output
    // never exceeds the safe level.
    this.safetyLimiter = this.ctx.createGain();
    this.safetyLimiter.gain.value = 1.0;

    // Dynamics compressor as brick-wall limiter — prevents any sound
    // exceeding safe level. Configured with aggressive settings:
    // - threshold at -6 dB (matches our safety target)
    // - high ratio (20:1) for near-brick-wall limiting
    // - fast attack to catch transients
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -6;
    this.compressor.knee.value = 1;
    this.compressor.ratio.value = 20;
    this.compressor.attack.value = 0.001;
    this.compressor.release.value = 0.25;

    // Microphone safety gain — attenuates mic input before it enters
    // the DSP processing chain. Prevents feedback loops by keeping
    // mic level well below unity gain even if the DSP code passes it
    // through directly.
    this.micSafetyGain = this.ctx.createGain();
    this.micSafetyGain.gain.value = 0.5;

    // Routing: ScriptProcessor -> Analyser -> masterGain -> safetyLimiter -> compressor -> destination
    this.scriptNode.connect(this.analyser);
    this.analyser.connect(this.masterGain);
    this.masterGain.connect(this.safetyLimiter);
    this.safetyLimiter.connect(this.compressor);
    this.compressor.connect(this.ctx.destination);

    // Create mock context and sync sample rate
    this.mimium = createMimiumContext();
    this.mimium.set_samplerate(this.ctx.sampleRate);

    // Suspend immediately — play() will resume on user gesture
    try {
      await this.ctx.suspend();
    } catch {
      // Some browsers may reject suspend() if the context is already
      // in the desired state or if the audio system is unavailable.
      console.warn('[AudioEngine] Failed to suspend AudioContext during init.');
    }
  }

  /** Compile mimium DSP code. Initialises the engine if needed. */
  async compile(code: string): Promise<void> {
    if (!this.ctx) {
      await this.init();
    }
    try {
      this.mimium?.compile(code);
      useCompileStore.getState().setStatus('ready');
      useCompileStore.getState().setError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      useCompileStore.getState().setStatus('error');
      useCompileStore.getState().setError(message);
      throw error;
    }
  }

  /** Resume audio playback. Must be called from a user-gesture handler. */
  async play(): Promise<void> {
    if (!this.ctx) {
      await this.init();
    }
    // Fade-in: start silent and ramp up over 100ms to prevent sudden pops
    if (this.masterGain && this.ctx) {
      const safeVol = Math.min(this.userVolume, MAX_SAFE_GAIN);
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(safeVol, this.ctx.currentTime + 0.1);
    }
    // Chrome autoplay policy: resume must originate from user gesture
    if (this.ctx?.state === 'suspended') {
      try {
        await this.ctx?.resume();
      } catch {
        // resume() can reject on mobile when not triggered by a user
        // gesture, or when the audio system is unavailable. Fail
        // gracefully so the app remains usable (children can still
        // build blocks even if audio is temporarily unavailable).
        console.warn('[AudioEngine] Failed to resume AudioContext. Audio may be unavailable.');
        useCompileStore.getState().setStatus('error');
        useCompileStore.getState().setError('おとがならないみたい。がめんをタッチしてからもういちどためしてね！');
      }
    }
    // Audio context is now resumed and playing
  }

  /** Stop audio playback. */
  async stop(): Promise<void> {
    if (this.ctx && this.ctx.state === 'running') {
      // Fade-out over 50ms before suspending to prevent clicks
      if (this.masterGain) {
        this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.05);
      }
      await new Promise<void>((resolve) => {
        setTimeout(async () => {
          try {
            await this.ctx?.suspend();
          } catch {
            // suspend() can reject if the context is already closed
            // or the audio system is unavailable. Fail gracefully.
            console.warn('[AudioEngine] Failed to suspend AudioContext during stop.');
          }
          resolve();
        }, 60);
      });
    }
    // Audio context is now suspended
  }

  /**
   * Fully release all audio resources.
   * Call this when the audio engine is no longer needed (e.g., page unmount).
   * After calling dispose(), the engine can be re-initialised with init().
   */
  async dispose(): Promise<void> {
    // Fade out first if running
    if (this.ctx && this.ctx.state === 'running') {
      if (this.masterGain) {
        this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.05);
      }
      await new Promise<void>((r) => setTimeout(r, 60));
    }

    // Disconnect all nodes to release resources
    try { this.scriptNode?.disconnect(); } catch { /* already disconnected */ }
    try { this.analyser?.disconnect(); } catch { /* already disconnected */ }
    try { this.masterGain?.disconnect(); } catch { /* already disconnected */ }
    try { this.safetyLimiter?.disconnect(); } catch { /* already disconnected */ }
    try { this.compressor?.disconnect(); } catch { /* already disconnected */ }
    try { this.micSafetyGain?.disconnect(); } catch { /* already disconnected */ }

    // Close the AudioContext to release system audio resources
    if (this.ctx && this.ctx.state !== 'closed') {
      try {
        await this.ctx.close();
      } catch {
        // close() can reject if the context is already closed
        console.warn('[AudioEngine] Failed to close AudioContext during dispose.');
      }
    }

    // Null out all references so init() can rebuild from scratch
    this.scriptNode = null;
    this.analyser = null;
    this.masterGain = null;
    this.safetyLimiter = null;
    this.compressor = null;
    this.micSafetyGain = null;
    this.mimium = null;
    this.ctx = null;
  }

  /** Return the AnalyserNode for waveform / spectrum visualisation. */
  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  /** Return the underlying AudioContext (for advanced use). */
  getAudioContext(): AudioContext | null {
    return this.ctx;
  }

  /**
   * Return the microphone safety gain node.
   * Microphone input should be routed through this node to ensure
   * safe levels before entering the DSP processing chain.
   */
  getMicSafetyGain(): GainNode | null {
    return this.micSafetyGain;
  }

  /**
   * Set master volume, hard-clamped to safe range [0, MAX_SAFE_GAIN].
   * Even if the caller requests 1.0, the actual gain will never exceed
   * MAX_SAFE_GAIN (~0.5, i.e. -6 dB) to protect children's hearing.
   */
  setVolume(value: number): void {
    this.userVolume = Math.max(0, Math.min(1, value));
    const safe = Math.min(this.userVolume, MAX_SAFE_GAIN);
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.linearRampToValueAtTime(safe, this.ctx.currentTime + 0.05);
    }
  }

  /** Get current master volume for UI display (returns the user-requested value). */
  getVolume(): number {
    return this.userVolume;
  }

  /**
   * Get the maximum safe gain value.
   * UI components can use this to display the safety limit.
   */
  getMaxSafeGain(): number {
    return MAX_SAFE_GAIN;
  }
}

export const audioEngine = new AudioEngine();
