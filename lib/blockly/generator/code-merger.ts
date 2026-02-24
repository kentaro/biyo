import { PREAMBLE } from './mimium-generator';

export interface TrackCode {
  code: string;
  volume: number;
  muted: boolean;
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
 * Merge multiple track codes into a single mimium program.
 * Each track becomes a separate function, and the dsp() function
 * mixes them according to volume and mute state.
 */
export function mergeTracks(tracks: TrackCode[]): string {
  const activeTracks = tracks
    .map((track, index) => ({ ...track, index }))
    .filter((track) => !track.muted && track.volume > 0);

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

    if (track.volume === 1.0) {
      dspParts.push(`${fnName}()`);
    } else {
      dspParts.push(`${fnName}() * ${track.volume.toFixed(3)}`);
    }
  }

  const dspBody = dspParts.length === 1 ? dspParts[0] : dspParts.join(' + ');

  const trackFunctionsStr = trackFunctions.join('\n\n');

  return `${PREAMBLE}\n\n${trackFunctionsStr}\n\nfn dsp() -> float {\n  ${dspBody}\n}`;
}
