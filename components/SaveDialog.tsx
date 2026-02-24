'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePlaybackStore } from '@/lib/stores/playback';
import { type BiyoFile, type SavedProject, useProjectStore } from '@/lib/stores/projects';
import { useTrackStore } from '@/lib/stores/tracks';

interface SaveDialogProps {
  open: boolean;
  onClose: () => void;
  onLoadProject: (project: SavedProject) => void;
}

export default function SaveDialog({ open, onClose, onLoadProject }: SaveDialogProps) {
  const [projectName, setProjectName] = useState('');
  const [saved, setSaved] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const { projects, saveError, loadProjectList, saveProject, deleteProject, exportAsFile, importFromFile } =
    useProjectStore();
  const tracks = useTrackStore((s) => s.tracks);
  const bpm = usePlaybackStore((s) => s.bpm);

  useEffect(() => {
    if (open) {
      loadProjectList();
      setSaved(false);
      setImportError(null);
    }
  }, [open, loadProjectList]);

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
    const focusTimer = setTimeout(
      () => dialogRef.current?.querySelector<HTMLElement>('input[type="text"]')?.focus(),
      50,
    );

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [open, onClose]);

  const handleSave = useCallback(() => {
    const name = projectName.trim() || `プロジェクト ${new Date().toLocaleDateString('ja-JP')}`;
    saveProject(name, bpm, tracks);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [projectName, bpm, tracks, saveProject]);

  const handleExport = useCallback(() => {
    const name = projectName.trim() || 'biyo-project';
    exportAsFile(name, bpm, tracks);
  }, [projectName, bpm, tracks, exportAsFile]);

  const handleImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setImportError(null);
      try {
        const data: BiyoFile = await importFromFile(file);
        onLoadProject({
          id: 'import',
          name: data.name,
          savedAt: data.savedAt,
          bpm: data.bpm,
          tracks: data.tracks,
        });
        onClose();
      } catch (_err) {
        setImportError('ファイルがよめなかったよ。べつのファイルをえらんでみてね！');
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [importFromFile, onLoadProject, onClose],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteProject(id);
    },
    [deleteProject],
  );

  const handleLoad = useCallback(
    (project: SavedProject) => {
      onLoadProject(project);
      onClose();
    },
    [onLoadProject, onClose],
  );

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
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="animate-pop-in"
        role="dialog"
        aria-modal="true"
        aria-label="つくったおんがくをほぞん"
        style={{
          background: 'var(--c-surface)',
          borderRadius: 'var(--r-lg)',
          padding: 'var(--sp-6)',
          maxWidth: 480,
          width: '90vw',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
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
            flexShrink: 0,
          }}
        >
          <h2
            style={{ fontSize: 'var(--fs-lg)', fontWeight: 900, color: 'var(--c-text)', margin: 0 }}
          >
            つくったおんがく
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 'var(--fs-lg)',
              cursor: 'pointer',
              color: 'var(--c-text-muted)',
              padding: 'var(--sp-1)',
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
        </div>

        {/* Save section */}
        <div
          style={{
            background: 'var(--c-surface-alt)',
            borderRadius: 'var(--r-md)',
            padding: 'var(--sp-4)',
            marginBottom: 'var(--sp-4)',
            flexShrink: 0,
          }}
        >
          <label
            htmlFor="save-project-name"
            style={{
              fontSize: 'var(--fs-sm)',
              fontWeight: 700,
              color: 'var(--c-text-sub)',
              display: 'block',
              marginBottom: 'var(--sp-2)',
            }}
          >
            なまえをつけてほぞん
          </label>
          <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
            <input
              id="save-project-name"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="つくったおんがくのなまえ"
              aria-describedby="save-help-text"
              style={{
                flex: 1,
                fontFamily: 'var(--font-main)',
                fontSize: 'var(--fs-sm)',
                padding: 'var(--sp-2) var(--sp-3)',
                border: '2px solid var(--c-border)',
                borderRadius: 'var(--r-sm)',
                background: 'var(--c-surface)',
                color: 'var(--c-text)',
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={handleSave}
              aria-label="つくったおんがくをほぞんする"
              style={{
                fontFamily: 'var(--font-main)',
                fontSize: 'var(--fs-sm)',
                fontWeight: 700,
                color: 'var(--c-text-inverse)',
                background: 'var(--c-ok)',
                border: 'none',
                borderRadius: 'var(--r-sm)',
                padding: 'var(--sp-2) var(--sp-4)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: 'var(--shadow-btn)',
                minHeight: 44,
              }}
            >
              {saved ? 'ほぞんした!' : 'ほぞん'}
            </button>
          </div>
          <p
            id="save-help-text"
            style={{
              fontSize: 'var(--fs-xs)',
              color: 'var(--c-text-muted)',
              margin: 'var(--sp-1) 0 0 0',
            }}
          >
            なまえをいれなくてもほぞんできるよ
          </p>

          {/* Export / Import buttons */}
          <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-3)', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleExport}
              aria-label="ファイルにほぞんする"
              style={{
                flex: 1,
                fontFamily: 'var(--font-main)',
                fontSize: 'var(--fs-xs)',
                fontWeight: 700,
                color: 'var(--c-effect)',
                background: 'var(--c-surface)',
                border: '2px solid var(--c-effect)',
                borderRadius: 'var(--r-sm)',
                padding: 'var(--sp-2)',
                cursor: 'pointer',
                minHeight: 44,
                minWidth: 120,
              }}
            >
              ファイルにほぞん (.biyo)
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="ファイルからよみこむ"
              style={{
                flex: 1,
                fontFamily: 'var(--font-main)',
                fontSize: 'var(--fs-xs)',
                fontWeight: 700,
                color: 'var(--c-preset)',
                background: 'var(--c-surface)',
                border: '2px solid var(--c-preset)',
                borderRadius: 'var(--r-sm)',
                padding: 'var(--sp-2)',
                cursor: 'pointer',
                minHeight: 44,
                minWidth: 120,
              }}
            >
              ファイルをよみこむ
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".biyo,.json"
              onChange={handleImport}
              aria-label="ファイルをえらぶ"
              style={{ display: 'none' }}
            />
          </div>
          {importError && (
            <p
              role="alert"
              style={{
                fontSize: 'var(--fs-xs)',
                color: 'var(--c-error)',
                margin: 'var(--sp-2) 0 0 0',
              }}
            >
              {importError}
            </p>
          )}
          {saveError && (
            <p
              role="alert"
              style={{
                fontSize: 'var(--fs-xs)',
                color: 'var(--c-error)',
                margin: 'var(--sp-2) 0 0 0',
              }}
            >
              {saveError}
            </p>
          )}
        </div>

        {/* Saved projects list */}
        <div
          style={{
            fontSize: 'var(--fs-sm)',
            fontWeight: 700,
            color: 'var(--c-text-sub)',
            marginBottom: 'var(--sp-2)',
            flexShrink: 0,
          }}
        >
          ほぞんしたつくったおんがく
        </div>
        <ul
          aria-label="ほぞんしたつくったおんがくのいちらん"
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--sp-2)',
            listStyle: 'none',
            margin: 0,
            padding: 0,
          }}
        >
          {projects.length === 0 && (
            <p
              style={{
                fontSize: 'var(--fs-sm)',
                color: 'var(--c-text-muted)',
                textAlign: 'center',
                padding: 'var(--sp-6) 0',
              }}
            >
              まだほぞんしたつくったおんがくはないよ
            </p>
          )}
          {projects.map((project) => (
            <li
              key={project.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--sp-3)',
                background: 'var(--c-surface-alt)',
                borderRadius: 'var(--r-sm)',
                padding: 'var(--sp-3)',
                border: '1px solid var(--c-border-light)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 'var(--fs-sm)',
                    fontWeight: 700,
                    color: 'var(--c-text)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {project.name}
                </div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-text-muted)' }}>
                  {new Date(project.savedAt).toLocaleString('ja-JP')} / {project.tracks.length}
                  おへや
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleLoad(project)}
                aria-label={`${project.name}をひらく`}
                style={{
                  fontFamily: 'var(--font-main)',
                  fontSize: 'var(--fs-xs)',
                  fontWeight: 700,
                  color: 'var(--c-text-inverse)',
                  background: 'var(--c-effect)',
                  border: 'none',
                  borderRadius: 'var(--r-sm)',
                  padding: 'var(--sp-2) var(--sp-3)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: 'var(--shadow-btn)',
                  minHeight: 44,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                ひらく
              </button>
              <button
                type="button"
                onClick={() => handleDelete(project.id)}
                aria-label={`${project.name}をけす`}
                style={{
                  fontFamily: 'var(--font-main)',
                  fontSize: 'var(--fs-xs)',
                  fontWeight: 700,
                  color: 'var(--c-error)',
                  background: 'none',
                  border: '1px solid var(--c-error)',
                  borderRadius: 'var(--r-sm)',
                  padding: 'var(--sp-2) var(--sp-3)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  minHeight: 44,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                けす
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
