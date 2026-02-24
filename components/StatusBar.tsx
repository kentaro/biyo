'use client';

import { useCompileStore } from '@/lib/stores/compile';
import ExperienceIndicator from './ExperienceIndicator';

export default function StatusBar() {
  const status = useCompileStore((s) => s.status);
  const compileError = useCompileStore((s) => s.compileError);

  const cfg = {
    ready: { color: 'var(--c-ok)', text: 'じゅんびOK！' },
    compiling: { color: 'var(--c-warn)', text: 'つくっているよ...' },
    error: { color: 'var(--c-error)', text: 'あれ？ブロックをたしかめてみてね' },
  }[status];

  return (
    <output
      className="flex items-center justify-between h-full bg-[var(--c-surface)] border-t border-[var(--c-border)]"
      style={{ padding: '0 var(--sp-3)', fontSize: 'var(--fs-xs)', gap: 'var(--sp-2)' }}
      aria-live="polite"
      aria-label="じょうたい"
    >
      <div className="flex items-center shrink-0" style={{ gap: 'var(--sp-1)' }}>
        <span
          className={`rounded-full shrink-0 ${status === 'compiling' ? 'animate-status-pulse' : ''}`}
          aria-hidden="true"
          style={{
            width: 7,
            height: 7,
            background: cfg.color,
            transition: 'background 0.3s ease',
          }}
        />
        <span
          className="font-bold text-[var(--c-text-sub)] truncate"
          style={{ transition: 'opacity 0.2s ease', maxWidth: '40vw' }}
        >
          {cfg.text}
          {status === 'error' && compileError && (
            <span
              className="text-[var(--c-error)] animate-fade-in hidden sm:inline"
              style={{ marginLeft: 'var(--sp-2)' }}
            >
              {compileError}
            </span>
          )}
        </span>
      </div>
      <ExperienceIndicator />
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
