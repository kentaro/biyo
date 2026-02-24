'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePlaybackStore } from '@/lib/stores/playback';
import { useTrackStore } from '@/lib/stores/tracks';

// Map block types to emoji sets
const SOURCE_EMOJIS = ['\uD83C\uDFB5', '\uD83C\uDFB6', '\uD83C\uDFB9'];
const EFFECT_EMOJIS = ['\u2728', '\uD83C\uDF0A', '\uD83D\uDD0A'];
const PRESET_EMOJI_MAP: Record<string, string> = {
  biyo_robot_voice: '\uD83E\uDD16',
  biyo_ghost: '\uD83D\uDC7B',
  biyo_space: '\uD83D\uDE80',
  biyo_ufo: '\uD83D\uDE80',
  biyo_water_drop: '\uD83D\uDCA7',
  biyo_siren: '\u26A1',
  biyo_laser: '\u26A1',
  biyo_bubbles: '\uD83D\uDCA7',
  biyo_thunder: '\u26A1',
  biyo_famicom: '\uD83C\uDFAE',
};

const SOURCE_TYPES = new Set([
  'biyo_sine',
  'biyo_saw',
  'biyo_triangle',
  'biyo_square',
  'biyo_noise',
  'biyo_filtered_noise',
  'biyo_detune_saw',
  'biyo_kick',
  'biyo_hihat',
  'biyo_pluck',
]);

const EFFECT_TYPES = new Set([
  'biyo_lowpass',
  'biyo_highpass',
  'biyo_bandpass',
  'biyo_delay',
  'biyo_reverb',
  'biyo_tremolo',
  'biyo_autowah',
  'biyo_vibrato',
  'biyo_distortion',
  'biyo_gain_up',
  'biyo_gain_down',
  'biyo_telephone',
]);

function getEmojisFromXml(xml: string): string[] {
  const emojis: string[] = [];
  const blockTypeRegex = /type="(biyo_\w+)"/g;
  const foundTypes = new Set<string>();
  let match: RegExpExecArray | null = blockTypeRegex.exec(xml);

  while (match !== null) {
    foundTypes.add(match[1]);
    match = blockTypeRegex.exec(xml);
  }

  for (const t of foundTypes) {
    if (PRESET_EMOJI_MAP[t]) {
      emojis.push(PRESET_EMOJI_MAP[t]);
    } else if (SOURCE_TYPES.has(t)) {
      emojis.push(SOURCE_EMOJIS[Math.floor(Math.random() * SOURCE_EMOJIS.length)]);
    } else if (EFFECT_TYPES.has(t)) {
      emojis.push(EFFECT_EMOJIS[Math.floor(Math.random() * EFFECT_EMOJIS.length)]);
    }
  }

  // Return 3-5 emojis
  if (emojis.length === 0) {
    return [SOURCE_EMOJIS[0], SOURCE_EMOJIS[1], EFFECT_EMOJIS[0]];
  }
  while (emojis.length < 3) {
    emojis.push(emojis[Math.floor(Math.random() * emojis.length)]);
  }
  return emojis.slice(0, 5);
}

export default function EmojiReaction() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const prevPlayingRef = useRef(false);
  const tracks = useTrackStore((s) => s.tracks);
  const activeTrackId = useTrackStore((s) => s.activeTrackId);

  const spawnEmojis = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    // Get active track XML to determine which emojis to show
    const activeTrack = tracks.find((t) => t.id === activeTrackId);
    const xml = activeTrack?.workspaceXml || '';
    const emojis = getEmojisFromXml(xml);

    for (let i = 0; i < emojis.length; i++) {
      const span = document.createElement('span');
      span.textContent = emojis[i];
      span.className = 'emoji-float';
      span.style.left = `${15 + Math.random() * 70}%`;
      span.style.animationDelay = `${i * 0.15}s`;
      span.style.fontSize = `${24 + Math.random() * 16}px`;
      container.appendChild(span);

      // Remove after animation
      setTimeout(
        () => {
          span.remove();
        },
        2000 + i * 150,
      );
    }
  }, [tracks, activeTrackId]);

  useEffect(() => {
    // Detect play start (transition from not playing to playing)
    if (isPlaying && !prevPlayingRef.current) {
      spawnEmojis();
    }
    prevPlayingRef.current = isPlaying;
  }, [isPlaying, spawnEmojis]);

  return <div ref={containerRef} className="emoji-reaction-container" aria-hidden="true" />;
}
