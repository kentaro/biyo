'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { audioEngine } from '@/lib/audio/engine';
import { type RecordingState, recordFromNode } from '@/lib/audio/recorder';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  projectName: string;
}

export default function ExportDialog({ open, onClose, projectName }: ExportDialogProps) {
  const [duration, setDuration] = useState(10);
  const [recording, setRecording] = useState<RecordingState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const cancelRef = useRef<(() => void) | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleCancel = useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current();
      cancelRef.current = null;
    }
    setRecording(null);
  }, []);

  const handleClose = useCallback(() => {
    handleCancel();
    setDone(false);
    setError(null);
    onClose();
  }, [handleCancel, onClose]);

  // Focus trap and Escape key
  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !recording) {
        handleClose();
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
  }, [open, recording, handleClose]);

  const handleRecord = useCallback(async () => {
    setError(null);
    setDone(false);

    const ctx = audioEngine.getAudioContext();
    const analyser = audioEngine.getAnalyser();

    if (!ctx || !analyser) {
      setError('さきにおんがくをならしてね');
      return;
    }

    // Make sure audio is playing
    if (ctx.state === 'suspended') {
      setError('さきにさいせいボタンをおしてね');
      return;
    }

    const { promise, cancel } = recordFromNode(ctx, analyser, duration, (state) => {
      setRecording(state);
    });

    cancelRef.current = cancel;

    try {
      const blob = await promise;
      setRecording(null);

      // Download the file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = blob.type.includes('wav') ? 'wav' : 'webm';
      a.download = `${projectName || 'biyo'}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (err) {
      setRecording(null);
      const msg = (err as Error).message;
      if (msg !== 'cancelled') {
        setError('ろくおんできなかったよ。もういちどためしてね');
      }
    }
  }, [duration, projectName]);

  if (!open) return null;

  const progress = recording ? Math.min(recording.elapsed / recording.duration, 1) : 0;

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
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !recording) handleClose();
      }}
    >
      <div
        ref={dialogRef}
        className="animate-pop-in"
        role="dialog"
        aria-modal="true"
        aria-label="おんがくをろくおん"
        style={{
          background: 'var(--c-surface)',
          borderRadius: 'var(--r-lg)',
          padding: 'var(--sp-6)',
          maxWidth: 400,
          width: '90vw',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-lg)',
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
            style={{ fontSize: 'var(--fs-lg)', fontWeight: 900, color: 'var(--c-text)', margin: 0 }}
          >
            おんがくをほぞん
          </h2>
          {!recording && (
            <button
              type="button"
              onClick={handleClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 'var(--fs-lg)',
                cursor: 'pointer',
                color: 'var(--c-text-muted)',
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
              x
            </button>
          )}
        </div>

        {/* Description with numbered steps */}
        <div
          id="export-desc"
          style={{
            background: 'var(--c-surface-alt)',
            borderRadius: 'var(--r-md)',
            padding: 'var(--sp-4)',
            marginBottom: 'var(--sp-4)',
          }}
        >
          <ol style={{ margin: 0, paddingLeft: 'var(--sp-4)', listStyle: 'none' }}>
            <li
              style={{
                fontSize: 'var(--fs-sm)',
                color: 'var(--c-text)',
                marginBottom: 'var(--sp-2)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--sp-2)',
              }}
            >
              <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 900, color: 'var(--c-preset)' }}>
                ▶
              </span>
              <span>さいせいボタンをおして</span>
            </li>
            <li
              style={{
                fontSize: 'var(--fs-sm)',
                color: 'var(--c-text)',
                marginBottom: 'var(--sp-2)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--sp-2)',
              }}
            >
              <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 900, color: 'var(--c-preset)' }}>
                🎙
              </span>
              <span>ろくおんスタートをおす</span>
            </li>
            <li
              style={{
                fontSize: 'var(--fs-sm)',
                color: 'var(--c-text)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--sp-2)',
              }}
            >
              <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 900, color: 'var(--c-preset)' }}>
                ⏹
              </span>
              <span>じかんがくると じどうてきにおわるよ</span>
            </li>
          </ol>
        </div>

        {/* Duration picker */}
        {!recording && (
          <div
            style={{
              background: 'var(--c-surface-alt)',
              borderRadius: 'var(--r-md)',
              padding: 'var(--sp-4)',
              marginBottom: 'var(--sp-4)',
            }}
          >
            <label
              htmlFor="export-duration"
              style={{
                fontSize: 'var(--fs-sm)',
                fontWeight: 700,
                color: 'var(--c-text-sub)',
                display: 'block',
                marginBottom: 'var(--sp-2)',
              }}
            >
              ろくおんじかん
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
              <input
                id="export-duration"
                type="range"
                min={5}
                max={60}
                step={5}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                aria-label="ろくおんじかん"
                aria-valuetext={`${duration}びょう`}
                style={{ flex: 1 }}
              />
              <span
                aria-hidden="true"
                style={{
                  fontSize: 'var(--fs-md)',
                  fontWeight: 700,
                  color: 'var(--c-text)',
                  minWidth: 50,
                  textAlign: 'right',
                }}
              >
                {duration}びょう
              </span>
            </div>
          </div>
        )}

        {/* Recording progress */}
        {recording && (
          <output style={{ marginBottom: 'var(--sp-4)', display: 'block' }} aria-live="polite">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 'var(--sp-2)',
              }}
            >
              <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--c-error)' }}>
                ろくおんちゅう...
              </span>
              <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--c-text-sub)' }}>
                {Math.floor(recording.elapsed)}びょう / {recording.duration}びょう
              </span>
            </div>
            {/* Progress bar */}
            <div
              role="progressbar"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="ろくおんのしんちょく"
              style={{
                width: '100%',
                height: 8,
                background: 'var(--c-border)',
                borderRadius: 'var(--r-full)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progress * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--c-source), var(--c-preset))',
                  borderRadius: 'var(--r-full)',
                  transition: 'width 0.1s linear',
                }}
              />
            </div>
          </output>
        )}

        {/* Done message - stays visible until dialog closes */}
        {done && (
          <div
            role="alert"
            aria-live="assertive"
            style={{
              background: 'var(--c-ok)',
              borderRadius: 'var(--r-md)',
              padding: 'var(--sp-4)',
              marginBottom: 'var(--sp-4)',
              textAlign: 'center',
              border: '2px solid var(--c-ok)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <span
              style={{ fontSize: 'var(--fs-md)', fontWeight: 900, color: 'var(--c-text-inverse)' }}
            >
              ✓ ダウンロードできたよ!
            </span>
            <p
              style={{
                fontSize: 'var(--fs-sm)',
                color: 'var(--c-text-inverse)',
                marginTop: 'var(--sp-2)',
                margin: 'var(--sp-2) 0 0 0',
              }}
            >
              とじるボタンで ダイアログをとじてね
            </p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div
            role="alert"
            style={{
              background: 'var(--c-surface-alt)',
              borderRadius: 'var(--r-md)',
              padding: 'var(--sp-3)',
              marginBottom: 'var(--sp-4)',
              border: '2px solid var(--c-error)',
            }}
          >
            <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--c-error)' }}>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          {!recording ? (
            <>
              <button
                type="button"
                onClick={handleRecord}
                aria-label="ろくおんをはじめる"
                aria-describedby="export-desc"
                style={{
                  flex: 1,
                  fontFamily: 'var(--font-main)',
                  fontSize: 'var(--fs-md)',
                  fontWeight: 700,
                  color: 'var(--c-text-inverse)',
                  background: 'linear-gradient(135deg, var(--c-source), var(--c-preset))',
                  border: 'none',
                  borderRadius: 'var(--r-md)',
                  padding: 'var(--sp-3) var(--sp-4)',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-btn)',
                  minHeight: 44,
                }}
              >
                ろくおんスタート
              </button>
              <button
                type="button"
                onClick={handleClose}
                aria-label="とじる"
                style={{
                  fontFamily: 'var(--font-main)',
                  fontSize: 'var(--fs-md)',
                  fontWeight: 700,
                  color: 'var(--c-text-sub)',
                  background: 'var(--c-surface-alt)',
                  border: '2px solid var(--c-border)',
                  borderRadius: 'var(--r-md)',
                  padding: 'var(--sp-3) var(--sp-4)',
                  cursor: 'pointer',
                  minHeight: 44,
                }}
              >
                とじる
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleCancel}
              aria-label="ろくおんをやめる"
              style={{
                flex: 1,
                fontFamily: 'var(--font-main)',
                fontSize: 'var(--fs-md)',
                fontWeight: 700,
                color: 'var(--c-text-inverse)',
                background: 'var(--c-error)',
                border: 'none',
                borderRadius: 'var(--r-md)',
                padding: 'var(--sp-3) var(--sp-4)',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-btn)',
                minHeight: 44,
              }}
            >
              ストップ
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
