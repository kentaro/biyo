'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTrackStore } from '@/lib/stores/tracks';

interface Track {
  id: string;
  name: string;
  muted: boolean;
  solo: boolean;
  volume: number;
  workspaceXml: string;
}

interface TrackItemProps {
  track: Track;
  canDelete: boolean;
}

const TRACK_COLORS = [
  { border: 'var(--c-source)', bg: 'var(--c-track-0-bg)' },
  { border: 'var(--c-effect)', bg: 'var(--c-track-1-bg)' },
  { border: 'var(--c-preset)', bg: 'var(--c-track-2-bg)' },
  { border: 'var(--c-utility)', bg: 'var(--c-track-3-bg)' },
  { border: 'var(--c-rhythm)', bg: 'var(--c-track-4-bg)' },
];

export default function TrackItem({ track, canDelete }: TrackItemProps) {
  const activeTrackId = useTrackStore((s) => s.activeTrackId);
  const setActiveTrack = useTrackStore((s) => s.setActiveTrack);
  const toggleMute = useTrackStore((s) => s.toggleMute);
  const toggleSolo = useTrackStore((s) => s.toggleSolo);
  const setVolume = useTrackStore((s) => s.setVolume);
  const removeTrack = useTrackStore((s) => s.removeTrack);
  const renameTrack = useTrackStore((s) => s.renameTrack);

  const isActive = activeTrackId === track.id;
  const idx = parseInt(track.id.replace(/\D/g, ''), 10) || 0;
  const colors = TRACK_COLORS[idx % TRACK_COLORS.length];
  const [showVolTooltip, setShowVolTooltip] = useState(false);

  // Inline delete confirmation state
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startDeleteConfirm = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmingDelete(true);
    deleteTimerRef.current = setTimeout(() => {
      setConfirmingDelete(false);
    }, 3000);
  }, []);

  const confirmDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      setConfirmingDelete(false);
      removeTrack(track.id);
    },
    [removeTrack, track.id],
  );

  const cancelDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    setConfirmingDelete(false);
  }, []);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    };
  }, []);

  // Inline rename state
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(track.name);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus and select input text when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commitRename = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== track.name) {
      renameTrack(track.id, trimmed);
    } else {
      // Revert if empty or unchanged
      setEditValue(track.name);
    }
    setIsEditing(false);
  }, [editValue, track.id, track.name, renameTrack]);

  const cancelRename = useCallback(() => {
    setEditValue(track.name);
    setIsEditing(false);
  }, [track.name]);

  const handleNameDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditValue(track.name);
      setIsEditing(true);
    },
    [track.name],
  );

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        commitRename();
      } else if (e.key === 'Escape') {
        cancelRename();
      }
    },
    [commitRename, cancelRename],
  );

  return (
    <li
      onClick={() => setActiveTrack(track.id)}
      className="cursor-pointer transition-all animate-pop-in"
      aria-current={isActive ? 'true' : undefined}
      aria-label={`${track.name}${isActive ? ' (せんたくちゅう)' : ''}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setActiveTrack(track.id);
        }
      }}
      style={{
        padding: 'var(--sp-2)',
        borderRadius: 'var(--r-sm)',
        borderLeft: `3px solid ${isActive ? colors.border : 'transparent'}`,
        background: isActive ? colors.bg : 'var(--c-surface-alt)',
        boxShadow: isActive ? `var(--shadow-sm), 0 0 6px ${colors.border}33` : 'none',
      }}
    >
      {/* Name row */}
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: 'var(--sp-1)', gap: 'var(--sp-1)' }}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleInputKeyDown}
            onClick={(e) => e.stopPropagation()}
            maxLength={20}
            className="font-bold text-[var(--c-text)] min-w-0 flex-1 outline-none bg-white border-2 transition-colors"
            style={{
              fontSize: 'var(--fs-sm)',
              padding: '0 var(--sp-1)',
              borderRadius: 'var(--r-sm)',
              borderColor: colors.border,
              lineHeight: 1.6,
            }}
            aria-label="なまえをかえる"
          />
        ) : (
          // biome-ignore lint/a11y/noStaticElementInteractions: double-click to rename pattern
          <span
            className="font-bold text-[var(--c-text)] truncate cursor-text select-none"
            style={{ fontSize: 'var(--fs-sm)' }}
            onDoubleClick={handleNameDoubleClick}
            title="ダブルクリックでなまえをかえる"
          >
            {track.name}
          </span>
        )}
        {canDelete && !confirmingDelete && (
          <button
            type="button"
            onClick={startDeleteConfirm}
            className="shrink-0 rounded-[var(--r-full)] text-[var(--c-text-muted)] hover:text-[var(--c-error)] hover:bg-[var(--c-error)]/10 flex items-center justify-center transition-colors"
            style={{ width: 'var(--btn-sm)', height: 'var(--btn-sm)', fontSize: 'var(--fs-xs)' }}
            aria-label="このへやをけす"
          >
            ×
          </button>
        )}
        {canDelete && confirmingDelete && (
          <div
            className="flex items-center animate-fade-in"
            style={{ gap: 'var(--sp-1)', fontSize: 'var(--fs-xs)' }}
          >
            <span className="text-[var(--c-error)] font-bold whitespace-nowrap">
              ほんとうにけす？
            </span>
            <button
              type="button"
              onClick={confirmDelete}
              className="shrink-0 font-bold text-white rounded-[var(--r-sm)] transition-colors"
              style={{
                background: 'var(--c-error)',
                padding: '0 var(--sp-1)',
                height: 'var(--btn-sm)',
                fontSize: 'var(--fs-xs)',
              }}
              aria-label="けすことをかくにん"
            >
              はい
            </button>
            <button
              type="button"
              onClick={cancelDelete}
              className="shrink-0 font-bold text-[var(--c-text-muted)] rounded-[var(--r-sm)] transition-colors hover:bg-[var(--c-surface-alt)]"
              style={{
                background: 'var(--c-surface)',
                padding: '0 var(--sp-1)',
                height: 'var(--btn-sm)',
                fontSize: 'var(--fs-xs)',
                border: '1px solid var(--c-border)',
              }}
              aria-label="けすのをやめる"
            >
              やめる
            </button>
          </div>
        )}
      </div>

      {/* Controls row */}
      <div className="flex items-center" style={{ gap: 'var(--sp-1)' }}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleMute(track.id);
          }}
          className="font-black flex items-center justify-center transition-all"
          style={{
            width: 'var(--btn-sm)',
            height: 'var(--btn-sm)',
            borderRadius: 'var(--r-sm)',
            fontSize: 'var(--fs-xs)',
            background: track.muted ? 'var(--c-error)' : 'var(--c-surface-alt)',
            color: track.muted ? 'var(--c-text-inverse)' : 'var(--c-text-muted)',
            boxShadow: track.muted ? 'var(--shadow-sm)' : 'none',
          }}
          aria-label={track.muted ? 'おとをだす' : 'おとをけす'}
          aria-pressed={track.muted}
          title={track.muted ? 'おとをだす' : 'おとをけす'}
        >
          {track.muted ? '🔇' : '🔊'}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleSolo(track.id);
          }}
          className="font-black flex items-center justify-center transition-all"
          style={{
            width: 'var(--btn-sm)',
            height: 'var(--btn-sm)',
            borderRadius: 'var(--r-sm)',
            fontSize: 'var(--fs-xs)',
            background: track.solo ? 'var(--c-warn)' : 'var(--c-surface-alt)',
            color: track.solo ? 'var(--c-text-inverse)' : 'var(--c-text-muted)',
            boxShadow: track.solo ? 'var(--shadow-sm)' : 'none',
          }}
          aria-label={track.solo ? 'ぜんぶのおと' : 'このおとだけ'}
          aria-pressed={track.solo}
          title={track.solo ? 'ぜんぶのおと' : 'このおとだけ'}
        >
          {track.solo ? '⭐' : '☆'}
        </button>
        <div className="flex-1 relative">
          <input
            type="range"
            min={0}
            max={100}
            value={track.volume}
            onChange={(e) => {
              e.stopPropagation();
              setVolume(track.id, parseInt(e.target.value, 10));
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={() => setShowVolTooltip(true)}
            onMouseLeave={() => setShowVolTooltip(false)}
            onFocus={() => setShowVolTooltip(true)}
            onBlur={() => setShowVolTooltip(false)}
            className="w-full cursor-pointer"
            aria-label={`${track.name}のおおきさ`}
            aria-valuetext={`${track.volume}パーセント`}
          />
          {showVolTooltip && (
            <span
              className="absolute font-bold text-white bg-[var(--c-text)] rounded-[var(--r-sm)] pointer-events-none animate-fade-in"
              style={{
                fontSize: 'var(--fs-xs)',
                padding: '1px 6px',
                top: '-22px',
                left: `${track.volume}%`,
                transform: 'translateX(-50%)',
                whiteSpace: 'nowrap',
              }}
            >
              {track.volume}
            </span>
          )}
        </div>
      </div>
    </li>
  );
}
