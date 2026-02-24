'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CATEGORY_META,
  getCategories,
  getSampleList,
  type Sample,
  type SampleCategory,
} from '@/lib/samples';

interface SampleBrowserProps {
  open: boolean;
  onClose: () => void;
  onLoadSample: (sampleKey: string) => void;
}

export default function SampleBrowser({ open, onClose, onLoadSample }: SampleBrowserProps) {
  const [activeCategory, setActiveCategory] = useState<SampleCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [randomSpinning, setRandomSpinning] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const allSamples = useMemo(() => getSampleList(), []);
  const categories = useMemo(() => getCategories(), []);

  const filtered = useMemo(() => {
    let list: Sample[] = allSamples;
    if (activeCategory !== 'all') {
      list = list.filter((s) => s.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q),
      );
    }
    return list;
  }, [allSamples, activeCategory, search]);

  const handlePickRandom = useCallback(() => {
    if (randomSpinning || filtered.length === 0) return;
    setRandomSpinning(true);
    setTimeout(() => setRandomSpinning(false), 600);
    const idx = Math.floor(Math.random() * filtered.length);
    const sample = filtered[idx];
    onLoadSample(sample.key);
    onClose();
  }, [randomSpinning, filtered, onLoadSample, onClose]);

  // Focus trap and Escape key
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
    // Auto-focus the dialog
    setTimeout(() => dialogRef.current?.querySelector<HTMLElement>('input')?.focus(), 50);

    return () => {
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
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--c-overlay-bg)',
        backdropFilter: 'blur(4px)',
        animation: 'sampleFadeIn 0.3s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        @keyframes sampleFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes sampleSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .sample-browser-card {
          animation: sampleSlideUp 0.4s ease-out 0.05s both;
        }
        .sample-chip {
          transition: transform 0.1s ease, box-shadow 0.1s ease;
          cursor: pointer;
          white-space: nowrap;
        }
        .sample-chip:hover {
          transform: translateY(-1px);
        }
        .sample-chip:active {
          transform: scale(0.96);
        }
        .sample-item {
          transition: transform 0.1s ease, box-shadow 0.1s ease;
          cursor: pointer;
        }
        .sample-item:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .sample-item:active {
          transform: translateY(0) scale(0.98);
        }
        .random-pick-btn {
          transition: transform 0.1s ease, box-shadow 0.1s ease;
        }
        .random-pick-btn:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }
        .random-pick-btn:active {
          transform: scale(0.96);
        }
        .random-pick-spin {
          animation: randomDiceSpin 0.6s ease-out;
        }
        @keyframes randomDiceSpin {
          0%   { transform: scale(1) rotate(0deg); }
          30%  { transform: scale(1.1) rotate(-8deg); }
          60%  { transform: scale(0.95) rotate(4deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
      `}</style>

      <div
        ref={dialogRef}
        className="sample-browser-card"
        role="dialog"
        aria-modal="true"
        aria-label="おてほんをえらぼう"
        style={{
          background: 'var(--c-surface)',
          borderRadius: 'var(--r-lg)',
          padding: 'var(--sp-4)',
          maxWidth: 600,
          width: '94vw',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--sp-3)' }}>
          <h2
            style={{
              fontFamily: 'var(--font-main)',
              fontSize: 'var(--fs-lg)',
              fontWeight: 900,
              color: 'var(--c-text)',
              margin: 0,
              flex: 1,
            }}
          >
            おてほんをえらぼう
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              fontFamily: 'var(--font-main)',
              fontSize: 'var(--fs-lg)',
              fontWeight: 700,
              color: 'var(--c-text-muted)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 'var(--sp-2)',
              lineHeight: 1,
              minWidth: 44,
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="とじる"
          >
            &times;
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="なまえでさがす..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="おてほんをさがす"
          style={{
            fontFamily: 'var(--font-main)',
            fontSize: 'var(--fs-sm)',
            padding: 'var(--sp-2) var(--sp-3)',
            border: '2px solid var(--c-border)',
            borderRadius: 'var(--r-md)',
            background: 'var(--c-surface-alt)',
            color: 'var(--c-text)',
            outline: 'none',
            marginBottom: 'var(--sp-3)',
            width: '100%',
            boxSizing: 'border-box',
          }}
        />

        {/* Category chips */}
        <div
          role="tablist"
          aria-label="カテゴリ"
          style={{
            display: 'flex',
            gap: 'var(--sp-2)',
            marginBottom: 'var(--sp-3)',
            overflowX: 'auto',
            paddingBottom: 'var(--sp-1)',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            className="sample-chip"
            role="tab"
            aria-selected={activeCategory === 'all'}
            onClick={() => setActiveCategory('all')}
            style={{
              fontFamily: 'var(--font-main)',
              fontSize: 'var(--fs-xs)',
              fontWeight: 700,
              padding: 'var(--sp-2) var(--sp-3)',
              borderRadius: 'var(--r-full)',
              border: '2px solid',
              borderColor: activeCategory === 'all' ? 'var(--c-preset)' : 'var(--c-border)',
              background: activeCategory === 'all' ? 'var(--c-preset)' : 'var(--c-surface)',
              color: activeCategory === 'all' ? 'var(--c-text-inverse)' : 'var(--c-text-sub)',
            }}
          >
            ぜんぶ ({allSamples.length})
          </button>
          {categories.map((cat) => {
            const meta = CATEGORY_META[cat];
            const count = allSamples.filter((s) => s.category === cat).length;
            const isActive = activeCategory === cat;
            return (
              <button
                type="button"
                key={cat}
                className="sample-chip"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveCategory(cat)}
                style={{
                  fontFamily: 'var(--font-main)',
                  fontSize: 'var(--fs-xs)',
                  fontWeight: 700,
                  padding: 'var(--sp-2) var(--sp-3)',
                  borderRadius: 'var(--r-full)',
                  border: '2px solid',
                  borderColor: isActive ? 'var(--c-preset)' : 'var(--c-border)',
                  background: isActive ? 'var(--c-preset)' : 'var(--c-surface)',
                  color: isActive ? 'var(--c-text-inverse)' : 'var(--c-text-sub)',
                }}
              >
                {meta.emoji} {meta.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Random pick button */}
        {filtered.length > 0 && (
          <button
            type="button"
            className={`random-pick-btn ${randomSpinning ? 'random-pick-spin' : ''}`}
            onClick={handlePickRandom}
            aria-label="ランダムにおてほんをえらぶ"
            style={{
              fontFamily: 'var(--font-main)',
              fontSize: 'var(--fs-sm)',
              fontWeight: 800,
              color: 'var(--c-text-inverse)',
              background: 'linear-gradient(135deg, var(--c-preset), var(--c-source))',
              border: 'none',
              borderRadius: 'var(--r-md)',
              padding: 'var(--sp-2) var(--sp-4)',
              cursor: 'pointer',
              marginBottom: 'var(--sp-3)',
              boxShadow: 'var(--shadow-btn)',
              width: '100%',
              textAlign: 'center',
              flexShrink: 0,
            }}
          >
            &#x1F3B2; ランダムにえらぶ
          </button>
        )}

        {/* Sample list */}
        <div
          role="tabpanel"
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px, 100%), 1fr))',
            gap: 'var(--sp-2)',
            alignContent: 'start',
          }}
        >
          {filtered.length === 0 && (
            <div
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: 'var(--sp-6)',
                color: 'var(--c-text-muted)',
                fontFamily: 'var(--font-main)',
                fontSize: 'var(--fs-md)',
              }}
            >
              みつからなかった...
            </div>
          )}
          {filtered.map((sample) => {
            const meta = CATEGORY_META[sample.category];
            return (
              <button
                type="button"
                key={sample.key}
                className="sample-item"
                aria-label={`${sample.name}をよみこむ`}
                onClick={() => {
                  onLoadSample(sample.key);
                  onClose();
                }}
                style={{
                  fontFamily: 'var(--font-main)',
                  textAlign: 'left',
                  background: 'var(--c-surface-alt)',
                  border: '2px solid var(--c-border-light)',
                  borderRadius: 'var(--r-md)',
                  padding: 'var(--sp-3)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div
                  style={{
                    fontSize: 'var(--fs-sm)',
                    fontWeight: 700,
                    color: 'var(--c-text)',
                    marginBottom: 2,
                  }}
                >
                  {meta.emoji} {sample.name}
                </div>
                <div
                  style={{
                    fontSize: 'var(--fs-xs)',
                    color: 'var(--c-text-sub)',
                    lineHeight: 1.4,
                  }}
                >
                  {sample.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
