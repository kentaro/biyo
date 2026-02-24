'use client';

import { useEffect, useRef, useState } from 'react';
import { usePlaybackStore } from '@/lib/stores/playback';

/**
 * Category colors from the design system, cycled through on each beat.
 */
const CATEGORY_COLORS = [
  'var(--c-source)', // #c44d62
  'var(--c-effect)', // #3976c6
  'var(--c-rhythm)', // #3c843c
  'var(--c-utility)', // #9f6a08
  'var(--c-preset)', // #b050b0
  'var(--c-note)', // #468070
];

/**
 * Compute the beat-pulse transform & opacity from a normalised beat phase [0,1).
 *
 * The curve mimics the CSS @keyframes beat-pulse:
 *   0%   -> scale(1),    opacity 1
 *   30%  -> scale(1.35), opacity 0.85
 *   100% -> scale(1),    opacity 0.6
 *
 * Using JS instead of CSS animation keeps the pulse, color change,
 * and beat timing on the same requestAnimationFrame clock,
 * preventing drift between independent CSS-animation and setInterval clocks.
 */
function beatTransform(phase: number): { scale: number; opacity: number } {
  if (phase < 0.3) {
    // 0 -> 0.3: scale 1 -> 1.35, opacity 1 -> 0.85
    const t = phase / 0.3;
    return {
      scale: 1 + 0.35 * t,
      opacity: 1 - 0.15 * t,
    };
  }
  // 0.3 -> 1: scale 1.35 -> 1, opacity 0.85 -> 0.6
  const t = (phase - 0.3) / 0.7;
  return {
    scale: 1.35 - 0.35 * t,
    opacity: 0.85 - 0.25 * t,
  };
}

/**
 * A small pulsing ring that beats in sync with the current BPM.
 * Visible only during playback. Shows BPM text on hover.
 * Respects prefers-reduced-motion with a static glow fallback.
 *
 * Timing strategy: A single requestAnimationFrame loop drives both
 * the pulse animation and the color cycling from one timestamp-based
 * beat clock. This avoids:
 *   - setInterval drift (accumulates over long playback sessions)
 *   - Desync between CSS animation clock and JS interval clock
 *   - Unnecessary React state re-renders (we mutate the DOM directly via ref)
 */
export default function BeatIndicator() {
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const bpm = usePlaybackStore((s) => s.bpm);
  const [hovered, setHovered] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // DOM ref for the pulsing ring - we mutate style directly to avoid re-renders
  const ringRef = useRef<HTMLSpanElement>(null);

  // Mutable refs for the rAF loop (no re-renders on change)
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const bpmRef = useRef(bpm);
  const colorIndexRef = useRef(0);

  // Keep bpmRef in sync without re-starting the loop
  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Main rAF beat loop
  useEffect(() => {
    if (!isPlaying) {
      colorIndexRef.current = 0;
      // Reset ring styles when stopping
      if (ringRef.current) {
        ringRef.current.style.transform = 'scale(1)';
        ringRef.current.style.opacity = '1';
        ringRef.current.style.borderColor = CATEGORY_COLORS[0];
      }
      return;
    }

    startTimeRef.current = 0;
    colorIndexRef.current = 0;
    let lastBeatIndex = -1;

    const tick = (timestamp: number) => {
      if (startTimeRef.current === 0) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const currentBpm = bpmRef.current;
      const beatMs = (60 / currentBpm) * 1000;

      // Which beat are we on (integer index) and how far through it (0..1)
      const beatIndex = Math.floor(elapsed / beatMs);
      const phase = (elapsed % beatMs) / beatMs;

      // Advance color on each new beat
      if (beatIndex !== lastBeatIndex) {
        lastBeatIndex = beatIndex;
        colorIndexRef.current = beatIndex % CATEGORY_COLORS.length;
      }

      // Update DOM directly (no React state = no re-render)
      const ring = ringRef.current;
      if (ring) {
        const { scale, opacity } = beatTransform(phase);
        ring.style.transform = `scale(${scale})`;
        ring.style.opacity = String(opacity);
        ring.style.borderColor = CATEGORY_COLORS[colorIndexRef.current];
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
  }, [isPlaying]);

  if (!isPlaying) return null;

  return (
    <output
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 24,
        height: 24,
        flexShrink: 0,
      }}
      aria-label={`はやさ ${bpm}`}
    >
      {/* Pulsing ring — animated via rAF, not CSS animation */}
      <span
        ref={ringRef}
        className="beat-indicator-ring"
        style={{
          display: 'block',
          width: 14,
          height: 14,
          borderRadius: 'var(--r-full)',
          border: '2.5px solid var(--c-source)',
          background: 'transparent',
          boxShadow: prefersReducedMotion ? 'var(--shadow-sm)' : undefined,
          // No CSS animation — rAF handles transform, opacity, and border-color
          willChange: 'transform, opacity, border-color',
        }}
        aria-hidden="true"
      />

      {/* BPM tooltip on hover */}
      {hovered && (
        <span
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: 'var(--sp-1)',
            fontFamily: 'var(--font-main)',
            fontSize: 'var(--fs-xs)',
            fontWeight: 700,
            color: 'var(--c-text-sub)',
            background: 'var(--c-surface)',
            border: '1px solid var(--c-border)',
            borderRadius: 'var(--r-sm)',
            padding: 'var(--sp-half) var(--sp-2)',
            whiteSpace: 'nowrap',
            boxShadow: 'var(--shadow-sm)',
            zIndex: 10,
            pointerEvents: 'none',
            animation: 'fadeIn 0.15s ease-out both',
          }}
        >
          はやさ {bpm}
        </span>
      )}
    </output>
  );
}
