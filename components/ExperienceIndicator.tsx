'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { type ExperienceLevel, useExperienceStore } from '@/lib/stores/experience';

const LEVEL_CONFIG: Record<
  ExperienceLevel,
  { emoji: string; label: string; color: string; nextLabel?: string }
> = {
  beginner: {
    emoji: '\uD83C\uDF31',
    label: '\u306F\u3058\u3081\u3066',
    color: 'var(--c-rhythm)',
    nextLabel: '\u306A\u308C\u3066\u304D\u305F',
  },
  intermediate: {
    emoji: '\uD83C\uDF3F',
    label: '\u306A\u308C\u3066\u304D\u305F',
    color: 'var(--c-effect)',
    nextLabel: '\u3058\u3085\u304F\u308C\u3093',
  },
  advanced: {
    emoji: '\uD83C\uDF33',
    label: '\u3058\u3085\u304F\u308C\u3093',
    color: 'var(--c-preset)',
  },
};

/** Calculate progress toward next level as 0..1 */
function getProgress(
  level: ExperienceLevel,
  blocksPlaced: number,
  tracksCreated: number,
  effectsUsedCount: number,
): number {
  if (level === 'advanced') return 1;

  if (level === 'beginner') {
    const blockProgress = Math.min(blocksPlaced / 10, 1);
    const trackProgress = Math.min(tracksCreated / 2, 1);
    return Math.max(blockProgress, trackProgress);
  }

  // intermediate: need 5 effects OR 3 tracks
  const effectProgress = Math.min(effectsUsedCount / 5, 1);
  const trackProgress = Math.min(tracksCreated / 3, 1);
  return Math.max(effectProgress, trackProgress);
}

function getProgressMessage(
  level: ExperienceLevel,
  blocksPlaced: number,
  tracksCreated: number,
  effectsUsedCount: number,
): string | null {
  if (level === 'advanced') {
    return '\u305C\u3093\u3076\u3064\u304B\u3048\u308B\u3088\uFF01';
  }

  if (level === 'beginner') {
    const blocksNeeded = 10 - blocksPlaced;
    const tracksNeeded = 2 - tracksCreated;

    if (blocksNeeded > 0 && tracksNeeded > 0) {
      return `\u3042\u3068${blocksNeeded}\u3064\u30D6\u30ED\u30C3\u30AF\u3092\u304A\u304F\u3068 \u30EC\u30D9\u30EB\u30A2\u30C3\u30D7\uFF01`;
    }
    return '\u3082\u3046\u3059\u3050\u30EC\u30D9\u30EB\u30A2\u30C3\u30D7\uFF01';
  }

  // intermediate
  const effectsNeeded = 5 - effectsUsedCount;
  const tracksNeeded = 3 - tracksCreated;

  if (effectsNeeded > 0 && tracksNeeded > 0) {
    return `\u3042\u3068${effectsNeeded}\u3057\u3085\u308B\u3044\u306E\u3078\u3093\u3057\u3093\u3067 \u30EC\u30D9\u30EB\u30A2\u30C3\u30D7\uFF01`;
  }
  return '\u3082\u3046\u3059\u3050\u30EC\u30D9\u30EB\u30A2\u30C3\u30D7\uFF01';
}

const LEVEL_DETAILS: Record<ExperienceLevel, { blocks: string; description: string }> = {
  beginner: {
    blocks:
      '\u304A\u3068 / \u30D4\u30A2\u30CE / \u3078\u3093\u3057\u3093 / \u304A\u3070\u3051\u30FB\u30EC\u30FC\u30B6\u30FC\u306A\u3069',
    description:
      '\u304D\u307B\u3093\u306E\u304A\u3068\u3068\u305F\u306E\u3057\u3044\u30D7\u30EA\u30BB\u30C3\u30C8\u3067\u3042\u305D\u307C\u3046',
  },
  intermediate: {
    blocks:
      '\u305C\u3093\u3076\u306E\u304A\u3068 / \u305C\u3093\u3076\u306E\u3078\u3093\u3057\u3093 / \u30EA\u30BA\u30E0 / \u304A\u3093\u304C\u304F',
    description:
      '\u304A\u3068\u3068\u30EA\u30BA\u30E0\u3092\u304F\u307F\u3042\u308F\u305B\u3088\u3046',
  },
  advanced: {
    blocks:
      '\u305D\u3046\u305E\u3046 / \u30B9\u30B1\u30FC\u30EB / \u30A2\u30EB\u30DA\u30B8\u30AA / \u30E1\u30ED\u30C7\u30A3\u30FC / \u3079\u3093\u308A',
    description: '\u306A\u3093\u3067\u3082\u3064\u304B\u3048\u308B\u30DE\u30B9\u30BF\u30FC\uFF01',
  },
};

export default function ExperienceIndicator() {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const level = useExperienceStore((s) => s.level);
  const blocksPlaced = useExperienceStore((s) => s.blocksPlaced);
  const tracksCreated = useExperienceStore((s) => s.tracksCreated);
  const effectsUsed = useExperienceStore((s) => s.effectsUsed);
  const manualUnlock = useExperienceStore((s) => s.manualUnlock);
  const unlockAll = useExperienceStore((s) => s.unlockAll);
  const resetExperience = useExperienceStore((s) => s.resetExperience);

  const config = LEVEL_CONFIG[level];
  const progress = getProgress(level, blocksPlaced, tracksCreated, effectsUsed.size);
  const progressMsg = getProgressMessage(level, blocksPlaced, tracksCreated, effectsUsed.size);
  const isMaxLevel = level === 'advanced';

  // Secret triple-tap on emoji to unlock all (for adults)
  const handleEmojiTap = useCallback(() => {
    tapCountRef.current += 1;

    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
    }

    if (tapCountRef.current >= 3) {
      tapCountRef.current = 0;
      unlockAll();
      setPopoverOpen(false);
      return;
    }

    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 600);
  }, [unlockAll]);

  // Close popover on outside click or Escape key
  useEffect(() => {
    if (!popoverOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setPopoverOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPopoverOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [popoverOpen]);

  // Cleanup tap timer on unmount
  useEffect(() => {
    return () => {
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
      }
    };
  }, []);

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        ref={btnRef}
        onClick={() => setPopoverOpen((v) => !v)}
        className="flex items-center"
        aria-label={`\u30EC\u30D9\u30EB: ${config.label}`}
        aria-expanded={popoverOpen}
        style={{
          fontFamily: 'var(--font-main)',
          fontSize: 'var(--fs-xs)',
          fontWeight: 700,
          color: config.color,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          gap: 'var(--sp-1)',
          padding: 'var(--sp-1) var(--sp-2)',
          borderRadius: 'var(--r-sm)',
          transition: 'background 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--c-surface-alt)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <span aria-hidden="true" style={{ fontSize: 'var(--fs-md)' }}>
          {config.emoji}
        </span>
        <span>{config.label}</span>
        {/* Mini progress bar inline */}
        {!isMaxLevel && (
          <span
            aria-hidden="true"
            style={{
              display: 'inline-block',
              width: 32,
              height: 4,
              background: 'var(--c-border)',
              borderRadius: 'var(--r-full)',
              overflow: 'hidden',
              marginLeft: 'var(--sp-half)',
            }}
          >
            <span
              style={{
                display: 'block',
                width: `${Math.round(progress * 100)}%`,
                height: '100%',
                background: config.color,
                borderRadius: 'var(--r-full)',
                transition: 'width 0.4s ease',
              }}
            />
          </span>
        )}
      </button>

      {popoverOpen && (
        <div
          ref={popoverRef}
          className="animate-pop-in"
          role="dialog"
          aria-label="\u30EC\u30D9\u30EB\u3057\u3087\u3046\u3055\u3044"
          style={{
            position: 'absolute',
            bottom: '100%',
            right: 0,
            marginBottom: 'var(--sp-2)',
            background: 'var(--c-surface)',
            border: '1px solid var(--c-border)',
            borderRadius: 'var(--r-md)',
            boxShadow: 'var(--shadow-md)',
            padding: 'var(--sp-4)',
            zIndex: 200,
            width: 'min(280px, 90vw)',
            fontFamily: 'var(--font-main)',
          }}
        >
          {/* Header with tappable emoji for secret unlock */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--sp-2)',
              marginBottom: 'var(--sp-3)',
            }}
          >
            <button
              type="button"
              onClick={handleEmojiTap}
              aria-label={'\u30EC\u30D9\u30EB\u30A2\u30A4\u30B3\u30F3'}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'default',
                fontSize: 'var(--fs-lg)',
                padding: 0,
                lineHeight: 1,
              }}
            >
              {config.emoji}
            </button>
            <span
              style={{
                fontSize: 'var(--fs-sm)',
                fontWeight: 700,
                color: 'var(--c-text)',
              }}
            >
              {config.label}
            </span>
          </div>

          {/* Visual progress bar */}
          {!isMaxLevel && (
            <div style={{ marginBottom: 'var(--sp-3)' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--sp-1)',
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--fs-xs)',
                    fontWeight: 700,
                    color: config.color,
                  }}
                >
                  {config.label}
                </span>
                <span
                  style={{
                    fontSize: 'var(--fs-xs)',
                    color: 'var(--c-text-muted)',
                  }}
                >
                  {config.nextLabel}
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: 8,
                  background: 'var(--c-border)',
                  borderRadius: 'var(--r-full)',
                  overflow: 'hidden',
                }}
                role="progressbar"
                aria-valuenow={Math.round(progress * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={
                  '\u30EC\u30D9\u30EB\u30A2\u30C3\u30D7\u307E\u3067\u306E\u3057\u3093\u3061\u3087\u304F'
                }
              >
                <div
                  style={{
                    width: `${Math.round(progress * 100)}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${config.color}, ${LEVEL_CONFIG[level === 'beginner' ? 'intermediate' : 'advanced'].color})`,
                    borderRadius: 'var(--r-full)',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
          )}

          {/* Progress message */}
          {progressMsg && (
            <div
              style={{
                fontSize: 'var(--fs-xs)',
                fontWeight: 600,
                color: config.color,
                textAlign: 'center',
                marginBottom: 'var(--sp-3)',
                padding: 'var(--sp-2)',
                background: `${config.color}15`,
                borderRadius: 'var(--r-sm)',
              }}
            >
              {progressMsg}
            </div>
          )}

          {/* Level details */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--sp-2)',
            }}
          >
            {(
              Object.entries(LEVEL_CONFIG) as [
                ExperienceLevel,
                (typeof LEVEL_CONFIG)[ExperienceLevel],
              ][]
            ).map(([lvl, cfg]) => {
              const isCurrentOrPast =
                lvl === 'beginner' ||
                (lvl === 'intermediate' && (level === 'intermediate' || level === 'advanced')) ||
                (lvl === 'advanced' && level === 'advanced');
              const isCurrent = lvl === level;
              const detail = LEVEL_DETAILS[lvl];

              return (
                <div
                  key={lvl}
                  style={{
                    padding: 'var(--sp-2)',
                    borderRadius: 'var(--r-sm)',
                    border: isCurrent ? `2px solid ${cfg.color}` : '1px solid var(--c-border)',
                    opacity: isCurrentOrPast ? 1 : 0.5,
                    background: isCurrent ? `${cfg.color}10` : 'transparent',
                  }}
                >
                  <div
                    style={{
                      fontSize: 'var(--fs-xs)',
                      fontWeight: 700,
                      color: cfg.color,
                      marginBottom: 'var(--sp-half)',
                    }}
                  >
                    {cfg.emoji} {cfg.label}
                    {isCurrent && (
                      <span
                        style={{
                          marginLeft: 'var(--sp-1)',
                          fontSize: 'var(--fs-xs)',
                          color: 'var(--c-text-muted)',
                        }}
                      >
                        {'\u3044\u307E\u3053\u3053'}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--fs-xs)',
                      color: 'var(--c-text-sub)',
                      lineHeight: 1.3,
                    }}
                  >
                    {detail.description}
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--fs-xs)',
                      color: 'var(--c-text-muted)',
                      marginTop: 'var(--sp-half)',
                    }}
                  >
                    {detail.blocks}
                  </div>
                </div>
              );
            })}
          </div>

          {/* "ぜんぶみせて！" button - visible and inviting */}
          {!isMaxLevel && (
            <button
              type="button"
              onClick={() => {
                unlockAll();
                setPopoverOpen(false);
              }}
              style={{
                marginTop: 'var(--sp-3)',
                width: '100%',
                fontFamily: 'var(--font-main)',
                fontSize: 'var(--fs-xs)',
                fontWeight: 700,
                color: 'var(--c-text-inverse)',
                background: 'linear-gradient(135deg, var(--c-source), var(--c-preset))',
                border: 'none',
                borderRadius: 'var(--r-sm)',
                padding: 'var(--sp-2) var(--sp-3)',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                transition: 'filter 0.15s ease, transform 0.1s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(1.1)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = '';
                e.currentTarget.style.transform = '';
              }}
            >
              {'\u305C\u3093\u3076\u307F\u305B\u3066\uFF01'}
            </button>
          )}

          {/* Reset button when manually unlocked */}
          {manualUnlock && (
            <button
              type="button"
              onClick={() => {
                resetExperience();
                setPopoverOpen(false);
              }}
              style={{
                marginTop: 'var(--sp-2)',
                width: '100%',
                fontFamily: 'var(--font-main)',
                fontSize: 'var(--fs-xs)',
                fontWeight: 600,
                color: 'var(--c-text-muted)',
                background: 'transparent',
                border: '1px solid var(--c-border)',
                borderRadius: 'var(--r-sm)',
                padding: 'var(--sp-1) var(--sp-2)',
                cursor: 'pointer',
                transition: 'color 0.15s ease, border-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--c-text-sub)';
                e.currentTarget.style.borderColor = 'var(--c-text-muted)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--c-text-muted)';
                e.currentTarget.style.borderColor = 'var(--c-border)';
              }}
            >
              {'\u306F\u3058\u3081\u304B\u3089\u3084\u308A\u306A\u304A\u3059'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
