import { PREAMBLE } from './mimium-generator';

export interface TrackCode {
  code: string;
  volume: number;
  muted: boolean;
  solo: boolean;
}

/**
 * Extract the body expression from a full mimium program.
 * Strips the preamble and `fn dsp() -> float { ... }` wrapper,
 * returning just the inner expression.
 */
function extractBody(code: string): string {
  // Try to find the dsp function body
  const dspMatch = code.match(/fn\s+dsp\s*\(\)\s*->\s*float\s*\{\s*([\s\S]*?)\s*\}\s*$/);
  if (dspMatch) {
    return dspMatch[1].trim();
  }
  // Fallback: return the code as-is (might be just an expression)
  return code.trim();
}

/**
 * Normalize volume from 0-100 range to 0.0-1.0 multiplier.
 */
function normalizeVolume(volume: number): number {
  return volume / 100;
}

/**
 * Merge multiple track codes into a single mimium program.
 * Each track becomes a separate function, and the dsp() function
 * mixes them according to volume, mute, and solo state.
 *
 * Solo mode: when ANY track has solo=true, only tracks with solo=true
 * are included in the mix. When no tracks have solo, all non-muted
 * tracks are included.
 */
export function mergeTracks(tracks: TrackCode[]): string {
  const hasSolo = tracks.some((track) => track.solo);

  const activeTracks = tracks
    .map((track, index) => ({ ...track, index }))
    .filter((track) => {
      if (hasSolo) {
        // In solo mode: only solo tracks play (regardless of mute)
        return track.solo && track.volume > 0;
      }
      // Normal mode: non-muted tracks with volume > 0
      return !track.muted && track.volume > 0;
    });

  if (activeTracks.length === 0) {
    return `${PREAMBLE}\n\nfn dsp() -> float {\n  0.0\n}`;
  }

  // Build separate track functions
  const trackFunctions: string[] = [];
  const dspParts: string[] = [];

  for (const track of activeTracks) {
    const body = extractBody(track.code);
    const fnName = `track${track.index + 1}`;
    trackFunctions.push(`fn ${fnName}() -> float {\n  ${body}\n}`);

    const vol = normalizeVolume(track.volume);
    if (vol === 1.0) {
      dspParts.push(`${fnName}()`);
    } else {
      dspParts.push(`${fnName}() * ${vol.toFixed(3)}`);
    }
  }

  const dspBody = dspParts.length === 1 ? dspParts[0] : dspParts.join(' + ');

  const trackFunctionsStr = trackFunctions.join('\n\n');

  return `${PREAMBLE}\n\n${trackFunctionsStr}\n\nfn dsp() -> float {\n  ${dspBody}\n}`;
}
