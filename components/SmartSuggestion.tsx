'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTrackStore } from '@/lib/stores/tracks';
import {
  analyzeWorkspace,
  extractBlockTypesFromXml,
  type Suggestion,
} from '@/lib/suggestions/engine';

/**
 * SmartSuggestion - Context-aware compositional guidance
 *
 * Analyzes the current workspace blocks in real-time and suggests
 * what the user should add next, based on music theory rules.
 * Displays up to 2 floating pill suggestions below the toolbar.
 */
export default function SmartSuggestion() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [visible, setVisible] = useState<string[]>([]);
  const [exiting, setExiting] = useState<Set<string>>(new Set());
  const prevIdsRef = useRef<string>('');

  const tracks = useTrackStore((s) => s.tracks);
  const activeTrackId = useTrackStore((s) => s.activeTrackId);
  const appendWorkspaceXml = useTrackStore((s) => s.appendWorkspaceXml);
  const addTrack = useTrackStore((s) => s.addTrack);

  // Analyze workspace whenever the active track's XML changes
  useEffect(() => {
    const activeTrack = tracks.find((t) => t.id === activeTrackId);
    const xml = activeTrack?.workspaceXml ?? '';
    const blockTypes = extractBlockTypesFromXml(xml);
    const newSuggestions = analyzeWorkspace(blockTypes);

    const newIds = newSuggestions.map((s) => s.id).join(',');
    if (newIds === prevIdsRef.current) return;
    prevIdsRef.current = newIds;

    // Mark departing suggestions for exit animation
    const newIdSet = new Set(newSuggestions.map((s) => s.id));
    const departingIds = visible.filter((id) => !newIdSet.has(id));

    if (departingIds.length > 0) {
      setExiting(new Set(departingIds));
      // After exit animation, swap in new suggestions
      setTimeout(() => {
        setSuggestions(newSuggestions);
        setVisible(newSuggestions.map((s) => s.id));
        setExiting(new Set());
      }, 250);
    } else {
      setSuggestions(newSuggestions);
      setVisible(newSuggestions.map((s) => s.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks, activeTrackId, visible.filter]);

  const handleClick = useCallback(
    (suggestion: Suggestion) => {
      if (suggestion.blockType === '__new_track__') {
        addTrack();
        return;
      }
      if (suggestion.xml) {
        appendWorkspaceXml(suggestion.xml);
      }
    },
    [appendWorkspaceXml, addTrack],
  );

  if (suggestions.length === 0) return null;

  return (
    <nav
      style={{
        position: 'absolute',
        top: 'calc(var(--toolbar-h) + var(--sp-2))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 'var(--sp-2)',
        pointerEvents: 'none',
        maxWidth: '95vw',
      }}
      aria-label="おすすめ"
    >
      {suggestions.map((s) => {
        const isExiting = exiting.has(s.id);
        const isNew = !exiting.has(s.id) && visible.includes(s.id);

        return (
          <button
            type="button"
            key={s.id}
            onClick={() => handleClick(s)}
            title={s.reason}
            aria-label={`${s.label} - ${s.reason}`}
            style={{
              pointerEvents: 'auto',
              fontFamily: 'var(--font-main)',
              fontSize: 'var(--fs-xs)',
              fontWeight: 700,
              color: 'var(--c-text-inverse)',
              background: 'linear-gradient(135deg, var(--c-preset), var(--c-effect))',
              border: 'none',
              borderRadius: 'var(--r-full)',
              padding: 'var(--sp-1) var(--sp-3)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: 'var(--shadow-suggestion)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--sp-1)',
              animation: isExiting
                ? 'suggestion-exit 0.25s ease-in forwards'
                : isNew
                  ? 'suggestion-enter 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both'
                  : undefined,
              transition: 'transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.04)';
              e.currentTarget.style.boxShadow = 'var(--shadow-suggestion-hover)';
              e.currentTarget.style.filter = 'brightness(1.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = 'var(--shadow-suggestion)';
              e.currentTarget.style.filter = '';
            }}
          >
            <span style={{ fontSize: 'var(--fs-sm)', lineHeight: 1 }} aria-hidden="true">
              {s.emoji}
            </span>
            <span>{s.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
