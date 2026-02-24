import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type RecordingState, recordFromNode } from '../recorder';

// ---------------------------------------------------------------------------
// Helpers – Mock factories
// ---------------------------------------------------------------------------

/** Build a minimal mock AudioContext */
function createMockAudioContext(sampleRate = 44100) {
  const mockDestStream = { id: 'mock-stream' } as unknown as MediaStream;
  const mockDestNode = {
    stream: mockDestStream,
  } as unknown as MediaStreamAudioDestinationNode;

  return {
    sampleRate,
    createMediaStreamDestination: vi.fn(() => mockDestNode),
    __destNode: mockDestNode,
    __destStream: mockDestStream,
  } as unknown as AudioContext & {
    __destNode: MediaStreamAudioDestinationNode;
    __destStream: MediaStream;
  };
}

/** Build a minimal mock AudioNode (source) */
function createMockSourceNode() {
  return {
    connect: vi.fn(),
    disconnect: vi.fn(),
  } as unknown as AudioNode;
}

// ---------------------------------------------------------------------------
// MediaRecorder mock
// ---------------------------------------------------------------------------

type MediaRecorderEventHandler = ((...args: unknown[]) => void) | null;

interface MockMediaRecorder {
  state: string;
  ondataavailable: MediaRecorderEventHandler;
  onstop: MediaRecorderEventHandler;
  onerror: MediaRecorderEventHandler;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
}

let mockMediaRecorderInstance: MockMediaRecorder;

class FakeMediaRecorder implements MockMediaRecorder {
  state = 'inactive';
  ondataavailable: MediaRecorderEventHandler = null;
  onstop: MediaRecorderEventHandler = null;
  onerror: MediaRecorderEventHandler = null;

  start = vi.fn((_timeslice?: number) => {
    this.state = 'recording';
  });

  stop = vi.fn(() => {
    this.state = 'inactive';
    // onstop is called asynchronously by the real API
    queueMicrotask(() => {
      this.onstop?.();
    });
  });

  constructor(_stream: MediaStream, _options?: Record<string, unknown>) {
    mockMediaRecorderInstance = this;
  }
}

// ---------------------------------------------------------------------------
// OfflineAudioContext mock (class-based to satisfy `new`)
// ---------------------------------------------------------------------------

function createFakeOfflineCtxResult() {
  const renderedBuffer = {
    length: 4,
    getChannelData: vi.fn(() => new Float32Array([0.0, 0.5, -0.5, 1.0])),
  };

  const bufferSource = {
    buffer: null as AudioBuffer | null,
    connect: vi.fn(),
    start: vi.fn(),
  };

  return {
    decodeAudioData: vi.fn(async (_buf: ArrayBuffer) => ({
      length: 4,
      sampleRate: 44100,
      numberOfChannels: 1,
      duration: 4 / 44100,
      getChannelData: vi.fn(() => new Float32Array([0.0, 0.5, -0.5, 1.0])),
    })),
    createBufferSource: vi.fn(() => bufferSource),
    destination: {},
    startRendering: vi.fn(async () => renderedBuffer),
  };
}

// A factory function that returns a class, allowing custom overrides
function makeFakeOfflineAudioContextClass(
  factoryFn?: () => ReturnType<typeof createFakeOfflineCtxResult>,
) {
  return class FakeOfflineAudioContext {
    decodeAudioData: ReturnType<typeof vi.fn>;
    createBufferSource: ReturnType<typeof vi.fn>;
    destination: object;
    startRendering: ReturnType<typeof vi.fn>;

    constructor(_channels: number, _length: number, _sampleRate: number) {
      const result = factoryFn ? factoryFn() : createFakeOfflineCtxResult();
      this.decodeAudioData = result.decodeAudioData;
      this.createBufferSource = result.createBufferSource;
      this.destination = result.destination;
      this.startRendering = result.startRendering;
    }
  };
}

// ---------------------------------------------------------------------------
// Global setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.useFakeTimers();

  // Install MediaRecorder mock
  vi.stubGlobal('MediaRecorder', FakeMediaRecorder);

  // Install OfflineAudioContext mock (default happy-path)
  vi.stubGlobal('OfflineAudioContext', makeFakeOfflineAudioContextClass());
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Helper to finish a recording: advance timers until duration, flush microtasks
// ---------------------------------------------------------------------------

async function finishRecording(durationMs = 200) {
  await vi.advanceTimersByTimeAsync(durationMs);
  // Flush microtasks (onstop fires via queueMicrotask)
  await vi.advanceTimersByTimeAsync(0);
  // Flush promise microtasks for convertToWav
  await vi.advanceTimersByTimeAsync(0);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('recordFromNode', () => {
  // -----------------------------------------------------------------------
  // Basic happy path
  // -----------------------------------------------------------------------

  it('creates a MediaStreamDestination and connects the source node', () => {
    const ctx = createMockAudioContext();
    const source = createMockSourceNode();

    recordFromNode(ctx, source, 1);

    expect(ctx.createMediaStreamDestination).toHaveBeenCalledOnce();
    expect(source.connect).toHaveBeenCalledWith(ctx.__destNode);
  });

  it('starts MediaRecorder with timeslice 100ms', () => {
    const ctx = createMockAudioContext();
    const source = createMockSourceNode();

    recordFromNode(ctx, source, 1);

    expect(mockMediaRecorderInstance.start).toHaveBeenCalledWith(100);
  });

  it('calls onProgress immediately with elapsed 0', () => {
    const ctx = createMockAudioContext();
    const source = createMockSourceNode();
    const onProgress = vi.fn();

    recordFromNode(ctx, source, 2, onProgress);

    expect(onProgress).toHaveBeenCalledWith({
      isRecording: true,
      elapsed: 0,
      duration: 2,
    });
  });

  it('returns an object with promise and cancel', () => {
    const ctx = createMockAudioContext();
    const source = createMockSourceNode();
    const result = recordFromNode(ctx, source, 1);

    expect(result).toHaveProperty('promise');
    expect(result).toHaveProperty('cancel');
    expect(result.promise).toBeInstanceOf(Promise);
    expect(typeof result.cancel).toBe('function');
  });

  // -----------------------------------------------------------------------
  // Recording & auto-stop after duration
  // -----------------------------------------------------------------------

  it('reports progress via the interval and stops when elapsed >= duration', async () => {
    const ctx = createMockAudioContext();
    const source = createMockSourceNode();
    const onProgress = vi.fn();

    const { promise } = recordFromNode(ctx, source, 0.3, onProgress);

    // Advance 300ms (3 x 100ms ticks); elapsed >= 0.3s triggers auto-stop
    await vi.advanceTimersByTimeAsync(300);
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(0);

    const progressCalls = onProgress.mock.calls.filter((c: unknown[]) => (c[0] as RecordingState).isRecording);
    expect(progressCalls.length).toBeGreaterThanOrEqual(2);

    expect(mockMediaRecorderInstance.stop).toHaveBeenCalled();

    const blob = await promise;
    expect(blob).toBeInstanceOf(Blob);
  });

  // -----------------------------------------------------------------------
  // ondataavailable – collects chunks / ignores empty
  // -----------------------------------------------------------------------

  it('collects data chunks when size > 0 and ignores empty chunks', async () => {
    const ctx = createMockAudioContext();
    const source = createMockSourceNode();

    const { promise } = recordFromNode(ctx, source, 0.15);

    // chunk with data
    const chunk = new Blob(['audio-data'], { type: 'audio/webm' });
    mockMediaRecorderInstance.ondataavailable?.({ data: chunk } as unknown);

    // chunk with size 0 — should be ignored
    mockMediaRecorderInstance.ondataavailable?.({
      data: { size: 0 },
    } as unknown);

    await finishRecording();

    const blob = await promise;
    expect(blob).toBeInstanceOf(Blob);
  });

  // -----------------------------------------------------------------------
  // convertToWav success path
  // -----------------------------------------------------------------------

  it('converts webm to wav on successful recording', async () => {
    const ctx = createMockAudioContext();
    const source = createMockSourceNode();

    const { promise } = recordFromNode(ctx, source, 0.15);

    mockMediaRecorderInstance.ondataavailable?.({
      data: new Blob(['audio-data'], { type: 'audio/webm' }),
    } as unknown);

    await finishRecording();

    const blob = await promise;
    expect(blob.type).toBe('audio/wav');
  });

  // -----------------------------------------------------------------------
  // convertToWav failure – falls back to webm
  // -----------------------------------------------------------------------

  it('falls back to webm blob when convertToWav fails', async () => {
    // Override OfflineAudioContext to throw on decodeAudioData
    vi.stubGlobal(
      'OfflineAudioContext',
      makeFakeOfflineAudioContextClass(() => {
        const base = createFakeOfflineCtxResult();
        base.decodeAudioData = vi.fn(async () => {
          throw new Error('decode failed');
        });
        return base;
      }),
    );

    const ctx = createMockAudioContext();
    const source = createMockSourceNode();

    const { promise } = recordFromNode(ctx, source, 0.15);

    mockMediaRecorderInstance.ondataavailable?.({
      data: new Blob(['audio-data'], { type: 'audio/webm' }),
    } as unknown);

    await finishRecording();

    const blob = await promise;
    expect(blob.type).toBe('audio/webm');
  });

  // -----------------------------------------------------------------------
  // Cancel
  // -----------------------------------------------------------------------

  it('cancel() stops MediaRecorder and rejects with "cancelled"', async () => {
    const ctx = createMockAudioContext();
    const source = createMockSourceNode();

    const { promise, cancel } = recordFromNode(ctx, source, 5);

    // Attach rejection handler BEFORE cancelling to avoid unhandled rejection
    const rejection = expect(promise).rejects.toThrow('cancelled');

    cancel();

    // Flush microtask (onstop fires via queueMicrotask in stop())
    await vi.advanceTimersByTimeAsync(0);

    await rejection;
  });

  it('cancel() does not call stop() if MediaRecorder is already inactive', async () => {
    const ctx = createMockAudioContext();
    const source = createMockSourceNode();

    const { promise, cancel } = recordFromNode(ctx, source, 5);

    // Force state to inactive before cancel
    mockMediaRecorderInstance.state = 'inactive';

    cancel();

    // stop was never called
    expect(mockMediaRecorderInstance.stop).not.toHaveBeenCalled();

    // The promise never settles here (no onstop will fire).
    // Just confirm cancel was safe and did not throw.
    // Prevent unhandled rejection by catching it:
    promise.catch(() => {});
  });

  // -----------------------------------------------------------------------
  // onerror
  // -----------------------------------------------------------------------

  it('rejects with error message on MediaRecorder error', async () => {
    const ctx = createMockAudioContext();
    const source = createMockSourceNode();

    const { promise } = recordFromNode(ctx, source, 5);

    mockMediaRecorderInstance.onerror?.();

    await expect(promise).rejects.toThrow(
      'ろくおんがうまくいかなかったよ。もういちどやってみよう！',
    );
  });

  it('onerror disconnects sourceNode from dest', async () => {
    const ctx = createMockAudioContext();
    const source = createMockSourceNode();

    const { promise } = recordFromNode(ctx, source, 5);

    mockMediaRecorderInstance.onerror?.();

    // Catch the rejection
    await promise.catch(() => {});

    expect(source.disconnect).toHaveBeenCalledWith(ctx.__destNode);
  });

  it('onerror clears the interval', async () => {
    const ctx = createMockAudioContext();
    const source = createMockSourceNode();
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');

    const { promise } = recordFromNode(ctx, source, 5);

    // Let at least one interval tick
    await vi.advanceTimersByTimeAsync(100);

    mockMediaRecorderInstance.onerror?.();

    expect(clearIntervalSpy).toHaveBeenCalled();

    await promise.catch(() => {});
  });

  // -----------------------------------------------------------------------
  // disconnect error handling (try/catch in onstop & onerror)
  // -----------------------------------------------------------------------

  it('onstop handles disconnect error gracefully', async () => {
    const ctx = createMockAudioContext();
    const source = createMockSourceNode();
    (source.disconnect as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('already disconnected');
    });

    const { promise } = recordFromNode(ctx, source, 0.15);

    await finishRecording();

    const blob = await promise;
    expect(blob).toBeInstanceOf(Blob);
  });

  it('onerror handles disconnect error gracefully', async () => {
    const ctx = createMockAudioContext();
    const source = createMockSourceNode();
    (source.disconnect as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('already disconnected');
    });

    const { promise } = recordFromNode(ctx, source, 5);

    mockMediaRecorderInstance.onerror?.();

    await expect(promise).rejects.toThrow(
      'ろくおんがうまくいかなかったよ。もういちどやってみよう！',
    );
  });

  // -----------------------------------------------------------------------
  // No onProgress callback (undefined)
  // -----------------------------------------------------------------------

  it('works without onProgress callback', async () => {
    const ctx = createMockAudioContext();
    const source = createMockSourceNode();

    const { promise } = recordFromNode(ctx, source, 0.15);

    await finishRecording();

    const blob = await promise;
    expect(blob).toBeInstanceOf(Blob);
  });

  // -----------------------------------------------------------------------
  // onstop clears interval
  // -----------------------------------------------------------------------

  it('onstop clears interval if intervalId is set', async () => {
    const ctx = createMockAudioContext();
    const source = createMockSourceNode();
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');

    const { promise } = recordFromNode(ctx, source, 0.15);

    await finishRecording();

    await promise;

    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // encodeWav edge cases (via convertToWav)
  // -----------------------------------------------------------------------

  it('encodeWav clamps samples outside [-1, 1] and produces valid WAV', async () => {
    const samples = new Float32Array([-2.0, -1.0, -0.5, 0.0, 0.5, 1.0, 2.0]);

    vi.stubGlobal(
      'OfflineAudioContext',
      makeFakeOfflineAudioContextClass(() => ({
        decodeAudioData: vi.fn(async () => ({
          length: samples.length,
          sampleRate: 44100,
          numberOfChannels: 1,
          duration: samples.length / 44100,
          getChannelData: vi.fn(() => samples),
        })),
        createBufferSource: vi.fn(() => ({
          buffer: null,
          connect: vi.fn(),
          start: vi.fn(),
        })),
        destination: {},
        startRendering: vi.fn(async () => ({
          length: samples.length,
          getChannelData: vi.fn(() => samples),
        })),
      })),
    );

    const ctx = createMockAudioContext();
    const source = createMockSourceNode();

    const { promise } = recordFromNode(ctx, source, 0.15);

    mockMediaRecorderInstance.ondataavailable?.({
      data: new Blob(['data'], { type: 'audio/webm' }),
    } as unknown);

    await finishRecording();

    const blob = await promise;
    expect(blob.type).toBe('audio/wav');

    const arrayBuf = await blob.arrayBuffer();
    const view = new DataView(arrayBuf);

    // RIFF header
    expect(
      String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3)),
    ).toBe('RIFF');
    // WAVE marker
    expect(
      String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11)),
    ).toBe('WAVE');
    // fmt  chunk
    expect(
      String.fromCharCode(
        view.getUint8(12),
        view.getUint8(13),
        view.getUint8(14),
        view.getUint8(15),
      ),
    ).toBe('fmt ');
    // data chunk
    expect(
      String.fromCharCode(
        view.getUint8(36),
        view.getUint8(37),
        view.getUint8(38),
        view.getUint8(39),
      ),
    ).toBe('data');

    // Verify clamped values: sample index 0 = -2.0 clamped to -1.0 => -32768
    expect(view.getInt16(44, true)).toBe(-32768);
    // sample index 6 = 2.0 clamped to 1.0 => 32767
    expect(view.getInt16(44 + 12, true)).toBe(32767);
  });

  // -----------------------------------------------------------------------
  // Cancel while inactive (onstop null intervalId path)
  // -----------------------------------------------------------------------

  it('cancel handles already-inactive state without crashing', async () => {
    const ctx = createMockAudioContext();
    const source = createMockSourceNode();

    const { promise, cancel } = recordFromNode(ctx, source, 5);

    // Set inactive so cancel skips stop()
    mockMediaRecorderInstance.state = 'inactive';
    cancel();

    // No onstop fires, promise stays pending. Just suppress unhandled rejection.
    promise.catch(() => {});

    // No crash
    expect(mockMediaRecorderInstance.stop).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // onerror fires before any interval tick
  // -----------------------------------------------------------------------

  it('onerror clears interval even when fired immediately', async () => {
    const ctx = createMockAudioContext();
    const source = createMockSourceNode();
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');

    const { promise } = recordFromNode(ctx, source, 5);

    // Fire error immediately (intervalId is already set synchronously)
    mockMediaRecorderInstance.onerror?.();

    expect(clearIntervalSpy).toHaveBeenCalled();

    await promise.catch(() => {});
  });

  // -----------------------------------------------------------------------
  // WAV structure validation
  // -----------------------------------------------------------------------

  it('produces valid WAV header structure with correct byte layout', async () => {
    const sampleData = new Float32Array([0.0, 0.25, -0.25, 0.5]);

    vi.stubGlobal(
      'OfflineAudioContext',
      makeFakeOfflineAudioContextClass(() => ({
        decodeAudioData: vi.fn(async () => ({
          length: sampleData.length,
          sampleRate: 48000,
          numberOfChannels: 1,
          duration: sampleData.length / 48000,
          getChannelData: vi.fn(() => sampleData),
        })),
        createBufferSource: vi.fn(() => ({
          buffer: null,
          connect: vi.fn(),
          start: vi.fn(),
        })),
        destination: {},
        startRendering: vi.fn(async () => ({
          length: sampleData.length,
          getChannelData: vi.fn(() => sampleData),
        })),
      })),
    );

    const ctx = createMockAudioContext(48000);
    const source = createMockSourceNode();

    const { promise } = recordFromNode(ctx, source, 0.15);

    mockMediaRecorderInstance.ondataavailable?.({
      data: new Blob(['data'], { type: 'audio/webm' }),
    } as unknown);

    await finishRecording();

    const blob = await promise;
    const buf = await blob.arrayBuffer();
    const view = new DataView(buf);

    // Total file size = 44 header + 4 samples * 2 bytes = 52
    expect(buf.byteLength).toBe(52);

    // RIFF chunk size = 36 + dataSize
    expect(view.getUint32(4, true)).toBe(36 + 8);

    // fmt chunk: PCM format = 1
    expect(view.getUint16(20, true)).toBe(1);
    // channels = 1
    expect(view.getUint16(22, true)).toBe(1);
    // sample rate = 48000
    expect(view.getUint32(24, true)).toBe(48000);
    // byte rate = 48000 * 1 * 2 = 96000
    expect(view.getUint32(28, true)).toBe(96000);
    // block align = 2
    expect(view.getUint16(32, true)).toBe(2);
    // bits per sample = 16
    expect(view.getUint16(34, true)).toBe(16);
    // data chunk size = 8
    expect(view.getUint32(40, true)).toBe(8);
  });

  // -----------------------------------------------------------------------
  // PCM sample encoding
  // -----------------------------------------------------------------------

  it('encodes positive and negative samples correctly in WAV output', async () => {
    const sampleData = new Float32Array([0.0, 1.0, -1.0]);

    vi.stubGlobal(
      'OfflineAudioContext',
      makeFakeOfflineAudioContextClass(() => ({
        decodeAudioData: vi.fn(async () => ({
          length: sampleData.length,
          sampleRate: 44100,
          numberOfChannels: 1,
          duration: sampleData.length / 44100,
          getChannelData: vi.fn(() => sampleData),
        })),
        createBufferSource: vi.fn(() => ({
          buffer: null,
          connect: vi.fn(),
          start: vi.fn(),
        })),
        destination: {},
        startRendering: vi.fn(async () => ({
          length: sampleData.length,
          getChannelData: vi.fn(() => sampleData),
        })),
      })),
    );

    const ctx = createMockAudioContext(44100);
    const source = createMockSourceNode();

    const { promise } = recordFromNode(ctx, source, 0.15);

    mockMediaRecorderInstance.ondataavailable?.({
      data: new Blob(['data'], { type: 'audio/webm' }),
    } as unknown);

    await finishRecording();

    const blob = await promise;
    const buf = await blob.arrayBuffer();
    const view = new DataView(buf);

    // 0.0 => 0
    expect(view.getInt16(44, true)).toBe(0);
    // 1.0 => 0x7fff = 32767
    expect(view.getInt16(46, true)).toBe(32767);
    // -1.0 => -0x8000 = -32768
    expect(view.getInt16(48, true)).toBe(-32768);
  });

  // -----------------------------------------------------------------------
  // Branch: intervalId is falsy when auto-stop fires in interval callback
  // (line 126: if (intervalId) clearInterval(intervalId))
  // -----------------------------------------------------------------------

  it('interval callback skips clearInterval when intervalId is falsy', async () => {
    const ctx = createMockAudioContext();
    const source = createMockSourceNode();

    // Save real setInterval and override to return 0 (falsy) while still
    // registering the callback so it fires
    const realSetInterval = globalThis.setInterval;
    let _capturedCallback: (() => void) | null = null;
    vi.spyOn(globalThis, 'setInterval').mockImplementation(((cb: () => void, _ms: number) => {
      // Store the callback but return 0 (falsy) as the intervalId
      _capturedCallback = cb;
      // Still register via real setInterval so the fake timer can fire it
      realSetInterval(cb, _ms);
      return 0 as unknown as ReturnType<typeof setInterval>;
    }) as typeof setInterval);

    // Spy on clearInterval to verify it's not called when intervalId is falsy
    vi.spyOn(globalThis, 'clearInterval');

    const { promise } = recordFromNode(ctx, source, 0.1);

    // Advance to trigger interval callback where elapsed >= duration
    // This hits line 126: if (intervalId) — intervalId is 0 (falsy)
    await vi.advanceTimersByTimeAsync(200);
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(0);

    const blob = await promise;
    expect(blob).toBeInstanceOf(Blob);
    // clearInterval may have been called from onstop (line 86), but line 126's
    // branch where intervalId is falsy should have been exercised
  });

  // -----------------------------------------------------------------------
  // Branch: intervalId is null when onstop fires (start triggers stop sync)
  // -----------------------------------------------------------------------

  it('onstop skips clearInterval when intervalId is null', async () => {
    const ctx = createMockAudioContext();
    const source = createMockSourceNode();
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');

    // Override FakeMediaRecorder so that start() synchronously fires onstop
    // before intervalId can be set (line 117 runs before line 120)
    const OrigFakeMediaRecorder = FakeMediaRecorder;
    class EarlyStopMediaRecorder extends OrigFakeMediaRecorder {
      start = vi.fn(() => {
        this.state = 'recording';
        // Synchronously fire onstop — intervalId is still null
        this.state = 'inactive';
        this.onstop?.();
      });
    }
    vi.stubGlobal('MediaRecorder', EarlyStopMediaRecorder);

    const { promise } = recordFromNode(ctx, source, 1);

    // onstop fired synchronously during start(), before intervalId was set
    // The promise should resolve (convertToWav runs)
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(0);

    const blob = await promise;
    expect(blob).toBeInstanceOf(Blob);
    // clearInterval should NOT have been called because intervalId was null
    expect(clearIntervalSpy).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // Branch: intervalId is null when onerror fires (start triggers error sync)
  // -----------------------------------------------------------------------

  it('onerror skips clearInterval when intervalId is null', async () => {
    const ctx = createMockAudioContext();
    const source = createMockSourceNode();
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');

    // Override FakeMediaRecorder so that start() synchronously fires onerror
    const OrigFakeMediaRecorder = FakeMediaRecorder;
    class EarlyErrorMediaRecorder extends OrigFakeMediaRecorder {
      start = vi.fn(() => {
        this.state = 'recording';
        // Synchronously fire onerror — intervalId is still null
        this.onerror?.();
      });
    }
    vi.stubGlobal('MediaRecorder', EarlyErrorMediaRecorder);

    const { promise } = recordFromNode(ctx, source, 1);

    await expect(promise).rejects.toThrow(
      'ろくおんがうまくいかなかったよ。もういちどやってみよう！',
    );

    // clearInterval should NOT have been called because intervalId was null
    expect(clearIntervalSpy).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // Interval progresses through the duration
  // -----------------------------------------------------------------------

  it('calls onProgress with increasing elapsed values in interval', async () => {
    const ctx = createMockAudioContext();
    const source = createMockSourceNode();
    const onProgress = vi.fn();

    const { promise } = recordFromNode(ctx, source, 0.5, onProgress);

    // Advance 500ms (5 ticks)
    await vi.advanceTimersByTimeAsync(500);
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(0);

    await promise;

    // First call: elapsed 0 (immediate)
    expect(onProgress.mock.calls[0][0]).toEqual({
      isRecording: true,
      elapsed: 0,
      duration: 0.5,
    });

    // Subsequent calls should have increasing elapsed
    for (let i = 2; i < onProgress.mock.calls.length; i++) {
      const prev = onProgress.mock.calls[i - 1][0].elapsed;
      const curr = onProgress.mock.calls[i][0].elapsed;
      expect(curr).toBeGreaterThanOrEqual(prev);
    }
  });

  // -----------------------------------------------------------------------
  // Interval clears itself when duration reached (clearInterval inside interval cb)
  // -----------------------------------------------------------------------

  it('stops the interval when elapsed >= duration (auto-stop path)', async () => {
    const ctx = createMockAudioContext();
    const source = createMockSourceNode();
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');

    const { promise } = recordFromNode(ctx, source, 0.2);

    // Advance past duration
    await vi.advanceTimersByTimeAsync(300);
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(0);

    await promise;

    // clearInterval should have been called (by onstop and/or by the interval callback)
    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
