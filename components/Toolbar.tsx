'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { audioEngine } from '@/lib/audio/engine';
import { useCompileStore } from '@/lib/stores/compile';
import { usePlaybackStore } from '@/lib/stores/playback';
import type { SavedProject } from '@/lib/stores/projects';
import { useTrackStore } from '@/lib/stores/tracks';
import BeatIndicator from './BeatIndicator';
import { getWorkspace } from './BlockEditor';
import ExportDialog from './ExportDialog';
import SaveDialog from './SaveDialog';
import ShareButton from './ShareButton';
import SurpriseButton from './SurpriseButton';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)');
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isMobile;
}

interface ToolbarProps {
  onOpenSamples?: () => void;
}

/** Animated mini equalizer bars shown next to play button when playing */
function MiniEqualizer() {
  return (
    <div className="flex items-end" style={{ gap: 2, height: 18, width: 16 }} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 3,
            borderRadius: 2,
            background: 'var(--c-text-inverse)',
            animationName: 'eq-bounce',
            animationDuration: `${0.4 + i * 0.15}s`,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationDirection: 'alternate',
            animationDelay: `${i * 0.1}s`,
            height: '40%',
          }}
        />
      ))}
    </div>
  );
}

export default function Toolbar({ onOpenSamples }: ToolbarProps) {
  const { isPlaying, setIsPlaying } = usePlaybackStore();
  const { generatedCode, status } = useCompileStore();
  const [saveOpen, setSaveOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const menuRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  // Listen for Cmd/Ctrl+S save shortcut from page-level keyboard handler
  useEffect(() => {
    const handleSaveShortcut = () => {
      setSaveOpen(true);
    };
    window.addEventListener('biyo:save', handleSaveShortcut);
    return () => window.removeEventListener('biyo:save', handleSaveShortcut);
  }, []);

  // Close overflow menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        menuBtnRef.current &&
        !menuBtnRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const handlePlay = async () => {
    if (isPlaying) return;
    try {
      await audioEngine.compile(generatedCode);
      audioEngine.play();
      setIsPlaying(true);
    } catch {
      // handled by store
    }
  };

  const handleStop = () => {
    audioEngine.stop();
    setIsPlaying(false);
  };

  const handleLoadProject = (project: SavedProject) => {
    const store = useTrackStore.getState();
    const playback = usePlaybackStore.getState();

    // Restore BPM
    playback.setBpm(project.bpm);

    // Restore tracks with their original IDs (timestamp-based, no collision)
    const loadedTracks = project.tracks;
    useTrackStore.setState({
      tracks: loadedTracks,
      activeTrackId: loadedTracks.length > 0 ? loadedTracks[0].id : store.activeTrackId,
      workspaceVersion: store.workspaceVersion + 1,
    });
  };

  // Button style for toolbar actions
  const toolBtnStyle: React.CSSProperties = {
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
  };

  return (
    <>
      <div
        className="flex items-center h-full bg-[var(--c-surface)] border-b border-[var(--c-border)]"
        style={{
          padding: isMobile ? '0 var(--sp-2)' : '0 var(--sp-4)',
          gap: isMobile ? 'var(--sp-2)' : 'var(--sp-3)',
        }}
        role="toolbar"
        aria-label="ツールバー"
      >
        {/* Logo */}
        <h1
          className="font-black tracking-tight bg-gradient-to-r from-[var(--c-source)] via-[var(--c-preset)] to-[var(--c-effect)] bg-clip-text text-transparent select-none animate-rainbow"
          style={{ fontSize: 'var(--fs-xl)' }}
        >
          biyo
        </h1>

        {/* Transport */}
        <div
          className="flex items-center"
          style={{ gap: 'var(--sp-2)', marginLeft: 'var(--sp-2)' }}
        >
          <button
            type="button"
            onClick={handlePlay}
            disabled={isPlaying}
            className={`rounded-[var(--r-full)] bg-[var(--c-ok)] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all active:scale-90 ${isPlaying ? 'animate-play-glow' : 'animate-invite-bounce'}`}
            style={{
              width: 'var(--btn-lg)',
              height: 'var(--btn-lg)',
              fontSize: 'var(--fs-lg)',
              boxShadow: 'var(--shadow-btn)',
              gap: 4,
            }}
            aria-label="おんがくをならす"
          >
            ▶{isPlaying && <MiniEqualizer />}
          </button>
          <button
            type="button"
            onClick={handleStop}
            disabled={!isPlaying}
            className="rounded-[var(--r-full)] bg-[var(--c-error)] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all active:scale-90"
            style={{
              width: 'var(--btn-lg)',
              height: 'var(--btn-lg)',
              fontSize: 'var(--fs-lg)',
              boxShadow: 'var(--shadow-btn)',
            }}
            aria-label="おんがくをとめる"
            onMouseEnter={(e) => {
              e.currentTarget.style.animation = 'subtle-shake 0.3s ease-in-out';
            }}
            onAnimationEnd={(e) => {
              e.currentTarget.style.animation = '';
            }}
          >
            ⏹
          </button>
          <BeatIndicator />
        </div>

        {/* Undo / Redo / Clear -- hidden on mobile, moved to overflow menu */}
        {!isMobile && (
          <div
            className="flex items-center"
            style={{ gap: 'var(--sp-1)', marginLeft: 'var(--sp-2)' }}
          >
            <button
              type="button"
              onClick={() => getWorkspace()?.undo(false)}
              style={{
                ...toolBtnStyle,
                padding: 'var(--sp-1) var(--sp-2)',
                fontSize: 'var(--fs-md)',
              }}
              aria-label="もどす"
              title="もどす"
            >
              ↩
            </button>
            <button
              type="button"
              onClick={() => getWorkspace()?.undo(true)}
              style={{
                ...toolBtnStyle,
                padding: 'var(--sp-1) var(--sp-2)',
                fontSize: 'var(--fs-md)',
              }}
              aria-label="やりなおす"
              title="やりなおす"
            >
              ↪
            </button>
            <button
              type="button"
              onClick={() => {
                const ws = getWorkspace();
                if (ws && ws.getTopBlocks(false).length > 0) {
                  ws.clear();
                }
              }}
              style={{
                ...toolBtnStyle,
                padding: 'var(--sp-1) var(--sp-2)',
                fontSize: 'var(--fs-md)',
              }}
              aria-label="ぜんぶけす"
              title="ぜんぶけす"
            >
              🗑
            </button>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Save / Export / Samples / Surprise buttons */}
        {!isMobile ? (
          <div className="flex items-center" style={{ gap: 'var(--sp-2)' }}>
            <SurpriseButton />
            {onOpenSamples && (
              <button
                type="button"
                onClick={onOpenSamples}
                style={{
                  ...toolBtnStyle,
                  color: 'var(--c-text-inverse)',
                  background: 'linear-gradient(135deg, var(--c-effect), var(--c-note))',
                  border: 'none',
                }}
                aria-label="おてほんをみる"
              >
                おてほん
              </button>
            )}
            <ShareButton />
            <button
              type="button"
              onClick={() => setSaveOpen(true)}
              style={toolBtnStyle}
              aria-label="つくったおんがくをほぞん"
            >
              ほぞん
            </button>
            <button
              type="button"
              onClick={() => setExportOpen(true)}
              style={{
                ...toolBtnStyle,
                color: 'var(--c-text-inverse)',
                background: 'linear-gradient(135deg, var(--c-source), var(--c-preset))',
                border: 'none',
              }}
              aria-label="おんがくをほぞん"
            >
              ろくおん
            </button>
          </div>
        ) : (
          /* Mobile: overflow menu */
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              ref={menuBtnRef}
              onClick={() => setMenuOpen((prev) => !prev)}
              style={{
                ...toolBtnStyle,
                padding: 'var(--sp-2)',
                fontSize: 'var(--fs-md)',
                lineHeight: 1,
                minWidth: 44,
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="メニューをひらく"
              aria-expanded={menuOpen}
              aria-haspopup="true"
            >
              &#x22EF;
            </button>
            {menuOpen && (
              <div
                ref={menuRef}
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 'var(--sp-1)',
                  background: 'var(--c-surface)',
                  border: '1px solid var(--c-border)',
                  borderRadius: 'var(--r-sm)',
                  boxShadow: 'var(--shadow-md)',
                  zIndex: 200,
                  minWidth: 180,
                  maxHeight: '80vh',
                  overflowY: 'auto',
                  padding: 'var(--sp-1) 0',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                role="menu"
              >
                {/* Undo / Redo / Clear on mobile */}
                <div
                  style={{
                    display: 'flex',
                    gap: 'var(--sp-1)',
                    padding: 'var(--sp-2) var(--sp-3)',
                    borderBottom: '1px solid var(--c-border-light)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      getWorkspace()?.undo(false);
                      closeMenu();
                    }}
                    style={{
                      ...toolBtnStyle,
                      padding: 'var(--sp-2)',
                      fontSize: 'var(--fs-md)',
                      flex: 1,
                      textAlign: 'center',
                      minWidth: 44,
                      minHeight: 44,
                    }}
                    role="menuitem"
                    aria-label="もどす"
                  >
                    ↩
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      getWorkspace()?.undo(true);
                      closeMenu();
                    }}
                    style={{
                      ...toolBtnStyle,
                      padding: 'var(--sp-2)',
                      fontSize: 'var(--fs-md)',
                      flex: 1,
                      textAlign: 'center',
                      minWidth: 44,
                      minHeight: 44,
                    }}
                    role="menuitem"
                    aria-label="やりなおす"
                  >
                    ↪
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const ws = getWorkspace();
                      if (ws && ws.getTopBlocks(false).length > 0) {
                        ws.clear();
                      }
                      closeMenu();
                    }}
                    style={{
                      ...toolBtnStyle,
                      padding: 'var(--sp-2)',
                      fontSize: 'var(--fs-md)',
                      flex: 1,
                      textAlign: 'center',
                      minWidth: 44,
                      minHeight: 44,
                    }}
                    role="menuitem"
                    aria-label="ぜんぶけす"
                  >
                    🗑
                  </button>
                </div>
                <div style={{ padding: 'var(--sp-1) var(--sp-2)' }}>
                  <SurpriseButton />
                </div>
                {onOpenSamples && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenSamples();
                      closeMenu();
                    }}
                    style={{
                      ...toolBtnStyle,
                      border: 'none',
                      borderRadius: 0,
                      boxShadow: 'none',
                      width: '100%',
                      textAlign: 'left',
                      padding: 'var(--sp-3)',
                      background: 'transparent',
                      minHeight: 44,
                    }}
                    role="menuitem"
                  >
                    おてほん
                  </button>
                )}
                <div style={{ padding: 'var(--sp-1) var(--sp-2)' }}>
                  <ShareButton />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSaveOpen(true);
                    closeMenu();
                  }}
                  style={{
                    ...toolBtnStyle,
                    border: 'none',
                    borderRadius: 0,
                    boxShadow: 'none',
                    width: '100%',
                    textAlign: 'left',
                    padding: 'var(--sp-3)',
                    background: 'transparent',
                    minHeight: 44,
                  }}
                  role="menuitem"
                >
                  ほぞん
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExportOpen(true);
                    closeMenu();
                  }}
                  style={{
                    ...toolBtnStyle,
                    border: 'none',
                    borderRadius: 0,
                    boxShadow: 'none',
                    width: '100%',
                    textAlign: 'left',
                    padding: 'var(--sp-3)',
                    background: 'transparent',
                    minHeight: 44,
                  }}
                  role="menuitem"
                >
                  ろくおん
                </button>
              </div>
            )}
          </div>
        )}

        {/* Status pill - child-friendly */}
        <output
          className="flex items-center rounded-[var(--r-full)] bg-[var(--c-surface-alt)]"
          style={{
            gap: 'var(--sp-1)',
            padding: isMobile ? 'var(--sp-1)' : 'var(--sp-1) var(--sp-3)',
          }}
          aria-live="polite"
          aria-label="じょうたい"
        >
          <span
            className={`rounded-full ${status === 'ready' ? 'bg-[var(--c-ok)]' : status === 'compiling' ? 'bg-[var(--c-warn)] animate-status-pulse' : 'bg-[var(--c-error)]'}`}
            style={{ width: 8, height: 8 }}
            aria-hidden="true"
          />
          {!isMobile && (
            <span
              className="font-bold text-[var(--c-text-sub)]"
              style={{ fontSize: 'var(--fs-xs)' }}
            >
              {status === 'ready'
                ? 'じゅんびOK！'
                : status === 'compiling'
                  ? 'つくっているよ...'
                  : 'あれ？もういちどためしてね'}
            </span>
          )}
        </output>
      </div>

      {/* Dialogs */}
      <SaveDialog
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        onLoadProject={handleLoadProject}
      />
      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} projectName="biyo" />
    </>
  );
}
