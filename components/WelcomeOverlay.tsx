'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORY_META, getCategories, getSampleList } from '@/lib/samples';

const STORAGE_KEY = 'biyo_visited';

// Featured samples: first sample from each category for the welcome screen
function getFeaturedSamples() {
  const all = getSampleList();
  const categories = getCategories();
  const featured: typeof all = [];
  for (const cat of categories) {
    const first = all.find((s) => s.category === cat);
    if (first) featured.push(first);
  }
  return featured;
}

interface WelcomeOverlayProps {
  onDismiss: () => void;
  onLoadSample: (sampleKey: string) => void;
  onTutorial: () => void;
}

export default function WelcomeOverlay({
  onDismiss,
  onLoadSample,
  onTutorial,
}: WelcomeOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [showSamples, setShowSamples] = useState(false);
  const featured = useMemo(() => getFeaturedSamples(), []);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const visited = localStorage.getItem(STORAGE_KEY);
    if (!visited) {
      setVisible(true);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
    onDismiss();
  }, [onDismiss]);

  // Focus trap and Escape key
  useEffect(() => {
    if (!visible) return;
    previousFocusRef.current = document.activeElement as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
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
    const focusTimer = setTimeout(
      () => dialogRef.current?.querySelector<HTMLElement>('button')?.focus(),
      50,
    );

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [visible, handleDismiss]);

  const handleSampleSelect = (key: string) => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
    onLoadSample(key);
  };

  if (!visible) return null;

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: backdrop dismiss pattern
    // biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismiss pattern
    <div
      className="welcome-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--c-overlay-bg)',
        backdropFilter: 'blur(4px)',
        animation: 'welcomeFadeIn 0.4s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDismiss();
      }}
    >
      <style>{`
        @keyframes welcomeFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes welcomeSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes welcomeBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .welcome-card {
          animation: welcomeSlideUp 0.5s ease-out 0.1s both;
        }
        .welcome-btn {
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .welcome-btn:hover {
          transform: translateY(-2px);
        }
        .welcome-btn:active {
          transform: translateY(0) scale(0.97);
        }
        .welcome-note {
          animation: welcomeBounce 2s ease-in-out infinite;
        }
        .sample-card {
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .sample-card:hover {
          transform: translateY(-2px);
        }
        .sample-card:active {
          transform: translateY(0) scale(0.97);
        }
        .sample-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--sp-2);
          overflow-y: auto;
          flex: 1;
        }
        @media (max-width: 480px) {
          .sample-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div
        ref={dialogRef}
        className="welcome-card"
        role="dialog"
        aria-modal="true"
        aria-label="biyoへようこそ"
        style={{
          background: 'var(--c-surface)',
          borderRadius: 'var(--r-lg)',
          padding: 'var(--sp-6)',
          maxWidth: 480,
          width: '90vw',
          maxHeight: '85vh',
          textAlign: 'center',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {!showSamples ? (
          <>
            {/* Music note icon */}
            <div
              className="welcome-note"
              style={{
                fontSize: 'var(--fs-emoji)',
                marginBottom: 'var(--sp-3)',
                lineHeight: 1,
              }}
              aria-hidden="true"
            >
              ♪
            </div>

            {/* Title */}
            <h2
              style={{
                fontFamily: 'var(--font-main)',
                fontSize: 'var(--fs-xl)',
                fontWeight: 900,
                color: 'var(--c-text)',
                margin: '0 0 var(--sp-2) 0',
              }}
            >
              <span
                style={{
                  background:
                    'linear-gradient(135deg, var(--c-source), var(--c-preset), var(--c-effect))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                biyo
              </span>
              へようこそ！
            </h2>

            <p
              style={{
                fontFamily: 'var(--font-main)',
                fontSize: 'var(--fs-md)',
                color: 'var(--c-text-sub)',
                margin: '0 0 var(--sp-6) 0',
                lineHeight: 1.6,
              }}
            >
              ブロックをくみあわせて
              <br />
              おんがくをつくってみよう！
            </p>

            {/* Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              <button
                type="button"
                className="welcome-btn"
                onClick={handleDismiss}
                style={{
                  fontFamily: 'var(--font-main)',
                  fontSize: 'var(--fs-lg)',
                  fontWeight: 700,
                  color: 'var(--c-text-inverse)',
                  background: 'linear-gradient(135deg, var(--c-ok), var(--c-gradient-green))',
                  border: 'none',
                  borderRadius: 'var(--r-md)',
                  padding: 'var(--sp-4) var(--sp-6)',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-ok-glow)',
                }}
              >
                じぶんでつくる
              </button>

              <button
                type="button"
                className="welcome-btn"
                onClick={() => setShowSamples(true)}
                style={{
                  fontFamily: 'var(--font-main)',
                  fontSize: 'var(--fs-lg)',
                  fontWeight: 700,
                  color: 'var(--c-text-inverse)',
                  background: 'linear-gradient(135deg, var(--c-effect), var(--c-gradient-blue))',
                  border: 'none',
                  borderRadius: 'var(--r-md)',
                  padding: 'var(--sp-4) var(--sp-6)',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-effect-glow)',
                }}
              >
                おてほんをみる
              </button>

              <button
                type="button"
                className="welcome-btn"
                onClick={() => {
                  localStorage.setItem(STORAGE_KEY, 'true');
                  setVisible(false);
                  onTutorial();
                }}
                style={{
                  fontFamily: 'var(--font-main)',
                  fontSize: 'var(--fs-md)',
                  fontWeight: 700,
                  color: 'var(--c-text-sub)',
                  background: 'var(--c-surface-alt)',
                  border: '2px solid var(--c-border)',
                  borderRadius: 'var(--r-md)',
                  padding: 'var(--sp-3) var(--sp-6)',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                つかいかた
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Sample selection view - showing one featured per category */}
            <h3
              style={{
                fontFamily: 'var(--font-main)',
                fontSize: 'var(--fs-lg)',
                fontWeight: 900,
                color: 'var(--c-text)',
                margin: '0 0 var(--sp-3) 0',
                flexShrink: 0,
              }}
            >
              おてほんをえらんでね
            </h3>

            <div className="sample-grid">
              {featured.map((sample) => {
                const meta = CATEGORY_META[sample.category];
                return (
                  <button
                    type="button"
                    key={sample.key}
                    className="sample-card"
                    aria-label={`${sample.name}をよみこむ`}
                    onClick={() => handleSampleSelect(sample.key)}
                    style={{
                      fontFamily: 'var(--font-main)',
                      textAlign: 'left',
                      background: 'var(--c-surface-alt)',
                      border: '2px solid var(--c-border-light)',
                      borderRadius: 'var(--r-md)',
                      padding: 'var(--sp-3)',
                      cursor: 'pointer',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 'var(--fs-sm)',
                        fontWeight: 700,
                        color: 'var(--c-text)',
                        marginBottom: 'var(--sp-half)',
                      }}
                    >
                      {meta.emoji} {meta.label}
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--fs-xs)',
                        color: 'var(--c-text-sub)',
                        lineHeight: 1.3,
                      }}
                    >
                      {sample.name}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className="welcome-btn"
              onClick={() => setShowSamples(false)}
              style={{
                fontFamily: 'var(--font-main)',
                fontSize: 'var(--fs-sm)',
                fontWeight: 700,
                color: 'var(--c-text-muted)',
                background: 'none',
                border: 'none',
                marginTop: 'var(--sp-3)',
                cursor: 'pointer',
                padding: 'var(--sp-2)',
                flexShrink: 0,
                minWidth: 44,
                minHeight: 44,
              }}
            >
              もどる
            </button>
          </>
        )}
      </div>
    </div>
  );
}
