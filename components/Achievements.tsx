'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePlaybackStore } from '@/lib/stores/playback';
import { useProjectStore } from '@/lib/stores/projects';
import { useTrackStore } from '@/lib/stores/tracks';

const STORAGE_KEY = 'biyo_achievements';

interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: 'first_play',
    name: 'はじめてのおと',
    description: 'はじめておとをならしたよ！',
    icon: '\uD83C\uDFB5',
  },
  {
    id: 'mix_master',
    name: 'まぜまぜじょうず',
    description: '3つのブロックをつなげたよ！',
    icon: '\uD83C\uDFA8',
  },
  {
    id: 'preset_explorer',
    name: 'おたのしみブロックめいじん',
    description: 'おたのしみブロックをつかったよ！',
    icon: '\uD83D\uDD2D',
  },
  {
    id: 'effect_master',
    name: 'へんしんめいじん',
    description: '3つのちがうへんしんブロックをつかったよ！',
    icon: '\u2728',
  },
  {
    id: 'musician',
    name: 'おんがくか',
    description: '5かいほぞんしたよ！',
    icon: '\uD83C\uDFBC',
  },
];

const PRESET_TYPES = new Set([
  'biyo_robot_voice',
  'biyo_space',
  'biyo_water_drop',
  'biyo_ghost',
  'biyo_siren',
  'biyo_laser',
  'biyo_ufo',
  'biyo_bubbles',
  'biyo_thunder',
  'biyo_famicom',
  'biyo_clap',
  'biyo_snare',
]);

const EFFECT_TYPES = new Set([
  'biyo_lowpass',
  'biyo_highpass',
  'biyo_bandpass',
  'biyo_delay',
  'biyo_pingpong',
  'biyo_reverb',
  'biyo_tremolo',
  'biyo_autowah',
  'biyo_vibrato',
  'biyo_distortion',
  'biyo_gain_up',
  'biyo_gain_down',
  'biyo_telephone',
]);

function loadUnlocked(): Set<string> {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return new Set(JSON.parse(data));
    }
  } catch {
    // ignore
  }
  return new Set();
}

function saveUnlocked(unlocked: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...unlocked]));
}

function getSaveCount(): number {
  try {
    const data = localStorage.getItem('biyo_projects');
    if (data) {
      const projects = JSON.parse(data);
      return Array.isArray(projects) ? projects.length : 0;
    }
  } catch {
    // ignore
  }
  return 0;
}

function getBlockTypesFromXml(xml: string): Set<string> {
  const types = new Set<string>();
  const regex = /type="(biyo_\w+)"/g;
  let m: RegExpExecArray | null = regex.exec(xml);
  while (m !== null) {
    types.add(m[1]);
    m = regex.exec(xml);
  }
  return types;
}

/** Count total block instances (not unique types) in workspace XML. */
function getBlockCountFromXml(xml: string): number {
  const matches = xml.match(/type="biyo_\w+"/g);
  return matches ? matches.length : 0;
}

export default function Achievements() {
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [panelOpen, setPanelOpen] = useState(false);
  const [notification, setNotification] = useState<AchievementDef | null>(null);
  const notifTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const tracks = useTrackStore((s) => s.tracks);
  const activeTrackId = useTrackStore((s) => s.activeTrackId);

  // Load unlocked achievements from localStorage on mount
  useEffect(() => {
    setUnlocked(loadUnlocked());
  }, []);

  const unlock = useCallback((id: string) => {
    setUnlocked((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      saveUnlocked(next);

      // Show notification
      const def = ACHIEVEMENT_DEFS.find((a) => a.id === id);
      if (def) {
        setNotification(def);
        if (notifTimeoutRef.current) clearTimeout(notifTimeoutRef.current);
        notifTimeoutRef.current = setTimeout(() => setNotification(null), 3000);
      }

      return next;
    });
  }, []);

  // Check achievements when play state changes
  const prevPlayingRef = useRef(false);
  useEffect(() => {
    if (isPlaying && !prevPlayingRef.current) {
      // First play
      unlock('first_play');

      // Check blocks in active track
      const track = tracks.find((t) => t.id === activeTrackId);
      if (track?.workspaceXml) {
        const types = getBlockTypesFromXml(track.workspaceXml);
        const blockCount = getBlockCountFromXml(track.workspaceXml);

        // 3+ blocks total in workspace
        if (blockCount >= 3) {
          unlock('mix_master');
        }

        // Preset used
        for (const t of types) {
          if (PRESET_TYPES.has(t)) {
            unlock('preset_explorer');
            break;
          }
        }

        // 3+ different effects
        let effectCount = 0;
        for (const t of types) {
          if (EFFECT_TYPES.has(t)) effectCount++;
        }
        if (effectCount >= 3) {
          unlock('effect_master');
        }
      }

      // Check save count
      if (getSaveCount() >= 5) {
        unlock('musician');
      }
    }
    prevPlayingRef.current = isPlaying;
  }, [isPlaying, tracks, activeTrackId, unlock]);

  // Check save-count-based achievement whenever project list changes
  const projectCount = useProjectStore((s) => s.projects.length);
  useEffect(() => {
    if (projectCount >= 5) {
      unlock('musician');
    }
  }, [projectCount, unlock]);

  // Focus trap and Escape key for achievement panel
  useEffect(() => {
    if (!panelOpen) return;
    previousFocusRef.current = document.activeElement as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPanelOpen(false);
        return;
      }
      if (e.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
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
      () => panelRef.current?.querySelector<HTMLElement>('button')?.focus(),
      50,
    );

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [panelOpen]);

  // Clean up notification timeout on unmount
  useEffect(() => {
    return () => {
      if (notifTimeoutRef.current) {
        clearTimeout(notifTimeoutRef.current);
        notifTimeoutRef.current = null;
      }
    };
  }, []);

  // Dismiss notification toast when clicking outside it
  useEffect(() => {
    if (!notification) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (toastRef.current && !toastRef.current.contains(e.target as Node)) {
        setNotification(null);
        if (notifTimeoutRef.current) {
          clearTimeout(notifTimeoutRef.current);
          notifTimeoutRef.current = null;
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notification]);

  return (
    <>
      {/* Achievement badge button in toolbar */}
      <button
        type="button"
        onClick={() => setPanelOpen((v) => !v)}
        className="achievement-badge-btn"
        aria-label="バッジをみる"
        aria-expanded={panelOpen}
        style={{
          fontFamily: 'var(--font-main)',
          fontSize: 'var(--fs-xs)',
          fontWeight: 700,
          color: 'var(--c-text)',
          background: 'var(--c-surface-alt)',
          border: '1px solid var(--c-border)',
          borderRadius: 'var(--r-sm)',
          padding: 'var(--sp-1) var(--sp-3)',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          boxShadow: 'var(--shadow-sm)',
          position: 'relative',
          minWidth: 44,
          minHeight: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {'\uD83C\uDFC5'} {unlocked.size}/{ACHIEVEMENT_DEFS.length}
      </button>

      {/* Achievement notification toast */}
      {notification && (
        <div ref={toastRef} className="achievement-toast animate-pop-in" role="alert">
          <div className="achievement-toast-icon">{notification.icon}</div>
          <div>
            <div className="achievement-toast-title">{notification.name}</div>
            <div className="achievement-toast-desc">{notification.description}</div>
          </div>
        </div>
      )}

      {/* Achievement panel overlay */}
      {panelOpen && (
        <>
          <div
            className="achievement-overlay"
            onClick={() => setPanelOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={panelRef}
            className="achievement-panel animate-pop-in"
            role="dialog"
            aria-modal="true"
            aria-label="バッジいちらん"
          >
            <div className="achievement-panel-header">
              <h2 className="achievement-panel-title">{'\uD83C\uDFC5'} バッジ</h2>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="achievement-panel-close"
                aria-label="とじる"
              >
                {'\u2715'}
              </button>
            </div>
            <div className="achievement-panel-list">
              {ACHIEVEMENT_DEFS.map((def) => {
                const isUnlocked = unlocked.has(def.id);
                return (
                  <div
                    key={def.id}
                    className={`achievement-item ${isUnlocked ? 'achievement-unlocked' : 'achievement-locked'}`}
                  >
                    <div className="achievement-item-icon">
                      {isUnlocked ? def.icon : '\uD83D\uDD12'}
                    </div>
                    <div>
                      <div className="achievement-item-name">{def.name}</div>
                      <div className="achievement-item-desc">
                        {isUnlocked ? def.description : '???'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
