'use client';

import { useCompileStore } from '@/lib/stores/compile';
import { usePlaybackStore } from '@/lib/stores/playback';
import { useTrackStore } from '@/lib/stores/tracks';
import ExperienceIndicator from './ExperienceIndicator';

export default function StatusBar() {
  const status = useCompileStore((s) => s.status);
  const compileError = useCompileStore((s) => s.compileError);
  const trackCodes = useCompileStore((s) => s.trackCodes);
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const bpm = usePlaybackStore((s) => s.bpm);
  const tracks = useTrackStore((s) => s.tracks);
  const activeTrackId = useTrackStore((s) => s.activeTrackId);

  const activeTrack = tracks.find((t) => t.id === activeTrackId);
  const blockCount = Object.values(trackCodes).filter((c) => c && c.trim() !== '').length;
  const hasAnyBlocks = blockCount > 0;

  const statusCfg = {
    ready: { color: 'var(--c-ok)', text: 'じゅんびできたよ！' },
    compiling: { color: 'var(--c-warn)', text: 'つくっているよ...' },
    error: { color: 'var(--c-error)', text: 'あれ？ブロックをたしかめてみてね' },
  }[status];

  // When playing, override status text
  const displayText = isPlaying ? 'えんそうちゅう♪' : statusCfg.text;
  const displayColor = isPlaying ? 'var(--c-ok)' : statusCfg.color;

  // Show a hint when the workspace is empty and not playing
  const emptyHint = !hasAnyBlocks && !isPlaying && status === 'ready';

  return (
    <output
      className="flex items-center justify-between h-full bg-[var(--c-surface)] border-t border-[var(--c-border)]"
      style={{ padding: '0 var(--sp-3)', fontSize: 'var(--fs-xs)', gap: 'var(--sp-2)' }}
      aria-live="polite"
      aria-label="じょうたい"
    >
      {/* Left: Status indicator + message */}
      <div className="flex items-center shrink-0" style={{ gap: 'var(--sp-1)', minWidth: 0 }}>
        <span
          className={`rounded-full shrink-0 ${status === 'compiling' || isPlaying ? 'animate-status-pulse' : ''}`}
          aria-hidden="true"
          style={{
            width: 7,
            height: 7,
            background: displayColor,
            transition: 'background 0.3s ease',
          }}
        />
        <span
          className="font-bold truncate"
          style={{
            transition: 'opacity 0.2s ease',
            maxWidth: '40vw',
            color: status === 'error' ? 'var(--c-error)' : 'var(--c-text-sub)',
          }}
        >
          {emptyHint ? 'ブロックをおいて おんがくをつくろう！' : displayText}
          {status === 'error' && compileError && (
            <span
              className="text-[var(--c-error)] animate-fade-in"
              style={{ marginLeft: 'var(--sp-2)' }}
            >
              {compileError}
            </span>
          )}
        </span>
      </div>

      {/* Center: Track info + BPM */}
      <div
        className="flex items-center shrink-0 text-[var(--c-text-muted)]"
        style={{ gap: 'var(--sp-2)' }}
      >
        {/* Active track name (hidden on very small screens) */}
        {activeTrack && (
          <span
            className="hidden sm:inline truncate font-bold"
            style={{ maxWidth: '120px' }}
            title={activeTrack.name}
          >
            {activeTrack.name}
          </span>
        )}
        {/* Track count when multiple tracks */}
        {tracks.length > 1 && (
          <span className="hidden sm:inline" style={{ fontSize: 'var(--fs-xs)' }}>
            ({tracks.length}トラック)
          </span>
        )}
        {/* Separator */}
        {activeTrack && (
          <span className="hidden sm:inline" aria-hidden="true" style={{ opacity: 0.3 }}>
            |
          </span>
        )}
        {/* BPM display */}
        <span className="font-bold shrink-0" title={`テンポ ${bpm} BPM`}>
          <span aria-hidden="true" style={{ marginRight: 2 }}>
            ♩
          </span>
          <span data-testid="bpm-display">{bpm}</span>
        </span>
      </div>

      {/* Experience level */}
      <ExperienceIndicator />

      {/* Right: Keyboard shortcuts (desktop only) */}
      <nav
        className="hidden md:flex items-center text-[var(--c-text-muted)]"
        style={{ gap: 'var(--sp-3)', fontSize: 'var(--fs-xs)' }}
        aria-label="キーボードショートカット"
      >
        <span>
          <kbd>Space</kbd> ならす/とめる
        </span>
        <span>
          <kbd>Ctrl+S</kbd> ほぞん
        </span>
        <span>
          <kbd>?</kbd> ショートカットいちらん
        </span>
      </nav>
      <span className="text-[var(--c-text-muted)] font-bold shrink-0 hidden sm:inline">
        biyo v0.1
      </span>
    </output>
  );
}
