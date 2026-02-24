'use client';

import { useCallback, useState } from 'react';
import { encodeWorkspace } from '@/lib/sharing/url-codec';
import { usePlaybackStore } from '@/lib/stores/playback';
import { useTrackStore } from '@/lib/stores/tracks';

export default function ShareButton() {
  const [status, setStatus] = useState<'idle' | 'copied' | 'empty' | 'too-long'>('idle');

  const tracks = useTrackStore((s) => s.tracks);
  const activeTrackId = useTrackStore((s) => s.activeTrackId);
  const bpm = usePlaybackStore((s) => s.bpm);

  const handleShare = useCallback(async () => {
    // Find the active track's workspace XML
    const activeTrack = tracks.find((t) => t.id === activeTrackId);
    const xml = activeTrack?.workspaceXml ?? '';

    if (!xml || xml.trim() === '' || xml.trim() === '<xml></xml>') {
      setStatus('empty');
      setTimeout(() => setStatus('idle'), 2000);
      return;
    }

    const hash = encodeWorkspace(xml, bpm);

    if (!hash) {
      setStatus('too-long');
      setTimeout(() => setStatus('idle'), 2000);
      return;
    }

    const url = `${window.location.origin}${window.location.pathname}${hash}`;

    try {
      await navigator.clipboard.writeText(url);
      setStatus('copied');
    } catch {
      // Fallback: select a temporary input
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setStatus('copied');
    }

    setTimeout(() => setStatus('idle'), 2000);
  }, [tracks, activeTrackId, bpm]);

  const label = (() => {
    switch (status) {
      case 'copied':
        return 'コピーした！';
      case 'empty':
        return 'ブロックがないよ';
      case 'too-long':
        return 'おおきすぎるよ';
      default:
        return 'シェア \u{1F517}';
    }
  })();

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="つくったおんがくをシェアする"
      aria-live="polite"
      style={{
        fontFamily: 'var(--font-main)',
        fontSize: 'var(--fs-xs)',
        fontWeight: 700,
        color: 'var(--c-text-inverse)',
        background:
          status === 'copied'
            ? 'var(--c-ok)'
            : 'linear-gradient(135deg, var(--c-utility), var(--c-effect))',
        border: 'none',
        borderRadius: 'var(--r-sm)',
        padding: 'var(--sp-1) var(--sp-3)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        boxShadow: 'var(--shadow-sm)',
        transition: 'background 0.2s, color 0.2s',
        height: 36,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {label}
    </button>
  );
}
