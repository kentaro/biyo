/**
 * Audio recorder: captures audio output via MediaRecorder and exports as WAV.
 */

/** Encode raw PCM Float32 samples into a WAV Blob */
function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = samples.length * (bitsPerSample / 8);
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const val = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(offset, val, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

export interface RecordingState {
  isRecording: boolean;
  elapsed: number;
  duration: number;
}

export type RecordingCallback = (state: RecordingState) => void;

/**
 * Record audio from a specific AudioNode for a given duration.
 * Connects a MediaStreamDestination to the source node (e.g. AnalyserNode)
 * in parallel with the existing destination connection.
 */
export function recordFromNode(
  audioCtx: AudioContext,
  sourceNode: AudioNode,
  durationSec: number,
  onProgress?: RecordingCallback,
): { promise: Promise<Blob>; cancel: () => void } {
  const dest = audioCtx.createMediaStreamDestination();
  sourceNode.connect(dest);

  const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : MediaRecorder.isTypeSupported('audio/mp4')
      ? 'audio/mp4'
      : ''; // browser default

  const mediaRecorder = new MediaRecorder(dest.stream, {
    ...(mimeType ? { mimeType } : {}),
  });

  const chunks: Blob[] = [];
  let cancelled = false;
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const promise = new Promise<Blob>((resolve, reject) => {
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onstop = async () => {
      if (intervalId) clearInterval(intervalId);
      try {
        sourceNode.disconnect(dest);
      } catch {
        /* already disconnected */
      }

      if (cancelled) {
        reject(new Error('cancelled'));
        return;
      }

      const recordedType = mimeType || 'audio/webm';
      const recordedBlob = new Blob(chunks, { type: recordedType });
      try {
        const wavBlob = await convertToWav(recordedBlob, audioCtx.sampleRate);
        resolve(wavBlob);
      } catch {
        resolve(recordedBlob);
      }
    };

    mediaRecorder.onerror = () => {
      if (intervalId) clearInterval(intervalId);
      try {
        sourceNode.disconnect(dest);
      } catch {
        /* already disconnected */
      }
      reject(new Error('ろくおんがうまくいかなかったよ。もういちどやってみよう！'));
    };

    mediaRecorder.start(100);

    const startTime = Date.now();
    intervalId = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      onProgress?.({ isRecording: true, elapsed, duration: durationSec });

      if (elapsed >= durationSec) {
        mediaRecorder.stop();
        if (intervalId) clearInterval(intervalId);
      }
    }, 100);

    onProgress?.({ isRecording: true, elapsed: 0, duration: durationSec });
  });

  const cancel = () => {
    cancelled = true;
    if (mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  };

  return { promise, cancel };
}

/** Convert a recorded audio blob to a WAV blob using OfflineAudioContext */
async function convertToWav(webmBlob: Blob, targetSampleRate: number): Promise<Blob> {
  const arrayBuffer = await webmBlob.arrayBuffer();
  const tempCtx = new OfflineAudioContext(1, 1, targetSampleRate);
  const audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);

  const offlineCtx = new OfflineAudioContext(1, audioBuffer.length, targetSampleRate);
  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineCtx.destination);
  source.start();

  const renderedBuffer = await offlineCtx.startRendering();
  const samples = renderedBuffer.getChannelData(0);

  return encodeWav(samples, targetSampleRate);
}
