import { describe, expect, it } from 'vitest';
import { mergeTracks, type TrackCode } from '../code-merger';
import { PREAMBLE } from '../mimium-generator';

// ---------------------------------------------------------------------------
// Helper: extract the dsp function body from the generated code
// ---------------------------------------------------------------------------
function extractDspBody(code: string): string {
  const match = code.match(/fn\s+dsp\s*\(\)\s*->\s*float\s*\{\s*([\s\S]*?)\s*\}\s*$/);
  return match ? match[1].trim() : '';
}

// ---------------------------------------------------------------------------
// Helper: extract track function bodies from generated code
// ---------------------------------------------------------------------------
function extractTrackFunctions(code: string): Array<{ name: string; body: string }> {
  const results: Array<{ name: string; body: string }> = [];
  const regex = /fn\s+(track\d+)\s*\(\)\s*->\s*float\s*\{\s*([\s\S]*?)\s*\}/g;
  let match: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: concise regex loop
  while ((match = regex.exec(code)) !== null) {
    results.push({ name: match[1], body: match[2].trim() });
  }
  return results;
}

// =========================================================================
// TESTS
// =========================================================================

describe('code-merger', () => {
  // -----------------------------------------------------------------------
  // mergeTracks — empty / all-silent scenarios
  // -----------------------------------------------------------------------
  describe('mergeTracks with no active tracks', () => {
    it('returns silent dsp when tracks array is empty', () => {
      const result = mergeTracks([]);
      expect(result).toContain(PREAMBLE);
      expect(result).toContain('fn dsp() -> float {');
      expect(extractDspBody(result)).toBe('0.0');
    });

    it('returns silent dsp when all tracks are muted', () => {
      const tracks: TrackCode[] = [
        { code: 'fn dsp() -> float {\n  noise()\n}', volume: 1, muted: true },
        {
          code: 'fn dsp() -> float {\n  sinwave(440.0, 0.0)\n}',
          volume: 0.8,
          muted: true,
        },
      ];
      const result = mergeTracks(tracks);
      expect(extractDspBody(result)).toBe('0.0');
    });

    it('returns silent dsp when all tracks have volume 0', () => {
      const tracks: TrackCode[] = [
        { code: 'fn dsp() -> float {\n  noise()\n}', volume: 0, muted: false },
        {
          code: 'fn dsp() -> float {\n  sinwave(440.0, 0.0)\n}',
          volume: 0,
          muted: false,
        },
      ];
      const result = mergeTracks(tracks);
      expect(extractDspBody(result)).toBe('0.0');
    });

    it('returns silent dsp when tracks are both muted and volume 0', () => {
      const tracks: TrackCode[] = [
        { code: 'fn dsp() -> float {\n  noise()\n}', volume: 0, muted: true },
      ];
      const result = mergeTracks(tracks);
      expect(extractDspBody(result)).toBe('0.0');
    });
  });

  // -----------------------------------------------------------------------
  // mergeTracks — single active track
  // -----------------------------------------------------------------------
  describe('mergeTracks with single active track', () => {
    it('generates a single track function with volume 1.0 (no multiplier)', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 1.0,
          muted: false,
        },
      ];
      const result = mergeTracks(tracks);
      expect(result).toContain(PREAMBLE);
      expect(result).toContain('fn track1() -> float {\n  noise()\n}');
      expect(extractDspBody(result)).toBe('track1()');
    });

    it('generates a single track function with fractional volume (multiplier)', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 0.5,
          muted: false,
        },
      ];
      const result = mergeTracks(tracks);
      expect(result).toContain('fn track1() -> float {\n  noise()\n}');
      expect(extractDspBody(result)).toBe('track1() * 0.500');
    });

    it('extracts body from full dsp wrapper', () => {
      const tracks: TrackCode[] = [
        {
          code: `${PREAMBLE}\n\nfn dsp() -> float {\n  sinwave(440.0, 0.0)\n}`,
          volume: 1.0,
          muted: false,
        },
      ];
      const result = mergeTracks(tracks);
      const trackFns = extractTrackFunctions(result);
      expect(trackFns).toHaveLength(1);
      expect(trackFns[0].body).toBe('sinwave(440.0, 0.0)');
    });

    it('handles code that is just a raw expression (no dsp wrapper)', () => {
      const tracks: TrackCode[] = [{ code: 'noise()', volume: 1.0, muted: false }];
      const result = mergeTracks(tracks);
      const trackFns = extractTrackFunctions(result);
      expect(trackFns).toHaveLength(1);
      expect(trackFns[0].body).toBe('noise()');
    });
  });

  // -----------------------------------------------------------------------
  // mergeTracks — multiple active tracks
  // -----------------------------------------------------------------------
  describe('mergeTracks with multiple active tracks', () => {
    it('merges two tracks with volume 1.0 using addition', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 1.0,
          muted: false,
        },
        {
          code: 'fn dsp() -> float {\n  sinwave(440.0, 0.0)\n}',
          volume: 1.0,
          muted: false,
        },
      ];
      const result = mergeTracks(tracks);
      expect(result).toContain('fn track1() -> float {\n  noise()\n}');
      expect(result).toContain('fn track2() -> float {\n  sinwave(440.0, 0.0)\n}');
      expect(extractDspBody(result)).toBe('track1() + track2()');
    });

    it('merges two tracks with different volumes', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 0.8,
          muted: false,
        },
        {
          code: 'fn dsp() -> float {\n  sinwave(440.0, 0.0)\n}',
          volume: 0.3,
          muted: false,
        },
      ];
      const result = mergeTracks(tracks);
      expect(extractDspBody(result)).toBe('track1() * 0.800 + track2() * 0.300');
    });

    it('merges tracks with mixed volume 1.0 and fractional volumes', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 1.0,
          muted: false,
        },
        {
          code: 'fn dsp() -> float {\n  sinwave(440.0, 0.0)\n}',
          volume: 0.5,
          muted: false,
        },
      ];
      const result = mergeTracks(tracks);
      expect(extractDspBody(result)).toBe('track1() + track2() * 0.500');
    });

    it('merges three active tracks', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 1.0,
          muted: false,
        },
        {
          code: 'fn dsp() -> float {\n  sinwave(440.0, 0.0)\n}',
          volume: 1.0,
          muted: false,
        },
        {
          code: 'fn dsp() -> float {\n  saw(220.0, 0.0)\n}',
          volume: 1.0,
          muted: false,
        },
      ];
      const result = mergeTracks(tracks);
      expect(extractDspBody(result)).toBe('track1() + track2() + track3()');
    });
  });

  // -----------------------------------------------------------------------
  // mergeTracks — filtering (muted tracks and volume 0)
  // -----------------------------------------------------------------------
  describe('mergeTracks filtering', () => {
    it('excludes muted tracks from output', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 1.0,
          muted: true,
        },
        {
          code: 'fn dsp() -> float {\n  sinwave(440.0, 0.0)\n}',
          volume: 1.0,
          muted: false,
        },
      ];
      const result = mergeTracks(tracks);
      // Only track2 should be present (index 1 in original array)
      expect(result).not.toContain('fn track1()');
      expect(result).toContain('fn track2()');
      expect(extractDspBody(result)).toBe('track2()');
    });

    it('excludes volume-0 tracks from output', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 0,
          muted: false,
        },
        {
          code: 'fn dsp() -> float {\n  sinwave(440.0, 0.0)\n}',
          volume: 1.0,
          muted: false,
        },
      ];
      const result = mergeTracks(tracks);
      expect(result).not.toContain('fn track1()');
      expect(result).toContain('fn track2()');
      expect(extractDspBody(result)).toBe('track2()');
    });

    it('uses correct track numbering based on original index', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 1.0,
          muted: true,
        },
        {
          code: 'fn dsp() -> float {\n  sinwave(440.0, 0.0)\n}',
          volume: 0,
          muted: false,
        },
        {
          code: 'fn dsp() -> float {\n  saw(220.0, 0.0)\n}',
          volume: 0.7,
          muted: false,
        },
      ];
      const result = mergeTracks(tracks);
      // Only track at original index 2 is active -> track3
      expect(result).not.toContain('fn track1()');
      expect(result).not.toContain('fn track2()');
      expect(result).toContain('fn track3()');
      expect(extractDspBody(result)).toBe('track3() * 0.700');
    });
  });

  // -----------------------------------------------------------------------
  // extractBody (tested indirectly via mergeTracks)
  // -----------------------------------------------------------------------
  describe('extractBody behavior (indirect)', () => {
    it('extracts body from standard dsp function wrapper', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 1.0,
          muted: false,
        },
      ];
      const result = mergeTracks(tracks);
      const trackFns = extractTrackFunctions(result);
      expect(trackFns[0].body).toBe('noise()');
    });

    it('extracts body from dsp wrapper with extra whitespace', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp()  ->  float  {   noise()   }',
          volume: 1.0,
          muted: false,
        },
      ];
      const result = mergeTracks(tracks);
      const trackFns = extractTrackFunctions(result);
      expect(trackFns[0].body).toBe('noise()');
    });

    it('uses code as-is when no dsp wrapper is present (fallback)', () => {
      const tracks: TrackCode[] = [{ code: '  some_expression()  ', volume: 1.0, muted: false }];
      const result = mergeTracks(tracks);
      const trackFns = extractTrackFunctions(result);
      expect(trackFns[0].body).toBe('some_expression()');
    });

    it('handles empty string code (fallback to trimmed empty)', () => {
      const tracks: TrackCode[] = [{ code: '', volume: 1.0, muted: false }];
      const result = mergeTracks(tracks);
      const trackFns = extractTrackFunctions(result);
      expect(trackFns[0].body).toBe('');
    });

    it('extracts multi-line dsp body', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  let x = noise();\n  x * 0.5\n}',
          volume: 1.0,
          muted: false,
        },
      ];
      const result = mergeTracks(tracks);
      const trackFns = extractTrackFunctions(result);
      expect(trackFns[0].body).toBe('let x = noise();\n  x * 0.5');
    });

    it('strips preamble when extracting body', () => {
      const fullCode = `${PREAMBLE}\n\nfn dsp() -> float {\n  saw(110.0, 0.0)\n}`;
      const tracks: TrackCode[] = [{ code: fullCode, volume: 1.0, muted: false }];
      const result = mergeTracks(tracks);
      const trackFns = extractTrackFunctions(result);
      expect(trackFns[0].body).toBe('saw(110.0, 0.0)');
    });
  });

  // -----------------------------------------------------------------------
  // Output structure
  // -----------------------------------------------------------------------
  describe('output structure', () => {
    it('starts with PREAMBLE', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 1.0,
          muted: false,
        },
      ];
      const result = mergeTracks(tracks);
      expect(result.startsWith(PREAMBLE)).toBe(true);
    });

    it('has preamble, track functions, and dsp function in correct order', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 1.0,
          muted: false,
        },
        {
          code: 'fn dsp() -> float {\n  sinwave(440.0, 0.0)\n}',
          volume: 0.5,
          muted: false,
        },
      ];
      const result = mergeTracks(tracks);
      const preambleEnd = result.indexOf(PREAMBLE) + PREAMBLE.length;
      const track1Pos = result.indexOf('fn track1()');
      const track2Pos = result.indexOf('fn track2()');
      const dspPos = result.indexOf('fn dsp()');

      expect(preambleEnd).toBeLessThan(track1Pos);
      expect(track1Pos).toBeLessThan(track2Pos);
      expect(track2Pos).toBeLessThan(dspPos);
    });

    it('separates track functions with double newlines', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 1.0,
          muted: false,
        },
        {
          code: 'fn dsp() -> float {\n  sinwave(440.0, 0.0)\n}',
          volume: 1.0,
          muted: false,
        },
      ];
      const result = mergeTracks(tracks);
      expect(result).toContain('}\n\nfn track2()');
    });

    it('silent result has no track functions, only preamble + dsp', () => {
      const result = mergeTracks([]);
      expect(result).not.toContain('fn track');
      expect(result).toBe(`${PREAMBLE}\n\nfn dsp() -> float {\n  0.0\n}`);
    });
  });

  // -----------------------------------------------------------------------
  // Volume formatting
  // -----------------------------------------------------------------------
  describe('volume formatting', () => {
    it('formats volume with 3 decimal places via toFixed(3)', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 0.123456,
          muted: false,
        },
      ];
      const result = mergeTracks(tracks);
      expect(extractDspBody(result)).toBe('track1() * 0.123');
    });

    it('formats volume 0.1 as 0.100', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 0.1,
          muted: false,
        },
      ];
      const result = mergeTracks(tracks);
      expect(extractDspBody(result)).toBe('track1() * 0.100');
    });

    it('omits multiplier for exactly 1.0 volume', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 1.0,
          muted: false,
        },
      ];
      const result = mergeTracks(tracks);
      const dsp = extractDspBody(result);
      expect(dsp).toBe('track1()');
      expect(dsp).not.toContain('*');
    });

    it('adds multiplier for volume very close to but not exactly 1.0', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 0.999,
          muted: false,
        },
      ];
      const result = mergeTracks(tracks);
      expect(extractDspBody(result)).toBe('track1() * 0.999');
    });
  });

  // -----------------------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------------------
  describe('edge cases', () => {
    it('handles a track with volume exactly at boundary (just above 0)', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 0.001,
          muted: false,
        },
      ];
      const result = mergeTracks(tracks);
      expect(result).toContain('fn track1()');
      expect(extractDspBody(result)).toBe('track1() * 0.001');
    });

    it('handles negative volume (treated as not active since <= 0)', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: -0.5,
          muted: false,
        },
      ];
      const result = mergeTracks(tracks);
      expect(extractDspBody(result)).toBe('0.0');
    });

    it('handles many tracks correctly', () => {
      const tracks: TrackCode[] = Array.from({ length: 5 }, (_, i) => ({
        code: `fn dsp() -> float {\n  sinwave(${440 + i * 10}.0, 0.0)\n}`,
        volume: 1.0,
        muted: false,
      }));
      const result = mergeTracks(tracks);
      expect(extractDspBody(result)).toBe('track1() + track2() + track3() + track4() + track5()');
    });

    it('handles whitespace-only code in fallback path', () => {
      const tracks: TrackCode[] = [{ code: '   \n  \t  ', volume: 1.0, muted: false }];
      const result = mergeTracks(tracks);
      const trackFns = extractTrackFunctions(result);
      expect(trackFns).toHaveLength(1);
      // trimmed whitespace becomes empty
      expect(trackFns[0].body).toBe('');
    });

    it('handles code with dsp-like text that does not match the regex', () => {
      // This has an extra parameter, so the extractBody regex should NOT match.
      // The entire trimmed code string becomes the track body (fallback path).
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp(x) -> float {\n  noise()\n}',
          volume: 1.0,
          muted: false,
        },
      ];
      const result = mergeTracks(tracks);
      // The track function wraps the entire unmatched code as its body
      expect(result).toContain('fn track1() -> float {');
      expect(result).toContain('fn dsp(x) -> float {');
      // The dsp function references track1()
      expect(extractDspBody(result)).toBe('track1()');
    });
  });
});
