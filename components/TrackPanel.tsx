'use client';

import { useTrackStore } from '@/lib/stores/tracks';
import TrackItem from './TrackItem';

export default function TrackPanel() {
  const tracks = useTrackStore((s) => s.tracks);
  const addTrack = useTrackStore((s) => s.addTrack);

  return (
    <section
      className="flex flex-col h-full bg-[var(--c-surface)] border-l border-[var(--c-border)] overflow-hidden"
      aria-label="おとのへやパネル"
    >
      {/* Header */}
      <div
        className="shrink-0 flex items-center border-b border-[var(--c-border)]"
        style={{ padding: 'var(--sp-2) var(--sp-3)', gap: 'var(--sp-2)' }}
      >
        <div className="flex flex-col min-w-0 flex-1">
          <h2
            className="font-black text-[var(--c-text)] truncate"
            style={{ fontSize: 'var(--fs-sm)' }}
          >
            おとのへや
          </h2>
          <p
            className="text-[var(--c-text-muted)] truncate"
            style={{ fontSize: 'var(--fs-xs)', marginTop: 'var(--sp-1)' }}
          >
            いろんなおとをべつべつにつくれるよ
          </p>
        </div>
        <button
          type="button"
          onClick={addTrack}
          className="shrink-0 rounded-[var(--r-sm)] bg-[var(--c-preset)] hover:brightness-110 text-white font-bold flex items-center justify-center transition-colors active:scale-90"
          style={{
            width: 'var(--btn-sm)',
            height: 'var(--btn-sm)',
            fontSize: 'var(--fs-md)',
            boxShadow: 'var(--shadow-sm)',
          }}
          aria-label="あたらしいおとのへやをつくる"
        >
          +
        </button>
      </div>

      {/* Track list */}
      <ul
        className="flex-1 overflow-y-auto overflow-x-hidden"
        aria-label="おとのへやのいちらん"
        style={{
          padding: 'var(--sp-2)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--sp-2)',
          listStyle: 'none',
          margin: 0,
        }}
      >
        {tracks.map((track) => (
          <TrackItem key={track.id} track={track} canDelete={tracks.length > 1} />
        ))}
      </ul>
    </section>
  );
}
