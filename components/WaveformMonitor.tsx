'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { audioEngine } from '@/lib/audio/engine';
import { usePlaybackStore } from '@/lib/stores/playback';
import HelpTooltip from './HelpTooltip';

// Resolve CSS custom properties for canvas usage (Canvas 2D API needs resolved strings)
function getCssVar(name: string): string {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// Lazily resolved design system colors from CSS custom properties
let _colors: Record<string, string> | null = null;
function getColors() {
  if (!_colors) {
    _colors = {
      source: getCssVar('--c-source') || '#ff6680',
      effect: getCssVar('--c-effect') || '#4c97ff',
      rhythm: getCssVar('--c-rhythm') || '#59c059',
      preset: getCssVar('--c-preset') || '#cf63cf',
      utility: getCssVar('--c-utility') || '#ffab19',
      note: getCssVar('--c-note') || '#5ba58c',
      bg: getCssVar('--c-bg') || '#fff8f0',
    };
  }
  return _colors;
}

let _spectrumColors: string[] | null = null;
function getSpectrumColors(): string[] {
  if (!_spectrumColors) {
    const c = getColors();
    _spectrumColors = [c.source, c.preset, c.effect, c.rhythm, c.utility, c.note];
  }
  return _spectrumColors;
}

// Proxy accessors to defer resolution until first canvas paint
const COLORS = new Proxy({} as Record<string, string>, {
  get(_target, prop: string) {
    return getColors()[prop] ?? '';
  },
});
// Note: Spectrum colours are accessed via getSpectrumColors() at paint time.

interface Particle {
  x: number;
  y: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

// Pre-allocate particle pool
const MAX_PARTICLES = 40;

// Visualization modes
type VisMode = 'waveform' | 'spectrum' | 'spectrogram';
const VIS_MODES: VisMode[] = ['waveform', 'spectrum', 'spectrogram'];
// Child-friendly mode labels
const VIS_MODE_LABELS: Record<VisMode, string> = {
  waveform: 'おとのかたち',
  spectrum: 'おとのたかさ',
  spectrogram: 'おとのながれ',
};

// Child-friendly help text per mode
const VIS_MODE_HELP: Record<VisMode, string> = {
  waveform: 'おとがなみのかたちでみえるよ！おおきくゆれるとおおきなおと！',
  spectrum:
    'おとのたかさがにじいろのぼうでみえるよ！ひくいおとはひだり、たかいおとはみぎにでるよ。',
  spectrogram: 'おとがいろになってながれていくよ！あかるいところはつよいおと！',
};

/**
 * Build a 256-entry heat map palette:
 *   0..63   -> dark blue   → cyan
 *  64..127  -> cyan        → green
 * 128..191  -> green       → yellow
 * 192..255  -> yellow      → red
 *
 * Each entry is [r, g, b].
 */
function buildHeatPalette(): [number, number, number][] {
  const palette: [number, number, number][] = new Array(256);

  for (let i = 0; i < 256; i++) {
    let r: number, g: number, b: number;

    if (i < 64) {
      // dark blue → cyan
      const t = i / 63;
      r = 0;
      g = Math.round(t * 255);
      b = Math.round(128 + t * 127);
    } else if (i < 128) {
      // cyan → green
      const t = (i - 64) / 63;
      r = 0;
      g = 255;
      b = Math.round(255 * (1 - t));
    } else if (i < 192) {
      // green → yellow
      const t = (i - 128) / 63;
      r = Math.round(255 * t);
      g = 255;
      b = 0;
    } else {
      // yellow → red
      const t = (i - 192) / 63;
      r = 255;
      g = Math.round(255 * (1 - t));
      b = 0;
    }

    palette[i] = [r, g, b];
  }

  return palette;
}

const HEAT_PALETTE = buildHeatPalette();

// --- Waveform drawing (full canvas, smooth curves) ---
function drawWaveform(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  analyser: AnalyserNode | null,
  timeDomain: Uint8Array<ArrayBuffer> | null,
  playing: boolean,
  particlesRef: React.RefObject<Particle[]>,
  phaseRef: React.RefObject<number>,
  hueRef: React.RefObject<number>,
) {
  const centerY = height / 2;
  const specColors = getSpectrumColors();

  if (playing && analyser && timeDomain) {
    analyser.getByteTimeDomainData(timeDomain);
    const step = width / timeDomain.length;
    const particles = particlesRef.current;

    ctx.save();
    ctx.shadowColor = COLORS.preset;
    ctx.shadowBlur = 14;

    // Rainbow gradient shifted by hue
    const fillGrad = ctx.createLinearGradient(0, 0, width, 0);
    const hue = hueRef.current;
    fillGrad.addColorStop(0, `hsl(${(hue + 0) % 360}, 85%, 62%)`);
    fillGrad.addColorStop(0.25, `hsl(${(hue + 90) % 360}, 80%, 58%)`);
    fillGrad.addColorStop(0.5, `hsl(${(hue + 180) % 360}, 85%, 62%)`);
    fillGrad.addColorStop(0.75, `hsl(${(hue + 270) % 360}, 80%, 58%)`);
    fillGrad.addColorStop(1, `hsl(${(hue + 360) % 360}, 85%, 62%)`);

    // Compute smooth path points
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < timeDomain.length; i++) {
      const y = (timeDomain[i] / 128.0) * centerY;
      points.push({ x: i * step, y });
    }

    // Filled area under waveform (smooth curves)
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    drawSmoothCurve(ctx, points);
    ctx.lineTo(width, centerY);
    ctx.closePath();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = fillGrad;
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Waveform line on top (smooth curves)
    ctx.beginPath();
    drawSmoothCurve(ctx, points);
    ctx.strokeStyle = fillGrad;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();

    // Spawn particles at peaks
    for (let i = 0; i < timeDomain.length; i += 64) {
      const deviation = Math.abs(timeDomain[i] - 128);
      if (deviation > 20 && particles.length < MAX_PARTICLES) {
        const y = (timeDomain[i] / 128.0) * centerY;
        particles.push({
          x: i * step,
          y,
          vy: -(0.5 + Math.random() * 1.5),
          life: 1.0,
          maxLife: 40 + Math.random() * 30,
          color: specColors[Math.floor(Math.random() * specColors.length)],
          size: 2 + Math.random() * 3,
        });
      }
    }

    drawParticles(ctx, particles);
  } else {
    // Idle: breathing sine wave
    phaseRef.current += 0.015;
    const phase = phaseRef.current;
    const breathe = 0.5 + 0.5 * Math.sin(phase * 0.8);
    const amplitude = height * (0.04 + 0.06 * breathe);
    const frequency = 2.5;

    const grad = ctx.createLinearGradient(0, 0, width, 0);
    grad.addColorStop(0, COLORS.source);
    grad.addColorStop(0.33, COLORS.preset);
    grad.addColorStop(0.66, COLORS.effect);
    grad.addColorStop(1, COLORS.rhythm);

    const idlePoints: { x: number; y: number }[] = [];
    for (let x = 0; x <= width; x += 2) {
      const normalX = x / width;
      const y = centerY + Math.sin(normalX * Math.PI * frequency + phase) * amplitude;
      idlePoints.push({ x, y });
    }

    ctx.beginPath();
    drawSmoothCurve(ctx, idlePoints);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.4 + 0.4 * breathe;
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  }
}

// --- Spectrum drawing (full canvas, vertical bars with gradient and glow) ---
function drawSpectrum(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  analyser: AnalyserNode | null,
  freqData: Uint8Array<ArrayBuffer> | null,
  playing: boolean,
  phaseRef: React.RefObject<number>,
) {
  const specColors = getSpectrumColors();
  const barCount = 32;
  const gap = 3;
  const barWidth = (width - gap * (barCount + 1)) / barCount;
  const maxBarHeight = height - 8;
  const barBottom = height - 4;

  if (playing && analyser && freqData) {
    analyser.getByteFrequencyData(freqData);

    for (let i = 0; i < barCount; i++) {
      const binStart = Math.floor((i / barCount) * freqData.length);
      const binEnd = Math.floor(((i + 1) / barCount) * freqData.length);
      let sum = 0;
      for (let b = binStart; b < binEnd; b++) {
        sum += freqData[b];
      }
      const avg = sum / (binEnd - binStart);
      const value = avg / 255;

      const barH = Math.max(2, value * maxBarHeight);
      const x = gap + i * (barWidth + gap);
      const colorIndex = i % specColors.length;
      const color = specColors[colorIndex];

      // Vertical gradient from lighter top to base color bottom
      const barGrad = ctx.createLinearGradient(0, barBottom - barH, 0, barBottom);
      barGrad.addColorStop(0, lightenColor(color, 0.3));
      barGrad.addColorStop(1, color);

      ctx.fillStyle = barGrad;
      ctx.globalAlpha = 0.6 + value * 0.4;
      ctx.beginPath();
      ctx.roundRect(x, barBottom - barH, barWidth, barH, 3);
      ctx.fill();

      // Glow effect on loud bars
      if (value > 0.6) {
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 8 * value;
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.3 * value;
        ctx.beginPath();
        ctx.roundRect(x, barBottom - barH, barWidth, barH, 3);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1.0;
  } else {
    // Idle: gentle animated bars
    phaseRef.current += 0.015;
    const phase = phaseRef.current;

    for (let i = 0; i < barCount; i++) {
      const v = 0.08 + 0.06 * Math.sin(phase + i * 0.3);
      const barH = Math.max(2, v * maxBarHeight);
      const x = gap + i * (barWidth + gap);
      ctx.fillStyle = specColors[i % specColors.length];
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.roundRect(x, barBottom - barH, barWidth, barH, 3);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }
}

// --- Spectrogram drawing (scrolling waterfall with log frequency mapping) ---
function drawSpectrogram(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  analyser: AnalyserNode | null,
  freqData: Uint8Array<ArrayBuffer> | null,
  playing: boolean,
  ensureSpectrogramBuffer: (w: number, h: number) => void,
  spectrogramCanvasRef: React.RefObject<HTMLCanvasElement | null>,
  spectrogramCtxRef: React.RefObject<CanvasRenderingContext2D | null>,
) {
  const specW = Math.floor(width);
  const specH = Math.floor(height);
  ensureSpectrogramBuffer(specW, specH);

  const offCanvas = spectrogramCanvasRef.current;
  const offCtx = spectrogramCtxRef.current;
  if (!offCanvas || !offCtx) return;

  if (playing && analyser && freqData) {
    analyser.getByteFrequencyData(freqData);

    // Scroll existing image 1px to the left
    const existingImage = offCtx.getImageData(1, 0, specW - 1, specH);
    offCtx.putImageData(existingImage, 0, 0);

    // Draw new column at right edge using log frequency mapping
    const binCount = freqData.length;
    const col = offCtx.createImageData(1, specH);
    const minBin = 1;
    const maxBin = binCount - 1;
    const logMin = Math.log(minBin);
    const logMax = Math.log(maxBin);

    for (let py = 0; py < specH; py++) {
      // py=0 top = high freq, py=specH-1 bottom = low freq
      const freqFraction = 1 - py / (specH - 1);
      const logBin = logMin + freqFraction * (logMax - logMin);
      const bin = Math.exp(logBin);

      // Interpolate between adjacent bins for smoother result
      const binLow = Math.floor(bin);
      const binHigh = Math.min(binLow + 1, maxBin);
      const frac = bin - binLow;
      const value = freqData[binLow] * (1 - frac) + freqData[binHigh] * frac;

      const idx = Math.min(255, Math.max(0, Math.round(value)));
      const [r, g, b] = HEAT_PALETTE[idx];

      const offset = py * 4;
      col.data[offset] = r;
      col.data[offset + 1] = g;
      col.data[offset + 2] = b;
      col.data[offset + 3] = 255;
    }

    offCtx.putImageData(col, specW - 1, 0);
  }

  // Draw offscreen buffer to main canvas
  ctx.drawImage(offCanvas, 0, 0, specW, specH);

  // Frequency labels overlay
  ctx.save();
  ctx.font = '10px monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.textBaseline = 'middle';

  const sampleRate = analyser ? analyser.context.sampleRate : 44100;
  const nyquist = sampleRate / 2;
  const binCount = freqData ? freqData.length : 1024;
  const minBin = 1;
  const maxBin = binCount - 1;
  const logMin = Math.log(minBin);
  const logMax = Math.log(maxBin);

  const labelFreqs = [100, 500, 1000, 2000, 5000, 10000];
  for (const freq of labelFreqs) {
    if (freq > nyquist) continue;
    const bin = (freq / nyquist) * binCount;
    if (bin < minBin || bin > maxBin) continue;
    const freqFraction = (Math.log(bin) - logMin) / (logMax - logMin);
    const py = (1 - freqFraction) * (specH - 1);
    const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
    ctx.fillText(label, 4, py);
  }
  ctx.restore();
}

// --- Particle drawing helper ---
function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.y += p.vy;
    p.life -= 1;
    const alpha = Math.max(0, p.life / p.maxLife);
    if (alpha <= 0) {
      particles.splice(i, 1);
      continue;
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
    ctx.globalAlpha = alpha * 0.7;
    ctx.fillStyle = p.color;
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;
}

// --- Draw smooth curve through points using quadratic bezier ---
function drawSmoothCurve(ctx: CanvasRenderingContext2D, points: { x: number; y: number }[]) {
  if (points.length < 2) return;

  ctx.moveTo(points[0].x, points[0].y);

  if (points.length === 2) {
    ctx.lineTo(points[1].x, points[1].y);
    return;
  }

  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const midX = (curr.x + next.x) / 2;
    const midY = (curr.y + next.y) / 2;

    if (i === 0) {
      ctx.lineTo(midX, midY);
    } else {
      ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
    }
  }

  const last = points[points.length - 1];
  const secondLast = points[points.length - 2];
  ctx.quadraticCurveTo(secondLast.x, secondLast.y, last.x, last.y);
}

// --- Lighten a hex color by a fraction (0..1) ---
function lightenColor(hex: string, fraction: number): string {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  const lr = Math.min(255, Math.round(r + (255 - r) * fraction));
  const lg = Math.min(255, Math.round(g + (255 - g) * fraction));
  const lb = Math.min(255, Math.round(b + (255 - b) * fraction));
  return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;
}

export default function WaveformMonitor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const phaseRef = useRef(0);
  const hueRef = useRef(0);
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const [mode, setMode] = useState<VisMode>('waveform');

  // Track canvas size to avoid resizing every frame (HiDPI optimization)
  const canvasSizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  // Spectrogram off-screen buffer (persists across frames for scrolling)
  const spectrogramCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const spectrogramCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const spectrogramSizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  const modeRef = useRef<VisMode>(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const cycleMode = useCallback(() => {
    setMode((prev) => {
      const idx = VIS_MODES.indexOf(prev);
      return VIS_MODES[(idx + 1) % VIS_MODES.length];
    });
  }, []);

  // Ensure the off-screen spectrogram canvas is sized correctly
  const ensureSpectrogramBuffer = useCallback((w: number, h: number) => {
    const cur = spectrogramSizeRef.current;
    if (spectrogramCanvasRef.current && cur.w === w && cur.h === h) {
      return;
    }
    const offscreen = document.createElement('canvas');
    offscreen.width = w;
    offscreen.height = h;
    const offCtx = offscreen.getContext('2d');
    if (offCtx) {
      // If we had old data, copy it over (resize-aware)
      if (spectrogramCanvasRef.current) {
        offCtx.drawImage(spectrogramCanvasRef.current, 0, 0, w, h);
      } else {
        // Fill with dark blue initially
        offCtx.fillStyle = '#000020';
        offCtx.fillRect(0, 0, w, h);
      }
    }
    spectrogramCanvasRef.current = offscreen;
    spectrogramCtxRef.current = offCtx;
    spectrogramSizeRef.current = { w, h };
  }, []);

  // Ensure HiDPI canvas sizing without doing it every frame
  const ensureCanvasSize = useCallback(
    (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.round(rect.width * dpr);
      const h = Math.round(rect.height * dpr);
      const cur = canvasSizeRef.current;

      if (cur.w !== w || cur.h !== h) {
        canvas.width = w;
        canvas.height = h;
        canvasSizeRef.current = { w, h };
      }

      // Reset transform each frame for HiDPI scaling
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      return { width: rect.width, height: rect.height };
    },
    [],
  );

  const draw = useCallback(
    (
      canvas: HTMLCanvasElement,
      ctx: CanvasRenderingContext2D,
      analyser: AnalyserNode | null,
      timeDomain: Uint8Array<ArrayBuffer> | null,
      freqData: Uint8Array<ArrayBuffer> | null,
      playing: boolean,
    ) => {
      const currentMode = modeRef.current;
      const { width, height } = ensureCanvasSize(canvas, ctx);

      // Advance hue for rainbow shift
      if (playing) {
        hueRef.current = (hueRef.current + 0.5) % 360;
      }

      // --- Spectrogram mode (full canvas) ---
      if (currentMode === 'spectrogram') {
        drawSpectrogram(
          ctx,
          width,
          height,
          analyser,
          freqData,
          playing,
          ensureSpectrogramBuffer,
          spectrogramCanvasRef,
          spectrogramCtxRef,
        );
        return;
      }

      // --- Background gradient (shared by waveform and spectrum) ---
      const bg = ctx.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, COLORS.bg || '#fff8f0');
      bg.addColorStop(0.5, '#F8F0FF');
      bg.addColorStop(1, '#F0F6FF');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // --- Waveform mode (full canvas) ---
      if (currentMode === 'waveform') {
        drawWaveform(
          ctx,
          width,
          height,
          analyser,
          timeDomain,
          playing,
          particlesRef,
          phaseRef,
          hueRef,
        );
        return;
      }

      // --- Spectrum mode (full canvas) ---
      if (currentMode === 'spectrum') {
        drawSpectrum(ctx, width, height, analyser, freqData, playing, phaseRef);
      }
    },
    [ensureCanvasSize, ensureSpectrogramBuffer],
  );

  // Clear spectrogram buffer when mode changes away from spectrogram
  useEffect(() => {
    if (mode !== 'spectrogram') {
      spectrogramCanvasRef.current = null;
      spectrogramCtxRef.current = null;
      spectrogramSizeRef.current = { w: 0, h: 0 };
    }
  }, [mode]);

  // Reset canvas size tracking on mode change so it re-renders cleanly
  // biome-ignore lint/correctness/useExhaustiveDependencies: mode is intentionally used to trigger reset on mode change
  useEffect(() => {
    canvasSizeRef.current = { w: 0, h: 0 };
  }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let analyser: AnalyserNode | null = null;
    let timeDomain: Uint8Array<ArrayBuffer> | null = null;
    let freqData: Uint8Array<ArrayBuffer> | null = null;

    if (isPlaying) {
      try {
        analyser = audioEngine.getAnalyser();
        if (analyser) {
          timeDomain = new Uint8Array(analyser.frequencyBinCount);
          freqData = new Uint8Array(analyser.frequencyBinCount);
        }
      } catch {
        analyser = null;
      }
    } else {
      // Clear particles when stopped
      particlesRef.current = [];
    }

    const loop = () => {
      draw(canvas, ctx, analyser, timeDomain, freqData, isPlaying);
      animationRef.current = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(animationRef.current);
  }, [isPlaying, draw]);

  const nextIdx = (VIS_MODES.indexOf(mode) + 1) % VIS_MODES.length;
  const nextLabel = VIS_MODE_LABELS[VIS_MODES[nextIdx]];

  return (
    <div
      className="h-full rounded-[var(--r-md)] border border-[var(--c-border)] overflow-hidden"
      style={{ boxShadow: 'var(--shadow-sm)', position: 'relative' }}
    >
      <canvas ref={canvasRef} className="w-full h-full block" aria-hidden="true" tabIndex={-1} />
      {/* Mode label */}
      <div
        style={{
          position: 'absolute',
          top: 'var(--sp-2)',
          left: 'var(--sp-2)',
          fontSize: 'var(--fs-xs)',
          color: 'var(--c-text-muted)',
          pointerEvents: 'none',
          zIndex: 10,
          fontWeight: 600,
        }}
        aria-hidden="true"
      >
        {VIS_MODE_LABELS[mode]}
      </div>
      <section aria-label="おとのかたち" aria-live="polite" className="sr-only">
        {isPlaying ? `おとをならしているよ - ${VIS_MODE_LABELS[mode]}` : 'おとはとまっているよ'}
      </section>
      {/* Mode toggle button */}
      <button
        type="button"
        onClick={cycleMode}
        aria-label={`ひょうじモードをかえる（いま: ${VIS_MODE_LABELS[mode]}）`}
        style={{
          position: 'absolute',
          top: '4px',
          right: '32px',
          fontSize: 'var(--fs-xs)',
          color: 'var(--c-text-muted)',
          background: 'color-mix(in srgb, var(--c-surface) 75%, transparent)',
          backdropFilter: 'blur(4px)',
          border: '1px solid var(--c-border)',
          borderRadius: 'var(--r-sm)',
          padding: 'var(--sp-1) var(--sp-2)',
          cursor: 'pointer',
          zIndex: 10,
          lineHeight: '1.4',
          fontWeight: 600,
          transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
          minWidth: 44,
          minHeight: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background =
            'color-mix(in srgb, var(--c-surface) 95%, transparent)';
          e.currentTarget.style.color = 'var(--c-text)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background =
            'color-mix(in srgb, var(--c-surface) 75%, transparent)';
          e.currentTarget.style.color = 'var(--c-text-muted)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        title="みかたをかえる"
      >
        {nextLabel} にきりかえ
      </button>
      <HelpTooltip text={VIS_MODE_HELP[mode]} />
    </div>
  );
}
