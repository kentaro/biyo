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
        { code: 'fn dsp() -> float {\n  noise()\n}', volume: 100, muted: true, solo: false },
        {
          code: 'fn dsp() -> float {\n  sinwave(440.0, 0.0)\n}',
          volume: 80,
          muted: true,
          solo: false,
        },
      ];
      const result = mergeTracks(tracks);
      expect(extractDspBody(result)).toBe('0.0');
    });

    it('returns silent dsp when all tracks have volume 0', () => {
      const tracks: TrackCode[] = [
        { code: 'fn dsp() -> float {\n  noise()\n}', volume: 0, muted: false, solo: false },
        {
          code: 'fn dsp() -> float {\n  sinwave(440.0, 0.0)\n}',
          volume: 0,
          muted: false,
          solo: false,
        },
      ];
      const result = mergeTracks(tracks);
      expect(extractDspBody(result)).toBe('0.0');
    });

    it('returns silent dsp when tracks are both muted and volume 0', () => {
      const tracks: TrackCode[] = [
        { code: 'fn dsp() -> float {\n  noise()\n}', volume: 0, muted: true, solo: false },
      ];
      const result = mergeTracks(tracks);
      expect(extractDspBody(result)).toBe('0.0');
    });
  });

  // -----------------------------------------------------------------------
  // mergeTracks — single active track
  // -----------------------------------------------------------------------
  describe('mergeTracks with single active track', () => {
    it('generates a single track function with volume 100 (no multiplier)', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 100,
          muted: false,
          solo: false,
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
          volume: 50,
          muted: false,
          solo: false,
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
          volume: 100,
          muted: false,
          solo: false,
        },
      ];
      const result = mergeTracks(tracks);
      const trackFns = extractTrackFunctions(result);
      expect(trackFns).toHaveLength(1);
      expect(trackFns[0].body).toBe('sinwave(440.0, 0.0)');
    });

    it('handles code that is just a raw expression (no dsp wrapper)', () => {
      const tracks: TrackCode[] = [{ code: 'noise()', volume: 100, muted: false, solo: false }];
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
    it('merges two tracks with volume 100 using addition', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 100,
          muted: false,
          solo: false,
        },
        {
          code: 'fn dsp() -> float {\n  sinwave(440.0, 0.0)\n}',
          volume: 100,
          muted: false,
          solo: false,
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
          volume: 80,
          muted: false,
          solo: false,
        },
        {
          code: 'fn dsp() -> float {\n  sinwave(440.0, 0.0)\n}',
          volume: 30,
          muted: false,
          solo: false,
        },
      ];
      const result = mergeTracks(tracks);
      expect(extractDspBody(result)).toBe('track1() * 0.800 + track2() * 0.300');
    });

    it('merges tracks with mixed volume 100 and fractional volumes', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 100,
          muted: false,
          solo: false,
        },
        {
          code: 'fn dsp() -> float {\n  sinwave(440.0, 0.0)\n}',
          volume: 50,
          muted: false,
          solo: false,
        },
      ];
      const result = mergeTracks(tracks);
      expect(extractDspBody(result)).toBe('track1() + track2() * 0.500');
    });

    it('merges three active tracks', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 100,
          muted: false,
          solo: false,
        },
        {
          code: 'fn dsp() -> float {\n  sinwave(440.0, 0.0)\n}',
          volume: 100,
          muted: false,
          solo: false,
        },
        {
          code: 'fn dsp() -> float {\n  saw(220.0, 0.0)\n}',
          volume: 100,
          muted: false,
          solo: false,
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
          volume: 100,
          muted: true,
          solo: false,
        },
        {
          code: 'fn dsp() -> float {\n  sinwave(440.0, 0.0)\n}',
          volume: 100,
          muted: false,
          solo: false,
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
          solo: false,
        },
        {
          code: 'fn dsp() -> float {\n  sinwave(440.0, 0.0)\n}',
          volume: 100,
          muted: false,
          solo: false,
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
          volume: 100,
          muted: true,
          solo: false,
        },
        {
          code: 'fn dsp() -> float {\n  sinwave(440.0, 0.0)\n}',
          volume: 0,
          muted: false,
          solo: false,
        },
        {
          code: 'fn dsp() -> float {\n  saw(220.0, 0.0)\n}',
          volume: 70,
          muted: false,
          solo: false,
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
          volume: 100,
          muted: false,
          solo: false,
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
          volume: 100,
          muted: false,
          solo: false,
        },
      ];
      const result = mergeTracks(tracks);
      const trackFns = extractTrackFunctions(result);
      expect(trackFns[0].body).toBe('noise()');
    });

    it('uses code as-is when no dsp wrapper is present (fallback)', () => {
      const tracks: TrackCode[] = [
        { code: '  some_expression()  ', volume: 100, muted: false, solo: false },
      ];
      const result = mergeTracks(tracks);
      const trackFns = extractTrackFunctions(result);
      expect(trackFns[0].body).toBe('some_expression()');
    });

    it('handles empty string code (fallback to trimmed empty)', () => {
      const tracks: TrackCode[] = [{ code: '', volume: 100, muted: false, solo: false }];
      const result = mergeTracks(tracks);
      const trackFns = extractTrackFunctions(result);
      expect(trackFns[0].body).toBe('');
    });

    it('extracts multi-line dsp body', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  let x = noise();\n  x * 0.5\n}',
          volume: 100,
          muted: false,
          solo: false,
        },
      ];
      const result = mergeTracks(tracks);
      const trackFns = extractTrackFunctions(result);
      expect(trackFns[0].body).toBe('let x = noise();\n  x * 0.5');
    });

    it('strips preamble when extracting body', () => {
      const fullCode = `${PREAMBLE}\n\nfn dsp() -> float {\n  saw(110.0, 0.0)\n}`;
      const tracks: TrackCode[] = [{ code: fullCode, volume: 100, muted: false, solo: false }];
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
          volume: 100,
          muted: false,
          solo: false,
        },
      ];
      const result = mergeTracks(tracks);
      expect(result.startsWith(PREAMBLE)).toBe(true);
    });

    it('has preamble, track functions, and dsp function in correct order', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 100,
          muted: false,
          solo: false,
        },
        {
          code: 'fn dsp() -> float {\n  sinwave(440.0, 0.0)\n}',
          volume: 50,
          muted: false,
          solo: false,
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
          volume: 100,
          muted: false,
          solo: false,
        },
        {
          code: 'fn dsp() -> float {\n  sinwave(440.0, 0.0)\n}',
          volume: 100,
          muted: false,
          solo: false,
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
  // Volume normalization (0-100 → 0.0-1.0)
  // -----------------------------------------------------------------------
  describe('volume normalization', () => {
    it('normalizes volume 80 to 0.800 multiplier', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 80,
          muted: false,
          solo: false,
        },
      ];
      const result = mergeTracks(tracks);
      expect(extractDspBody(result)).toBe('track1() * 0.800');
    });

    it('normalizes volume 100 to no multiplier (1.0)', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 100,
          muted: false,
          solo: false,
        },
      ];
      const result = mergeTracks(tracks);
      expect(extractDspBody(result)).toBe('track1()');
      expect(extractDspBody(result)).not.toContain('*');
    });

    it('normalizes volume 50 to 0.500 multiplier', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 50,
          muted: false,
          solo: false,
        },
      ];
      const result = mergeTracks(tracks);
      expect(extractDspBody(result)).toBe('track1() * 0.500');
    });

    it('normalizes volume 1 to 0.010 multiplier', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 1,
          muted: false,
          solo: false,
        },
      ];
      const result = mergeTracks(tracks);
      expect(extractDspBody(result)).toBe('track1() * 0.010');
    });

    it('normalizes volume 25 to 0.250 multiplier', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 25,
          muted: false,
          solo: false,
        },
      ];
      const result = mergeTracks(tracks);
      expect(extractDspBody(result)).toBe('track1() * 0.250');
    });

    it('mixes two tracks with volumes in 0-100 range', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 80,
          muted: false,
          solo: false,
        },
        {
          code: 'fn dsp() -> float {\n  sinwave(440.0, 0.0)\n}',
          volume: 60,
          muted: false,
          solo: false,
        },
      ];
      const result = mergeTracks(tracks);
      expect(extractDspBody(result)).toBe('track1() * 0.800 + track2() * 0.600');
    });
  });

  // -----------------------------------------------------------------------
  // Volume formatting
  // -----------------------------------------------------------------------
  describe('volume formatting', () => {
    it('formats volume with 3 decimal places via toFixed(3)', () => {
      // 12.3456 / 100 = 0.123456 → toFixed(3) = 0.123
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 12.3456,
          muted: false,
          solo: false,
        },
      ];
      const result = mergeTracks(tracks);
      expect(extractDspBody(result)).toBe('track1() * 0.123');
    });

    it('formats volume 10 as 0.100', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 10,
          muted: false,
          solo: false,
        },
      ];
      const result = mergeTracks(tracks);
      expect(extractDspBody(result)).toBe('track1() * 0.100');
    });

    it('omits multiplier for exactly volume 100', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 100,
          muted: false,
          solo: false,
        },
      ];
      const result = mergeTracks(tracks);
      const dsp = extractDspBody(result);
      expect(dsp).toBe('track1()');
      expect(dsp).not.toContain('*');
    });

    it('adds multiplier for volume very close to but not exactly 100', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 99.9,
          muted: false,
          solo: false,
        },
      ];
      const result = mergeTracks(tracks);
      expect(extractDspBody(result)).toBe('track1() * 0.999');
    });
  });

  // -----------------------------------------------------------------------
  // Solo mode
  // -----------------------------------------------------------------------
  describe('solo mode', () => {
    it('only plays solo tracks when any track has solo=true', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 100,
          muted: false,
          solo: true,
        },
        {
          code: 'fn dsp() -> float {\n  sinwave(440.0, 0.0)\n}',
          volume: 100,
          muted: false,
          solo: false,
        },
      ];
      const result = mergeTracks(tracks);
      // Only track1 (the soloed track) should play
      expect(result).toContain('fn track1()');
      expect(result).not.toContain('fn track2()');
      expect(extractDspBody(result)).toBe('track1()');
    });

    it('plays multiple solo tracks when several have solo=true', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 100,
          muted: false,
          solo: true,
        },
        {
          code: 'fn dsp() -> float {\n  sinwave(440.0, 0.0)\n}',
          volume: 100,
          muted: false,
          solo: false,
        },
        {
          code: 'fn dsp() -> float {\n  saw(220.0, 0.0)\n}',
          volume: 100,
          muted: false,
          solo: true,
        },
      ];
      const result = mergeTracks(tracks);
      expect(result).toContain('fn track1()');
      expect(result).not.toContain('fn track2()');
      expect(result).toContain('fn track3()');
      expect(extractDspBody(result)).toBe('track1() + track3()');
    });

    it('solo overrides mute (soloed+muted track still plays)', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 100,
          muted: true,
          solo: true,
        },
        {
          code: 'fn dsp() -> float {\n  sinwave(440.0, 0.0)\n}',
          volume: 100,
          muted: false,
          solo: false,
        },
      ];
      const result = mergeTracks(tracks);
      // Solo overrides mute: track1 should play even though it's muted
      expect(result).toContain('fn track1()');
      expect(result).not.toContain('fn track2()');
      expect(extractDspBody(result)).toBe('track1()');
    });

    it('solo track with volume 0 is excluded', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 0,
          muted: false,
          solo: true,
        },
        {
          code: 'fn dsp() -> float {\n  sinwave(440.0, 0.0)\n}',
          volume: 100,
          muted: false,
          solo: false,
        },
      ];
      const result = mergeTracks(tracks);
      // Solo track has volume 0, non-solo track is excluded by solo mode
      expect(extractDspBody(result)).toBe('0.0');
    });

    it('respects volume on solo tracks', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 60,
          muted: false,
          solo: true,
        },
        {
          code: 'fn dsp() -> float {\n  sinwave(440.0, 0.0)\n}',
          volume: 100,
          muted: false,
          solo: false,
        },
      ];
      const result = mergeTracks(tracks);
      expect(extractDspBody(result)).toBe('track1() * 0.600');
    });

    it('plays all non-muted tracks when no track has solo', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 100,
          muted: false,
          solo: false,
        },
        {
          code: 'fn dsp() -> float {\n  sinwave(440.0, 0.0)\n}',
          volume: 100,
          muted: false,
          solo: false,
        },
      ];
      const result = mergeTracks(tracks);
      expect(result).toContain('fn track1()');
      expect(result).toContain('fn track2()');
      expect(extractDspBody(result)).toBe('track1() + track2()');
    });

    it('returns silence when only solo track has volume 0 and others are non-solo', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 0,
          muted: false,
          solo: true,
        },
      ];
      const result = mergeTracks(tracks);
      expect(extractDspBody(result)).toBe('0.0');
    });
  });

  // -----------------------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------------------
  describe('edge cases', () => {
    it('handles a track with volume just above 0', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: 1,
          muted: false,
          solo: false,
        },
      ];
      const result = mergeTracks(tracks);
      expect(result).toContain('fn track1()');
      expect(extractDspBody(result)).toBe('track1() * 0.010');
    });

    it('handles negative volume (treated as not active since <= 0)', () => {
      const tracks: TrackCode[] = [
        {
          code: 'fn dsp() -> float {\n  noise()\n}',
          volume: -50,
          muted: false,
          solo: false,
        },
      ];
      const result = mergeTracks(tracks);
      expect(extractDspBody(result)).toBe('0.0');
    });

    it('handles many tracks correctly', () => {
      const tracks: TrackCode[] = Array.from({ length: 5 }, (_, i) => ({
        code: `fn dsp() -> float {\n  sinwave(${440 + i * 10}.0, 0.0)\n}`,
        volume: 100,
        muted: false,
        solo: false,
      }));
      const result = mergeTracks(tracks);
      expect(extractDspBody(result)).toBe('track1() + track2() + track3() + track4() + track5()');
    });

    it('handles whitespace-only code in fallback path', () => {
      const tracks: TrackCode[] = [{ code: '   \n  \t  ', volume: 100, muted: false, solo: false }];
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
          volume: 100,
          muted: false,
          solo: false,
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
