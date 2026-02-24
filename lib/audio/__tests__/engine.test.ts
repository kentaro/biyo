import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock: @/lib/stores/compile  (zustand store)
// ---------------------------------------------------------------------------
const mockSetStatus = vi.fn();
const mockSetError = vi.fn();

vi.mock('@/lib/stores/compile', () => ({
  useCompileStore: {
    getState: () => ({
      setStatus: mockSetStatus,
      setError: mockSetError,
    }),
  },
}));

// ---------------------------------------------------------------------------
// Mock: ./wasm-loader  (MimiumContext factory)
// ---------------------------------------------------------------------------
const mockCompile = vi.fn();
const mockProcess = vi.fn();
const mockGetSamplerate = vi.fn(() => 48000);
const mockSetSamplerate = vi.fn();

vi.mock('../wasm-loader', () => ({
  createMimiumContext: () => ({
    compile: mockCompile,
    process: mockProcess,
    get_samplerate: mockGetSamplerate,
    set_samplerate: mockSetSamplerate,
  }),
}));

// ---------------------------------------------------------------------------
// Web Audio API mocks
// ---------------------------------------------------------------------------

function createMockAudioParam(initial = 0): AudioParam {
  return {
    value: initial,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
  } as unknown as AudioParam;
}

/** Track all GainNodes created by createGain() */
let createdGainNodes: GainNode[];

function createMockGainNode(): GainNode {
  const node = {
    gain: createMockAudioParam(0),
    connect: vi.fn(),
    disconnect: vi.fn(),
  } as unknown as GainNode;
  createdGainNodes.push(node);
  return node;
}

function createMockAnalyserNode(): AnalyserNode {
  return {
    fftSize: 0,
    connect: vi.fn(),
    disconnect: vi.fn(),
  } as unknown as AnalyserNode;
}

function createMockScriptProcessorNode(): ScriptProcessorNode & {
  _trigger: (output: Float32Array) => void;
} {
  let handler: ((e: AudioProcessingEvent) => void) | null = null;
  const node = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    get onaudioprocess() {
      return handler;
    },
    set onaudioprocess(fn: ((e: AudioProcessingEvent) => void) | null) {
      handler = fn;
    },
    _trigger(output: Float32Array) {
      if (handler) {
        handler({
          outputBuffer: { getChannelData: () => output },
        } as unknown as AudioProcessingEvent);
      }
    },
  };
  return node as unknown as ScriptProcessorNode & {
    _trigger: (output: Float32Array) => void;
  };
}

function createMockDynamicsCompressorNode(): DynamicsCompressorNode {
  return {
    threshold: createMockAudioParam(-6),
    knee: createMockAudioParam(1),
    ratio: createMockAudioParam(20),
    attack: createMockAudioParam(0.001),
    release: createMockAudioParam(0.25),
    connect: vi.fn(),
    disconnect: vi.fn(),
  } as unknown as DynamicsCompressorNode;
}

let mockScriptNode: ReturnType<typeof createMockScriptProcessorNode>;
let mockAnalyser: AnalyserNode;
let mockCompressorNode: DynamicsCompressorNode;
let mockContextState: string;
let mockCurrentTime: number;
let mockSampleRate: number;
let mockDestination: object;
let mockSuspend: ReturnType<typeof vi.fn>;
let mockResume: ReturnType<typeof vi.fn>;
let mockCreateScriptProcessor: ReturnType<typeof vi.fn>;
let mockCreateAnalyser: ReturnType<typeof vi.fn>;
let mockCreateGain: ReturnType<typeof vi.fn>;
let mockCreateDynamicsCompressor: ReturnType<typeof vi.fn>;

/**
 * Build a class-based AudioContext mock.
 * Arrow functions are not constructable; `new AudioContext()` needs a real
 * function/class constructor.
 */
function buildMockAudioContextClass() {
  mockContextState = 'running';
  mockCurrentTime = 0;
  mockSampleRate = 48000;
  mockDestination = {};
  createdGainNodes = [];
  mockScriptNode = createMockScriptProcessorNode();
  mockAnalyser = createMockAnalyserNode();
  mockCompressorNode = createMockDynamicsCompressorNode();
  mockSuspend = vi.fn(() => {
    mockContextState = 'suspended';
    return Promise.resolve();
  });
  mockResume = vi.fn(() => {
    mockContextState = 'running';
    return Promise.resolve();
  });
  mockCreateScriptProcessor = vi.fn(() => mockScriptNode);
  mockCreateAnalyser = vi.fn(() => mockAnalyser);
  mockCreateGain = vi.fn(() => createMockGainNode());
  mockCreateDynamicsCompressor = vi.fn(() => mockCompressorNode);

  // Use vi.fn wrapping a regular function so it is constructable.
  const Ctor = vi.fn(function MockAudioContext(this: Record<string, unknown>) {
    Object.defineProperty(this, 'state', { get: () => mockContextState });
    Object.defineProperty(this, 'currentTime', {
      get: () => mockCurrentTime,
    });
    Object.defineProperty(this, 'sampleRate', { get: () => mockSampleRate });
    this.destination = mockDestination;
    this.createScriptProcessor = mockCreateScriptProcessor;
    this.createAnalyser = mockCreateAnalyser;
    this.createGain = mockCreateGain;
    this.createDynamicsCompressor = mockCreateDynamicsCompressor;
    this.suspend = mockSuspend;
    this.resume = mockResume;
  });

  return Ctor;
}

// ---------------------------------------------------------------------------
// Per-test setup
// ---------------------------------------------------------------------------

let audioEngine: typeof import('../engine')['audioEngine'];
let MockAudioContextCtor: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();
  vi.useFakeTimers();

  mockSetStatus.mockReset();
  mockSetError.mockReset();
  mockCompile.mockReset();
  mockProcess.mockReset();
  mockGetSamplerate.mockReset().mockReturnValue(48000);
  mockSetSamplerate.mockReset();
  createdGainNodes = [];

  MockAudioContextCtor = buildMockAudioContextClass();
  (globalThis as Record<string, unknown>).AudioContext = MockAudioContextCtor;

  const mod = await import('../engine');
  audioEngine = mod.audioEngine;
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  delete (globalThis as Record<string, unknown>).AudioContext;
});

// ===========================================================================
// Tests
// ===========================================================================

describe('AudioEngine', () => {
  // -----------------------------------------------------------------------
  // init()
  // -----------------------------------------------------------------------
  describe('init()', () => {
    it('creates an AudioContext with sampleRate 48000', async () => {
      await audioEngine.init();
      expect(MockAudioContextCtor).toHaveBeenCalledWith({ sampleRate: 48000 });
    });

    it('creates ScriptProcessorNode, AnalyserNode, 3 GainNodes, DynamicsCompressorNode', async () => {
      await audioEngine.init();
      expect(mockCreateScriptProcessor).toHaveBeenCalledWith(4096, 0, 1);
      expect(mockCreateAnalyser).toHaveBeenCalled();
      // 3 GainNodes: masterGain, safetyLimiter, micSafetyGain
      expect(mockCreateGain).toHaveBeenCalledTimes(3);
      expect(mockCreateDynamicsCompressor).toHaveBeenCalled();
    });

    it('sets analyser fftSize to 2048', async () => {
      await audioEngine.init();
      expect(mockAnalyser.fftSize).toBe(2048);
    });

    it('sets masterGain to DEFAULT_GAIN (0.35)', async () => {
      await audioEngine.init();
      // First gain node created is masterGain
      const masterGain = createdGainNodes[0];
      expect(masterGain.gain.value).toBe(0.35);
    });

    it('creates safetyLimiter with gain 1.0', async () => {
      await audioEngine.init();
      // Second gain node is safetyLimiter
      const safetyLimiter = createdGainNodes[1];
      expect(safetyLimiter.gain.value).toBe(1.0);
    });

    it('creates micSafetyGain with gain 0.5', async () => {
      await audioEngine.init();
      // Third gain node is micSafetyGain
      const micSafetyGain = createdGainNodes[2];
      expect(micSafetyGain.gain.value).toBe(0.5);
    });

    it('configures compressor with aggressive child-safe parameters', async () => {
      await audioEngine.init();
      expect(mockCompressorNode.threshold.value).toBe(-6);
      expect(mockCompressorNode.knee.value).toBe(1);
      expect(mockCompressorNode.ratio.value).toBe(20);
      expect(mockCompressorNode.attack.value).toBe(0.001);
      expect(mockCompressorNode.release.value).toBe(0.25);
    });

    it('connects audio graph: scriptNode -> analyser -> masterGain -> safetyLimiter -> compressor -> destination', async () => {
      await audioEngine.init();
      const masterGain = createdGainNodes[0];
      const safetyLimiter = createdGainNodes[1];

      expect(mockScriptNode.connect).toHaveBeenCalledWith(mockAnalyser);
      expect(
        (mockAnalyser as unknown as { connect: ReturnType<typeof vi.fn> }).connect,
      ).toHaveBeenCalledWith(masterGain);
      expect(
        (masterGain as unknown as { connect: ReturnType<typeof vi.fn> }).connect,
      ).toHaveBeenCalledWith(safetyLimiter);
      expect(
        (safetyLimiter as unknown as { connect: ReturnType<typeof vi.fn> }).connect,
      ).toHaveBeenCalledWith(mockCompressorNode);
      expect(
        (
          mockCompressorNode as unknown as {
            connect: ReturnType<typeof vi.fn>;
          }
        ).connect,
      ).toHaveBeenCalledWith(mockDestination);
    });

    it('creates a mimium context and sets the sample rate', async () => {
      await audioEngine.init();
      expect(mockSetSamplerate).toHaveBeenCalledWith(48000);
    });

    it('suspends the AudioContext after init', async () => {
      await audioEngine.init();
      expect(mockSuspend).toHaveBeenCalled();
    });

    it('is idempotent -- second call is a no-op', async () => {
      await audioEngine.init();
      await audioEngine.init();
      expect(MockAudioContextCtor).toHaveBeenCalledTimes(1);
    });
  });

  // -----------------------------------------------------------------------
  // onaudioprocess callback
  // -----------------------------------------------------------------------
  describe('onaudioprocess callback', () => {
    it('delegates to mimium.process when mimium context exists', async () => {
      await audioEngine.init();
      const output = new Float32Array(128);
      mockScriptNode._trigger(output);
      expect(mockProcess).toHaveBeenCalledWith(output);
    });

    it('fills output with zeroes when mimium is null', async () => {
      vi.resetModules();

      vi.doMock('../wasm-loader', () => ({
        createMimiumContext: () => null,
      }));

      const Ctor2 = buildMockAudioContextClass();
      (globalThis as Record<string, unknown>).AudioContext = Ctor2;

      const mod2 = await import('../engine');
      // init() crashes at this.mimium.set_samplerate() because mimium is null,
      // but onaudioprocess was already assigned before the crash.
      await expect(mod2.audioEngine.init()).rejects.toThrow();

      const output = new Float32Array(4);
      output[0] = 99;
      mockScriptNode._trigger(output);
      expect(output[0]).toBe(0);
      expect(output[1]).toBe(0);

      // Clean up: re-register the original mock so subsequent tests work.
      // vi.doUnmock would remove ALL mocks including the hoisted vi.mock.
      vi.doMock('../wasm-loader', () => ({
        createMimiumContext: () => ({
          compile: mockCompile,
          process: mockProcess,
          get_samplerate: mockGetSamplerate,
          set_samplerate: mockSetSamplerate,
        }),
      }));
    });
  });

  // -----------------------------------------------------------------------
  // compile()
  // -----------------------------------------------------------------------
  describe('compile()', () => {
    it('calls init() if context is not yet created', async () => {
      await audioEngine.compile('sinwave(440)');
      expect(MockAudioContextCtor).toHaveBeenCalledTimes(1);
    });

    it('does not re-init if already initialised', async () => {
      await audioEngine.init();
      await audioEngine.compile('sinwave(440)');
      expect(MockAudioContextCtor).toHaveBeenCalledTimes(1);
    });

    it('delegates to mimium.compile with the provided code', async () => {
      await audioEngine.compile('sinwave(440)');
      expect(mockCompile).toHaveBeenCalledWith('sinwave(440)');
    });

    it("sets compile store status to 'ready' and error to null on success", async () => {
      await audioEngine.compile('sinwave(440)');
      expect(mockSetStatus).toHaveBeenCalledWith('ready');
      expect(mockSetError).toHaveBeenCalledWith(null);
    });

    it("sets compile store status to 'error' and error message when compile throws Error", async () => {
      const err = new Error('parse error at line 2');
      mockCompile.mockImplementation(() => {
        throw err;
      });
      await expect(audioEngine.compile('bad code')).rejects.toThrow('parse error at line 2');
      expect(mockSetStatus).toHaveBeenCalledWith('error');
      expect(mockSetError).toHaveBeenCalledWith('parse error at line 2');
    });

    it('sets compile store error to stringified value when compile throws non-Error', async () => {
      mockCompile.mockImplementation(() => {
        throw 'string error';
      });
      await expect(audioEngine.compile('bad code')).rejects.toBe('string error');
      expect(mockSetStatus).toHaveBeenCalledWith('error');
      expect(mockSetError).toHaveBeenCalledWith('string error');
    });

    it('re-throws the error after updating the store', async () => {
      const err = new Error('boom');
      mockCompile.mockImplementation(() => {
        throw err;
      });
      await expect(audioEngine.compile('bad')).rejects.toThrow(err);
    });
  });

  // -----------------------------------------------------------------------
  // play()
  // -----------------------------------------------------------------------
  describe('play()', () => {
    it('calls init() if context is not yet created', async () => {
      await audioEngine.play();
      expect(MockAudioContextCtor).toHaveBeenCalledTimes(1);
    });

    it('does not re-init if already initialised', async () => {
      await audioEngine.init();
      await audioEngine.play();
      expect(MockAudioContextCtor).toHaveBeenCalledTimes(1);
    });

    it('applies fade-in: sets gain to 0 then ramps to DEFAULT_GAIN (0.35) over 0.1s', async () => {
      await audioEngine.init();
      const masterGain = createdGainNodes[0];
      await audioEngine.play();
      expect(masterGain.gain.setValueAtTime).toHaveBeenCalledWith(0, mockCurrentTime);
      expect(masterGain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
        0.35,
        mockCurrentTime + 0.1,
      );
    });

    it('fade-in volume is clamped to MAX_SAFE_GAIN (0.5) even if userVolume is higher', async () => {
      await audioEngine.init();
      const masterGain = createdGainNodes[0];
      // Set volume to maximum (1.0) -- should be clamped to 0.5
      audioEngine.setVolume(1.0);
      // Clear previous calls from setVolume
      (masterGain.gain.linearRampToValueAtTime as ReturnType<typeof vi.fn>).mockClear();
      (masterGain.gain.setValueAtTime as ReturnType<typeof vi.fn>).mockClear();

      await audioEngine.play();
      expect(masterGain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
        0.5,
        mockCurrentTime + 0.1,
      );
    });

    it('resumes a suspended AudioContext', async () => {
      await audioEngine.init();
      expect(mockContextState).toBe('suspended');
      await audioEngine.play();
      expect(mockResume).toHaveBeenCalled();
    });

    it('does not call resume if context is already running', async () => {
      await audioEngine.init();
      mockContextState = 'running';
      mockResume.mockClear();
      await audioEngine.play();
      expect(mockResume).not.toHaveBeenCalled();
    });

    it('skips fade-in when masterGain is null (defensive guard)', async () => {
      await audioEngine.init();
      // Null out masterGain to hit the false branch of `if (this.masterGain && this.ctx)`
      (audioEngine as unknown as Record<string, unknown>).masterGain = null;
      // Should not throw
      await audioEngine.play();
    });
  });

  // -----------------------------------------------------------------------
  // stop()
  // -----------------------------------------------------------------------
  describe('stop()', () => {
    it('applies fade-out ramp and suspends a running context', async () => {
      await audioEngine.init();
      const masterGain = createdGainNodes[0];
      mockContextState = 'running';

      const stopPromise = audioEngine.stop();
      await vi.advanceTimersByTimeAsync(60);
      await stopPromise;

      expect(masterGain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
        0,
        mockCurrentTime + 0.05,
      );
      // suspend: once in init(), once in stop()
      expect(mockSuspend).toHaveBeenCalledTimes(2);
    });

    it('does not suspend if context is already suspended', async () => {
      await audioEngine.init();
      const suspendCallsBefore = mockSuspend.mock.calls.length;
      await audioEngine.stop();
      expect(mockSuspend).toHaveBeenCalledTimes(suspendCallsBefore);
    });

    it('does nothing if context was never created', async () => {
      await audioEngine.stop();
    });

    it('skips fade-out when masterGain is null (defensive guard)', async () => {
      await audioEngine.init();
      mockContextState = 'running';
      // Null out masterGain to hit the false branch of `if (this.masterGain)`
      (audioEngine as unknown as Record<string, unknown>).masterGain = null;

      const stopPromise = audioEngine.stop();
      await vi.advanceTimersByTimeAsync(60);
      await stopPromise;

      // Suspend still happens even without masterGain fade-out
      expect(mockSuspend).toHaveBeenCalledTimes(2);
    });

    it('is safe to call stop twice in a row', async () => {
      await audioEngine.init();
      mockContextState = 'running';

      const p = audioEngine.stop();
      await vi.advanceTimersByTimeAsync(60);
      await p;

      // Context is now suspended; second stop is a no-op.
      await audioEngine.stop();
    });
  });

  // -----------------------------------------------------------------------
  // getAnalyser()
  // -----------------------------------------------------------------------
  describe('getAnalyser()', () => {
    it('returns null before init', () => {
      expect(audioEngine.getAnalyser()).toBeNull();
    });

    it('returns the AnalyserNode after init', async () => {
      await audioEngine.init();
      expect(audioEngine.getAnalyser()).toBe(mockAnalyser);
    });
  });

  // -----------------------------------------------------------------------
  // getAudioContext()
  // -----------------------------------------------------------------------
  describe('getAudioContext()', () => {
    it('returns null before init', () => {
      expect(audioEngine.getAudioContext()).toBeNull();
    });

    it('returns the AudioContext after init', async () => {
      await audioEngine.init();
      const result = audioEngine.getAudioContext();
      expect(result).toBeTruthy();
      expect((result as unknown as Record<string, unknown>).suspend).toBe(mockSuspend);
    });
  });

  // -----------------------------------------------------------------------
  // getMicSafetyGain()
  // -----------------------------------------------------------------------
  describe('getMicSafetyGain()', () => {
    it('returns null before init', () => {
      expect(audioEngine.getMicSafetyGain()).toBeNull();
    });

    it('returns the mic safety GainNode after init', async () => {
      await audioEngine.init();
      const micSafetyGain = createdGainNodes[2];
      expect(audioEngine.getMicSafetyGain()).toBe(micSafetyGain);
    });
  });

  // -----------------------------------------------------------------------
  // setVolume()
  // -----------------------------------------------------------------------
  describe('setVolume()', () => {
    it('does nothing to gain node if called before init (no masterGain/ctx)', () => {
      audioEngine.setVolume(0.5);
    });

    it('clamps value to [0, MAX_SAFE_GAIN] - lower bound', async () => {
      await audioEngine.init();
      const masterGain = createdGainNodes[0];
      audioEngine.setVolume(-0.5);
      expect(masterGain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
        0,
        mockCurrentTime + 0.05,
      );
    });

    it('clamps value to MAX_SAFE_GAIN (0.5) - upper bound', async () => {
      await audioEngine.init();
      const masterGain = createdGainNodes[0];
      audioEngine.setVolume(1.5);
      // Even though user requested 1.5, actual gain is clamped to 0.5
      expect(masterGain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
        0.5,
        mockCurrentTime + 0.05,
      );
    });

    it('sets gain to provided value when within safe range [0, 0.5]', async () => {
      await audioEngine.init();
      const masterGain = createdGainNodes[0];
      audioEngine.setVolume(0.3);
      expect(masterGain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
        0.3,
        mockCurrentTime + 0.05,
      );
    });

    it('hard-caps at MAX_SAFE_GAIN even for value of 1.0', async () => {
      await audioEngine.init();
      const masterGain = createdGainNodes[0];
      audioEngine.setVolume(1.0);
      expect(masterGain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
        0.5,
        mockCurrentTime + 0.05,
      );
    });
  });

  // -----------------------------------------------------------------------
  // getVolume()
  // -----------------------------------------------------------------------
  describe('getVolume()', () => {
    it('returns DEFAULT_GAIN (0.35) before init', () => {
      expect(audioEngine.getVolume()).toBe(0.35);
    });

    it('returns user-requested volume after setVolume (not clamped value)', async () => {
      await audioEngine.init();
      audioEngine.setVolume(0.8);
      // getVolume returns the user-requested value (not the clamped value)
      expect(audioEngine.getVolume()).toBe(0.8);
    });

    it('clamps user-requested volume to [0, 1] range', async () => {
      await audioEngine.init();
      audioEngine.setVolume(1.5);
      expect(audioEngine.getVolume()).toBe(1);
    });
  });

  // -----------------------------------------------------------------------
  // getMaxSafeGain()
  // -----------------------------------------------------------------------
  describe('getMaxSafeGain()', () => {
    it('returns 0.5 (MAX_SAFE_GAIN)', () => {
      expect(audioEngine.getMaxSafeGain()).toBe(0.5);
    });
  });
});
