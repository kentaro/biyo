/**
 * MicrophoneManager: handles getUserMedia for real-time audio input.
 *
 * Captures microphone input and writes samples into a circular buffer
 * that the DSP engine can read from on each sample tick. This enables
 * children to sing/speak into their creation and hear effects applied
 * to their voice in real-time.
 *
 * SAFETY: The microphone signal is NEVER connected directly to the
 * audio output (speakers). This prevents feedback loops which could
 * produce dangerously loud howling sounds. Instead, mic samples are
 * written into a circular buffer and read by the DSP engine, which
 * applies the full safety chain (DC blocker, tanh clamp, gain limit,
 * compressor) before any sound reaches the speakers.
 */

/** Size of the circular buffer in samples (~1 second at 48kHz) */
const BUFFER_SIZE = 48000;

/**
 * Maximum amplitude for microphone samples entering the buffer.
 * This prevents extremely loud mic input (e.g., blowing into the mic)
 * from producing dangerous levels even after DSP processing.
 */
const MIC_SAMPLE_CLAMP = 0.8;

/** Child-friendly error messages for permission states */
const PERMISSION_MESSAGES = {
  prompt: 'マイクをつかっていい？',
  denied: 'マイクがつかえないよ。おうちのひとにきいてみてね！',
  unavailable: 'このブラウザではマイクがつかえないみたい。ごめんね！',
  error: 'マイクがうまくいかなかったみたい。もういちどためしてみてね！',
} as const;

export type MicPermissionStatus =
  | 'idle'
  | 'prompting'
  | 'granted'
  | 'denied'
  | 'unavailable'
  | 'error';

class MicrophoneManager {
  private stream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private silentGain: GainNode | null = null;
  private audioContext: AudioContext | null = null;
  private active = false;
  private permissionStatus: MicPermissionStatus = 'idle';

  /**
   * Circular buffer shared with the DSP engine.
   * The DSP engine reads from readPos; the mic writes to writePos.
   */
  private buffer = new Float32Array(BUFFER_SIZE);
  private writePos = 0;
  private readPos = 0;

  /** Listeners notified when permission status changes */
  private listeners: Set<(status: MicPermissionStatus, message: string) => void> = new Set();

  /** Register a listener for permission status changes */
  onStatusChange(listener: (status: MicPermissionStatus, message: string) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(status: MicPermissionStatus, message: string) {
    this.permissionStatus = status;
    for (const listener of this.listeners) {
      listener(status, message);
    }
  }

  /** Check if navigator.mediaDevices.getUserMedia is available */
  private isMediaDevicesAvailable(): boolean {
    return !!(
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function'
    );
  }

  /**
   * Request microphone access and begin capturing audio into the buffer.
   *
   * SAFETY ARCHITECTURE:
   * The mic signal flows: mic -> source -> processor -> silentGain(0) -> destination
   *
   * The processor's onaudioprocess callback captures samples into the circular
   * buffer. The output of the processor is routed through a GainNode set to 0,
   * so NO mic audio reaches the speakers directly. This prevents feedback loops.
   *
   * The DSP engine reads from the circular buffer via readSample(), and that
   * signal goes through the full safety chain (DC blocker, tanh, gain limit,
   * compressor) in the main audio engine before reaching speakers.
   *
   * @param audioCtx - The AudioContext from the engine (for creating source nodes)
   */
  async start(audioCtx?: AudioContext): Promise<void> {
    if (this.active) return;

    if (!this.isMediaDevicesAvailable()) {
      this.notifyListeners('unavailable', PERMISSION_MESSAGES.unavailable);
      return;
    }

    this.notifyListeners('prompting', PERMISSION_MESSAGES.prompt);

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
    } catch (err) {
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          this.notifyListeners('denied', PERMISSION_MESSAGES.denied);
          return;
        }
        if (err.name === 'NotFoundError') {
          this.notifyListeners('unavailable', PERMISSION_MESSAGES.unavailable);
          return;
        }
      }
      this.notifyListeners('error', PERMISSION_MESSAGES.error);
      return;
    }

    this.notifyListeners('granted', '');

    // Use the provided AudioContext or create one
    this.audioContext = audioCtx ?? new AudioContext({ sampleRate: 48000 });
    this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);

    // ScriptProcessorNode to capture raw samples into our circular buffer.
    // Buffer size of 2048 provides good latency (~42ms at 48kHz).
    this.processorNode = this.audioContext.createScriptProcessor(2048, 1, 1);
    this.processorNode.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0);
      for (let i = 0; i < input.length; i++) {
        // Clamp mic input to safe amplitude range to prevent
        // extremely loud transients from entering the buffer
        const clamped = Math.max(-MIC_SAMPLE_CLAMP, Math.min(MIC_SAMPLE_CLAMP, input[i]));
        this.buffer[this.writePos] = clamped;
        this.writePos = (this.writePos + 1) % BUFFER_SIZE;
      }
    };

    // SAFETY: Create a silent gain node (gain = 0) between the processor
    // and the destination. ScriptProcessorNode requires a connection to
    // the destination to keep its onaudioprocess callback firing, but we
    // must NOT send raw mic audio to the speakers (feedback loop danger).
    // Setting gain to 0 silences the direct mic output while keeping the
    // processor active.
    this.silentGain = this.audioContext.createGain();
    this.silentGain.gain.value = 0;

    // Connect: mic source -> processor -> silentGain(0) -> destination
    // The processor captures samples into the buffer; silentGain ensures
    // NO mic audio reaches the speakers directly.
    this.sourceNode.connect(this.processorNode);
    this.processorNode.connect(this.silentGain);
    this.silentGain.connect(this.audioContext.destination);

    // Reset read position to current write position (no stale samples)
    this.readPos = this.writePos;
    this.active = true;
  }

  /** Stop capturing and release microphone resources. */
  stop(): void {
    if (this.silentGain) {
      try {
        this.silentGain.disconnect();
      } catch {
        // already disconnected
      }
      this.silentGain = null;
    }

    if (this.processorNode) {
      this.processorNode.onaudioprocess = null;
      try {
        this.processorNode.disconnect();
      } catch {
        // already disconnected
      }
      this.processorNode = null;
    }

    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {
        // already disconnected
      }
      this.sourceNode = null;
    }

    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        track.stop();
      }
      this.stream = null;
    }

    this.active = false;
    this.permissionStatus = 'idle';
  }

  /** Whether the microphone is currently active and capturing. */
  isActive(): boolean {
    return this.active;
  }

  /** Get the current permission status. */
  getPermissionStatus(): MicPermissionStatus {
    return this.permissionStatus;
  }

  /**
   * Read the next sample from the circular buffer.
   * Called by the DSP engine on each sample tick.
   * Returns 0.0 if the mic is not active or no new data is available.
   */
  readSample(): number {
    if (!this.active) return 0.0;

    // If read has caught up to write, return the last written sample (hold)
    if (this.readPos === this.writePos) {
      const prevPos = (this.writePos - 1 + BUFFER_SIZE) % BUFFER_SIZE;
      return this.buffer[prevPos];
    }

    const sample = this.buffer[this.readPos];
    this.readPos = (this.readPos + 1) % BUFFER_SIZE;
    return sample;
  }
}

/** Singleton instance shared between the engine and the block system */
export const microphoneManager = new MicrophoneManager();
