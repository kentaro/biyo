'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'biyo_tutorial_done';

interface TutorialStep {
  title: string;
  text: string;
  hint?: string;
  emoji: string;
  /** CSS position for the animated pointer arrow */
  arrowDirection: 'left' | 'center' | 'right' | 'none';
}

const STEPS: TutorialStep[] = [
  {
    title: 'ブロックをえらぼう！',
    text: 'ひだりの「おと」メニューから、ピンクのブロックをえらんでね！',
    hint: '「ピー」「プップー」「ザー」のなかから、すきなおとをえらぼう！',
    emoji: '👈',
    arrowDirection: 'left',
  },
  {
    title: 'ひろばにおこう！',
    text: 'えらんだブロックを、まんなかのひろばにドラッグしてね！',
    emoji: '✋',
    arrowDirection: 'center',
  },
  {
    title: 'おとをならそう！',
    text: 'みぎうえの ▶ ボタンをおして、おとをきいてみよう！',
    emoji: '🔊',
    arrowDirection: 'right',
  },
  {
    title: 'へんしんさせよう！',
    text: 'ひだりの「へんしん」メニューから、あおいブロックをえらんでね！',
    hint: '「おふろ」「やまびこ」「パリパリ」で、おとがかわるよ！',
    emoji: '✨',
    arrowDirection: 'left',
  },
  {
    title: 'つなげてみよう！',
    text: 'ピンクのおとブロックを、あおいへんしんブロックにはめてみよう！',
    hint: 'ブロックのくぼみに、べつのブロックをドラッグしてくっつけるよ！',
    emoji: '🧩',
    arrowDirection: 'center',
  },
  {
    title: 'おとのへやをふやそう！',
    text: 'みぎの「おとのへや」の ＋ ボタンで、あたらしいへやをつくれるよ！',
    hint: 'いくつものおとをかさねると、もっとすてきなおんがくになるよ！',
    emoji: '🏠',
    arrowDirection: 'right',
  },
  {
    title: 'できたね！',
    text: 'すごい！じぶんだけのおんがくができたよ！\nいろんなブロックをためしてみてね！',
    emoji: '🎵',
    arrowDirection: 'none',
  },
];

interface TutorialOverlayProps {
  onDismiss: () => void;
  onOpenSamples: () => void;
}

export default function TutorialOverlay({ onDismiss, onOpenSamples }: TutorialOverlayProps) {
  const [step, setStep] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleNext = useCallback(() => {
    if (isLast) return;
    setStep((s) => s + 1);
  }, [isLast]);

  const handleBack = useCallback(() => {
    setStep((s) => Math.max(0, s - 1));
  }, []);

  const handleFinish = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    onDismiss();
  }, [onDismiss]);

  const handleSamples = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    onDismiss();
    onOpenSamples();
  }, [onDismiss, onOpenSamples]);

  // Escape key, focus trap, and focus restore
  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleFinish();
        return;
      }
      if (e.key === 'Tab' && cardRef.current) {
        const focusable = cardRef.current.querySelectorAll<HTMLElement>(
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
      () => cardRef.current?.querySelector<HTMLElement>('button')?.focus(),
      50,
    );
    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [handleFinish]);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: backdrop dismiss pattern
    // biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismiss pattern
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--c-overlay-bg)',
        backdropFilter: 'blur(4px)',
        animation: 'tutFadeIn 0.35s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleFinish();
      }}
    >
      <style>{`
        /* --- Tutorial animations --- */
        @keyframes tutFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes tutCardIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes tutBounceLeft {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-10px); }
        }
        @keyframes tutBounceRight {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(10px); }
        }
        @keyframes tutBounceDown {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(8px); }
        }
        @keyframes tutPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.85; }
        }
        @keyframes tutConfetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-60px) rotate(360deg); opacity: 0; }
        }
        @keyframes tutStepSlide {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .tut-card {
          animation: tutCardIn 0.4s ease-out both;
        }
        .tut-step-content {
          animation: tutStepSlide 0.3s ease-out both;
        }
        .tut-arrow-left {
          animation: tutBounceLeft 1.2s ease-in-out infinite;
        }
        .tut-arrow-right {
          animation: tutBounceRight 1.2s ease-in-out infinite;
        }
        .tut-arrow-down {
          animation: tutBounceDown 1.2s ease-in-out infinite;
        }
        .tut-emoji-pulse {
          animation: tutPulse 1.5s ease-in-out infinite;
        }
        .tut-btn {
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .tut-btn:hover {
          transform: translateY(-2px);
        }
        .tut-btn:active {
          transform: translateY(0) scale(0.97);
        }
        .tut-confetti-particle {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: tutConfetti 1.2s ease-out forwards;
        }
      `}</style>

      <div
        ref={cardRef}
        className="tut-card"
        role="dialog"
        aria-modal="true"
        aria-label="つかいかたチュートリアル"
        style={{
          background: 'var(--c-surface)',
          borderRadius: 'var(--r-lg)',
          padding: 'var(--sp-6)',
          maxWidth: 420,
          width: '90vw',
          maxHeight: '85vh',
          overflowY: 'auto',
          textAlign: 'center',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
        }}
      >
        {/* Confetti for last step */}
        {isLast && (
          <div aria-hidden="true">
            {[
              { id: 'c-src-15', color: 'var(--c-source)', left: '15%', delay: '0s' },
              { id: 'c-eff-35', color: 'var(--c-effect)', left: '35%', delay: '0.15s' },
              { id: 'c-ok-55', color: 'var(--c-ok)', left: '55%', delay: '0.08s' },
              { id: 'c-pre-75', color: 'var(--c-preset)', left: '75%', delay: '0.22s' },
              { id: 'c-utl-25', color: 'var(--c-utility)', left: '25%', delay: '0.3s' },
              { id: 'c-not-65', color: 'var(--c-note)', left: '65%', delay: '0.12s' },
              { id: 'c-src-45', color: 'var(--c-source)', left: '45%', delay: '0.2s' },
              { id: 'c-eff-85', color: 'var(--c-effect)', left: '85%', delay: '0.05s' },
            ].map((p) => (
              <span
                key={p.id}
                className="tut-confetti-particle"
                style={{
                  background: p.color,
                  left: p.left,
                  bottom: '40%',
                  animationDelay: p.delay,
                }}
              />
            ))}
          </div>
        )}

        {/* Step content area */}
        <div key={step} className="tut-step-content">
          {/* Animated pointer for non-final steps */}
          {current.arrowDirection !== 'none' && (
            <div
              style={{
                fontSize: 'var(--fs-xxl)',
                marginBottom: 'var(--sp-2)',
                lineHeight: 1,
              }}
            >
              {current.arrowDirection === 'left' && (
                <span className="tut-arrow-left" style={{ display: 'inline-block' }}>
                  👈
                </span>
              )}
              {current.arrowDirection === 'right' && (
                <span className="tut-arrow-right" style={{ display: 'inline-block' }}>
                  👉
                </span>
              )}
              {current.arrowDirection === 'center' && (
                <span className="tut-arrow-down" style={{ display: 'inline-block' }}>
                  👇
                </span>
              )}
            </div>
          )}

          {/* Emoji for final step */}
          {current.arrowDirection === 'none' && (
            <div
              className="tut-emoji-pulse"
              style={{ fontSize: 'var(--fs-emoji)', marginBottom: 'var(--sp-2)', lineHeight: 1 }}
            >
              {current.emoji}
            </div>
          )}

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
            {current.title}
          </h2>

          {/* Description */}
          <p
            style={{
              fontFamily: 'var(--font-main)',
              fontSize: 'var(--fs-md)',
              color: 'var(--c-text-sub)',
              margin: '0 0 var(--sp-3) 0',
              lineHeight: 1.6,
            }}
          >
            {current.text}
          </p>

          {/* Hint (optional) */}
          {current.hint && (
            <p
              style={{
                fontFamily: 'var(--font-main)',
                fontSize: 'var(--fs-sm)',
                color: 'var(--c-text-muted)',
                margin: '0 0 var(--sp-3) 0',
                lineHeight: 1.5,
                background: 'var(--c-surface-alt)',
                borderRadius: 'var(--r-sm)',
                padding: 'var(--sp-2) var(--sp-3)',
              }}
            >
              💡 {current.hint}
            </p>
          )}
        </div>

        {/* Step indicator dots */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'var(--sp-2)',
            marginBottom: 'var(--sp-4)',
          }}
        >
          {STEPS.map((s, i) => (
            <span
              key={s.title}
              style={{
                width: i === step ? 20 : 8,
                height: 8,
                borderRadius: 'var(--r-full)',
                background:
                  i === step
                    ? 'linear-gradient(135deg, var(--c-source), var(--c-preset))'
                    : 'var(--c-border)',
                transition: 'width 0.25s ease, background 0.25s ease',
              }}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        {!isLast ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--sp-3)',
              justifyContent: 'center',
            }}
          >
            {/* Main action buttons: Back and Next */}
            <div style={{ display: 'flex', gap: 'var(--sp-3)', justifyContent: 'center' }}>
              {step > 0 && (
                <button
                  type="button"
                  className="tut-btn"
                  onClick={handleBack}
                  style={{
                    fontFamily: 'var(--font-main)',
                    fontSize: 'var(--fs-md)',
                    fontWeight: 700,
                    color: 'var(--c-text-inverse)',
                    background: 'linear-gradient(135deg, var(--c-effect), var(--c-gradient-blue))',
                    border: 'none',
                    borderRadius: 'var(--r-md)',
                    padding: 'var(--sp-3) var(--sp-5)',
                    cursor: 'pointer',
                    minWidth: 44,
                    minHeight: 44,
                    flex: 1,
                    boxShadow: 'var(--shadow-effect-glow)',
                  }}
                >
                  もどる
                </button>
              )}
              <button
                type="button"
                className="tut-btn"
                onClick={handleNext}
                style={{
                  fontFamily: 'var(--font-main)',
                  fontSize: 'var(--fs-md)',
                  fontWeight: 700,
                  color: 'var(--c-text-inverse)',
                  background: 'linear-gradient(135deg, var(--c-source), var(--c-preset))',
                  border: 'none',
                  borderRadius: 'var(--r-md)',
                  padding: 'var(--sp-3) var(--sp-5)',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-source-glow)',
                  minWidth: 44,
                  minHeight: 44,
                  flex: step > 0 ? 1 : undefined,
                }}
              >
                つぎへ
              </button>
            </div>
            {/* Skip button - now more prominent */}
            <button
              type="button"
              className="tut-btn"
              onClick={handleFinish}
              style={{
                fontFamily: 'var(--font-main)',
                fontSize: 'var(--fs-md)',
                fontWeight: 700,
                color: 'var(--c-text-inverse)',
                background: 'var(--c-border)',
                border: 'none',
                borderRadius: 'var(--r-md)',
                padding: 'var(--sp-3) var(--sp-5)',
                cursor: 'pointer',
                minWidth: 44,
                minHeight: 44,
              }}
            >
              スキップ
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            <button
              type="button"
              className="tut-btn"
              onClick={handleFinish}
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
                minWidth: 44,
                minHeight: 44,
              }}
            >
              もっとためす
            </button>
            <button
              type="button"
              className="tut-btn"
              onClick={handleSamples}
              style={{
                fontFamily: 'var(--font-main)',
                fontSize: 'var(--fs-md)',
                fontWeight: 700,
                color: 'var(--c-text-inverse)',
                background: 'linear-gradient(135deg, var(--c-effect), var(--c-gradient-blue))',
                border: 'none',
                borderRadius: 'var(--r-md)',
                padding: 'var(--sp-3) var(--sp-6)',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-effect-glow)',
                minWidth: 44,
                minHeight: 44,
              }}
            >
              おてほんをみる
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
