'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import Achievements from '@/components/Achievements';
import { getWorkspace } from '@/components/BlockEditor';
import CodePreview from '@/components/CodePreview';
import DrawerToggle from '@/components/DrawerToggle';
import EmojiReaction from '@/components/EmojiReaction';
import KeyboardShortcutsHelp from '@/components/KeyboardShortcutsHelp';
import ResizeHandle from '@/components/ResizeHandle';
import SampleBrowser from '@/components/SampleBrowser';
import SmartSuggestion from '@/components/SmartSuggestion';
import StatusBar from '@/components/StatusBar';
import Toolbar from '@/components/Toolbar';
import TrackPanel from '@/components/TrackPanel';
import TutorialOverlay from '@/components/TutorialOverlay';
import WaveformMonitor from '@/components/WaveformMonitor';
import WelcomeOverlay from '@/components/WelcomeOverlay';
import { audioEngine } from '@/lib/audio/engine';
import { useResizableLayout } from '@/lib/hooks/useResizableLayout';
import { getSample } from '@/lib/samples';
import { decodeWorkspace } from '@/lib/sharing/url-codec';
import { useCompileStore } from '@/lib/stores/compile';
import { useExperienceStore } from '@/lib/stores/experience';
import { usePlaybackStore } from '@/lib/stores/playback';
import { useTrackStore } from '@/lib/stores/tracks';

const BlockEditor = dynamic(() => import('@/components/BlockEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full rounded-[var(--r-md)] bg-[var(--c-surface-blockly)] border border-[var(--c-border)]">
      <span className="text-[var(--c-text-muted)] text-[var(--fs-md)] font-bold">
        じゅんびしているよ...
      </span>
    </div>
  ),
});

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

export default function Home() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [sampleBrowserOpen, setSampleBrowserOpen] = useState(false);
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const {
    sidebarWidth,
    bottomHeight,
    resizeSidebar,
    resizeBottom,
    persistSizes,
    resetSidebar,
    resetBottom,
  } = useResizableLayout();

  const { isPlaying, setIsPlaying, setBpm } = usePlaybackStore();
  const { generatedCode } = useCompileStore();
  const appendWorkspaceXml = useTrackStore((s) => s.appendWorkspaceXml);
  const loadWorkspaceXml = useTrackStore((s) => s.loadWorkspaceXml);

  const toggleDrawer = useCallback(() => {
    setDrawerOpen((prev) => !prev);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const handleWelcomeDismiss = useCallback(() => {
    setShowWelcome(false);
  }, []);

  const handleTutorialStart = useCallback(() => {
    setShowWelcome(false);
    setShowTutorial(true);
  }, []);

  const handleTutorialDismiss = useCallback(() => {
    setShowTutorial(false);
  }, []);

  const handleLoadSample = useCallback(
    (sampleKey: string) => {
      setShowWelcome(false);
      const xml = getSample(sampleKey);
      if (xml) {
        appendWorkspaceXml(xml);
      }
    },
    [appendWorkspaceXml],
  );

  // Track creation -> experience system
  const incrementTracksCreated = useExperienceStore((s) => s.incrementTracksCreated);

  // Detect when a new track is added (track count increases)
  useEffect(() => {
    const unsub = useTrackStore.subscribe((state, prevState) => {
      if (state.tracks.length > prevState.tracks.length) {
        incrementTracksCreated();
      }
    });
    return unsub;
  }, [incrementTracksCreated]);

  // Audio init
  useEffect(() => {
    audioEngine.init();
  }, []);

  // Load shared workspace from URL hash on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || !hash.includes('share=')) return;

    const data = decodeWorkspace(hash);
    if (data) {
      // Load the shared workspace
      loadWorkspaceXml(data.xml);
      setBpm(data.bpm);

      // Dismiss welcome overlay since we're loading shared content
      setShowWelcome(false);

      // Show confirmation message
      setShareMessage('ともだちのおんがくをよみこんだよ！');
      setTimeout(() => setShareMessage(null), 3000);

      // Clean the hash from URL without triggering navigation
      if (window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, [loadWorkspaceXml, setBpm]);

  // Live coding: auto-recompile when code changes during playback
  useEffect(() => {
    if (!isPlaying || !generatedCode) return;
    const mergedCode = useCompileStore.getState().getMergedCode();
    audioEngine.compile(mergedCode).catch(() => {
      // compile error handled by store
    });
  }, [generatedCode, isPlaying]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const isMod = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl+S: Save project (prevent browser save dialog)
      if (isMod && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        // Trigger save by dispatching a custom event that Toolbar listens to
        window.dispatchEvent(new CustomEvent('biyo:save'));
        return;
      }

      // Cmd/Ctrl+Z: Undo (delegate to Blockly workspace)
      if (isMod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        getWorkspace()?.undo(false);
        return;
      }

      // Cmd/Ctrl+Shift+Z: Redo (delegate to Blockly workspace)
      if (isMod && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        getWorkspace()?.undo(true);
        return;
      }

      // Cmd/Ctrl+Y: Redo (alternative shortcut)
      if (isMod && e.key === 'y') {
        e.preventDefault();
        getWorkspace()?.undo(true);
        return;
      }

      switch (e.code) {
        case 'Space': {
          e.preventDefault();
          if (isPlaying) {
            audioEngine.stop();
            setIsPlaying(false);
          } else {
            const mergedCode = useCompileStore.getState().getMergedCode();
            audioEngine
              .compile(mergedCode)
              .then(() => {
                audioEngine.play();
                setIsPlaying(true);
              })
              .catch(() => {
                // compile error handled by store
              });
          }
          break;
        }
        case 'Escape': {
          // Close keyboard shortcuts help if open
          if (shortcutsHelpOpen) {
            setShortcutsHelpOpen(false);
            break;
          }
          // Close drawer on mobile
          if (isMobile && drawerOpen) {
            closeDrawer();
          }
          break;
        }
      }

      // ? key: Toggle keyboard shortcuts help
      if (e.key === '?' || (e.shiftKey && e.code === 'Slash')) {
        e.preventDefault();
        setShortcutsHelpOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isPlaying,
    setIsPlaying,
    generatedCode,
    isMobile,
    drawerOpen,
    closeDrawer,
    shortcutsHelpOpen,
  ]);

  return (
    <div
      className="h-[100dvh] flex flex-col bg-[var(--c-bg)]"
      style={{ height: '100dvh', position: 'relative' }}
      role="application"
      aria-label="biyo おんがくをつくるアプリ"
    >
      {/* Skip nav target */}
      <div id="main-content" tabIndex={-1} style={{ outline: 'none' }} />
      {/* Toolbar */}
      <div className="shrink-0" style={{ height: 'var(--toolbar-h)' }}>
        <Toolbar onOpenSamples={() => setSampleBrowserOpen(true)} />
      </div>

      {/* Smart Suggestion pills - context-aware compositional guidance */}
      <SmartSuggestion />

      {/* Main: Editor + Sidebar */}
      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 min-w-0 p-[var(--sp-2)]">
          <BlockEditor />
        </div>

        {/* Desktop: vertical resize handle + sidebar */}
        {!isMobile && (
          <>
            <ResizeHandle
              direction="horizontal"
              onResize={resizeSidebar}
              onResizeEnd={persistSizes}
              onDoubleClick={resetSidebar}
            />
            <div className="shrink-0" style={{ width: sidebarWidth }}>
              <TrackPanel />
            </div>
          </>
        )}
      </div>

      {/* Desktop: horizontal resize handle between main and bottom */}
      {!isMobile && (
        <ResizeHandle
          direction="vertical"
          onResize={resizeBottom}
          onResizeEnd={persistSizes}
          onDoubleClick={resetBottom}
        />
      )}

      {/* Bottom: Waveform + Code */}
      <div
        className="shrink-0 flex border-t border-[var(--c-border)]"
        style={{ height: isMobile ? 'var(--bottom-h)' : bottomHeight }}
      >
        <div className="flex-1 min-w-0 p-[var(--sp-2)]">
          <WaveformMonitor />
        </div>
        {!isMobile && (
          <div className="shrink-0 p-[var(--sp-2)]" style={{ width: sidebarWidth }}>
            <CodePreview />
          </div>
        )}
      </div>

      {/* Mobile bottom: Code inline under waveform */}
      {isMobile && (
        <div
          className="shrink-0 border-t border-[var(--c-border)] p-[var(--sp-1)]"
          style={{ maxHeight: '72px', overflowY: 'auto', overflowX: 'hidden' }}
        >
          <CodePreview />
        </div>
      )}

      {/* Status Bar */}
      <div className="shrink-0" style={{ height: 'var(--statusbar-h)' }}>
        <StatusBar />
      </div>

      {/* Mobile: Drawer overlay + panel */}
      {isMobile && (
        <>
          <div
            className={`drawer-overlay ${drawerOpen ? 'open' : ''}`}
            onClick={closeDrawer}
            aria-hidden="true"
          />
          <div className={`drawer-panel ${drawerOpen ? 'open' : ''}`}>
            <TrackPanel />
          </div>
          <DrawerToggle isOpen={drawerOpen} onToggle={toggleDrawer} />
        </>
      )}

      {/* Welcome overlay for first-time visitors */}
      {showWelcome && (
        <WelcomeOverlay
          onDismiss={handleWelcomeDismiss}
          onLoadSample={handleLoadSample}
          onTutorial={handleTutorialStart}
        />
      )}

      {/* Tutorial overlay */}
      {showTutorial && (
        <TutorialOverlay
          onDismiss={handleTutorialDismiss}
          onOpenSamples={() => {
            setShowTutorial(false);
            setSampleBrowserOpen(true);
          }}
        />
      )}

      {/* Sample browser */}
      <SampleBrowser
        open={sampleBrowserOpen}
        onClose={() => setSampleBrowserOpen(false)}
        onLoadSample={handleLoadSample}
      />

      {/* Emoji reactions on play */}
      <EmojiReaction />

      {/* Achievements system */}
      <Achievements />

      {/* Keyboard shortcuts help popup */}
      <KeyboardShortcutsHelp open={shortcutsHelpOpen} onClose={() => setShortcutsHelpOpen(false)} />

      {/* Share load notification */}
      {shareMessage && (
        <output
          style={{
            position: 'fixed',
            top: 'var(--sp-4)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10000,
            background: 'linear-gradient(135deg, var(--c-preset), var(--c-source))',
            color: 'var(--c-text-inverse)',
            borderRadius: 'var(--r-lg)',
            padding: 'var(--sp-3) var(--sp-6)',
            fontSize: 'var(--fs-md)',
            fontWeight: 700,
            fontFamily: 'var(--font-main)',
            boxShadow: 'var(--shadow-lg)',
            animation: 'pop-in 0.3s ease-out',
            pointerEvents: 'none',
          }}
          aria-live="polite"
        >
          {shareMessage}
        </output>
      )}
    </div>
  );
}
