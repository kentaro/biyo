'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePlaybackStore } from '@/lib/stores/playback';

/**
 * Category colors from the design system, cycled through on each beat.
 */
const CATEGORY_COLORS = [
  'var(--c-source)', // #FF6680
  'var(--c-effect)', // #4C97FF
  'var(--c-rhythm)', // #59C059
  'var(--c-utility)', // #FFAB19
  'var(--c-preset)', // #CF63CF
  'var(--c-note)', // #5BA58C
];

/**
 * A small pulsing ring that beats in sync with the current BPM.
 * Visible only during playback. Shows BPM text on hover.
 * Respects prefers-reduced-motion with a static glow fallback.
 */
export default function BeatIndicator() {
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const bpm = usePlaybackStore((s) => s.bpm);
  const [hovered, setHovered] = useState(false);
  const [colorIndex, setColorIndex] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Cycle colors on each beat interval
  const beatMs = (60 / bpm) * 1000;

  const advanceColor = useCallback(() => {
    setColorIndex((prev) => (prev + 1) % CATEGORY_COLORS.length);
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      setColorIndex(0);
      return;
    }

    // Advance color immediately on start, then on each beat
    advanceColor();
    intervalRef.current = setInterval(advanceColor, beatMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, beatMs, advanceColor]);

  if (!isPlaying) return null;

  const currentColor = CATEGORY_COLORS[colorIndex];
  const beatDuration = `${60 / bpm}s`;

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
      {/* Pulsing ring */}
      <span
        className="beat-indicator-ring"
        style={{
          display: 'block',
          width: 14,
          height: 14,
          borderRadius: 'var(--r-full)',
          border: `2.5px solid ${currentColor}`,
          background: 'transparent',
          boxShadow: prefersReducedMotion ? `0 0 8px ${currentColor}` : undefined,
          animationName: prefersReducedMotion ? undefined : 'beat-pulse',
          animationDuration: prefersReducedMotion ? undefined : beatDuration,
          animationTimingFunction: 'ease-out',
          animationIterationCount: 'infinite',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
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
            marginTop: 4,
            fontFamily: 'var(--font-main)',
            fontSize: 'var(--fs-xs)',
            fontWeight: 700,
            color: 'var(--c-text-sub)',
            background: 'var(--c-surface)',
            border: '1px solid var(--c-border)',
            borderRadius: 'var(--r-sm)',
            padding: '2px 6px',
            whiteSpace: 'nowrap',
            boxShadow: 'var(--shadow-sm)',
            zIndex: 10,
            pointerEvents: 'none',
            animation: 'fadeIn 0.15s ease-out both',
          }}
        >
          {bpm} BPM
        </span>
      )}
    </output>
  );
}
