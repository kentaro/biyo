'use client';

import { useEffect, useRef } from 'react';

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

interface ShortcutEntry {
  keys: string;
  description: string;
}

const shortcuts: ShortcutEntry[] = [
  { keys: 'Space', description: 'おんがくを ならす / とめる' },
  { keys: 'Ctrl/Cmd + Z', description: 'もどす（アンドゥ）' },
  { keys: 'Ctrl/Cmd + Shift + Z', description: 'やりなおす（リドゥ）' },
  { keys: 'Ctrl/Cmd + Y', description: 'やりなおす（リドゥ）' },
  { keys: 'Ctrl/Cmd + S', description: 'ほぞんする' },
  { keys: 'Escape', description: 'ダイアログをとじる' },
  { keys: '?', description: 'このヘルプをひらく' },
];

export default function KeyboardShortcutsHelp({ open, onClose }: KeyboardShortcutsHelpProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Focus management, keyboard handling, and focus trap
  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Focus the close button after mounting
    const timer = setTimeout(() => {
      dialogRef.current?.querySelector<HTMLElement>('button')?.focus();
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: backdrop dismiss pattern
    // biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismiss pattern
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--c-overlay-bg)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="animate-pop-in"
        role="dialog"
        aria-modal="true"
        aria-label="キーボードショートカット"
        style={{
          background: 'var(--c-surface)',
          borderRadius: 'var(--r-lg)',
          padding: 'var(--sp-6)',
          maxWidth: 420,
          width: '90vw',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-lg)',
          fontFamily: 'var(--font-main)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--sp-4)',
          }}
        >
          <h2
            style={{
              fontSize: 'var(--fs-lg)',
              fontWeight: 900,
              color: 'var(--c-text)',
              margin: 0,
            }}
          >
            キーボードショートカット
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 'var(--fs-lg)',
              cursor: 'pointer',
              color: 'var(--c-text-muted)',
              padding: 'var(--sp-1)',
              lineHeight: 1,
              minWidth: 44,
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="とじる"
          >
            x
          </button>
        </div>

        {/* Shortcuts list */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--sp-2)',
          }}
        >
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.description}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--sp-2) var(--sp-3)',
                background: 'var(--c-surface-alt)',
                borderRadius: 'var(--r-sm)',
                gap: 'var(--sp-3)',
              }}
            >
              <span
                style={{
                  fontSize: 'var(--fs-sm)',
                  fontWeight: 600,
                  color: 'var(--c-text)',
                }}
              >
                {shortcut.description}
              </span>
              <kbd>{shortcut.keys}</kbd>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <p
          style={{
            fontSize: 'var(--fs-xs)',
            color: 'var(--c-text-muted)',
            textAlign: 'center',
            marginTop: 'var(--sp-4)',
            marginBottom: 0,
          }}
        >
          <kbd>?</kbd> をおすと いつでもひらけるよ
        </p>
      </div>
    </div>
  );
}
