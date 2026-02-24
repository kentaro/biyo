import { beforeEach, describe, expect, it } from 'vitest';
import { PREAMBLE } from '@/lib/blockly/generator/mimium-generator';
import type { CompileStore } from '../compile';
import { useCompileStore } from '../compile';
import { useTrackStore } from '../tracks';

function getStore(): CompileStore {
  return useCompileStore.getState();
}

describe('CompileStore', () => {
  beforeEach(() => {
    useCompileStore.setState(useCompileStore.getInitialState(), true);
    useTrackStore.setState(useTrackStore.getInitialState(), true);
  });

  // ----------------------------------------------------------------
  // Initial state
  // ----------------------------------------------------------------
  describe('initial state', () => {
    it('generatedCode is empty string', () => {
      expect(getStore().generatedCode).toBe('');
    });

    it('compileError is null', () => {
      expect(getStore().compileError).toBeNull();
    });

    it("status is 'ready'", () => {
      expect(getStore().status).toBe('ready');
    });

    it('trackCodes is empty object', () => {
      expect(getStore().trackCodes).toEqual({});
    });
  });

  // ----------------------------------------------------------------
  // setGeneratedCode
  // ----------------------------------------------------------------
  describe('setGeneratedCode', () => {
    it('updates generatedCode', () => {
      const code = 'playNote("C4", 0.5);';
      getStore().setGeneratedCode(code);
      expect(getStore().generatedCode).toBe(code);
    });

    it('can set code to empty string', () => {
      getStore().setGeneratedCode('some code');
      getStore().setGeneratedCode('');
      expect(getStore().generatedCode).toBe('');
    });

    it('handles multiline code', () => {
      const code = 'playNote("C4", 0.5);\nplayNote("D4", 0.5);';
      getStore().setGeneratedCode(code);
      expect(getStore().generatedCode).toBe(code);
    });

    it('clears compileError when new code is set', () => {
      getStore().setError('Previous error');
      expect(getStore().compileError).toBe('Previous error');
      getStore().setGeneratedCode('new code');
      expect(getStore().compileError).toBeNull();
    });

    it('resets status to ready when new code is set', () => {
      getStore().setStatus('error');
      expect(getStore().status).toBe('error');
      getStore().setGeneratedCode('new code');
      expect(getStore().status).toBe('ready');
    });
  });

  // ----------------------------------------------------------------
  // setStatus
  // ----------------------------------------------------------------
  describe('setStatus', () => {
    it("sets status to 'compiling'", () => {
      getStore().setStatus('compiling');
      expect(getStore().status).toBe('compiling');
    });

    it("sets status to 'error'", () => {
      getStore().setStatus('error');
      expect(getStore().status).toBe('error');
    });

    it("sets status back to 'ready'", () => {
      getStore().setStatus('compiling');
      getStore().setStatus('ready');
      expect(getStore().status).toBe('ready');
    });
  });

  // ----------------------------------------------------------------
  // setError
  // ----------------------------------------------------------------
  describe('setError', () => {
    it('sets error message', () => {
      getStore().setError('Syntax error at line 5');
      expect(getStore().compileError).toBe('Syntax error at line 5');
    });

    it('clears error by setting null', () => {
      getStore().setError('Some error');
      getStore().setError(null);
      expect(getStore().compileError).toBeNull();
    });

    it('can overwrite existing error', () => {
      getStore().setError('First error');
      getStore().setError('Second error');
      expect(getStore().compileError).toBe('Second error');
    });
  });

  // ----------------------------------------------------------------
  // setTrackCode / removeTrackCode
  // ----------------------------------------------------------------
  describe('setTrackCode', () => {
    it('stores code for a track', () => {
      getStore().setTrackCode('track-1', 'code-1');
      expect(getStore().trackCodes['track-1']).toBe('code-1');
    });

    it('stores code for multiple tracks', () => {
      getStore().setTrackCode('track-1', 'code-1');
      getStore().setTrackCode('track-2', 'code-2');
      expect(getStore().trackCodes['track-1']).toBe('code-1');
      expect(getStore().trackCodes['track-2']).toBe('code-2');
    });

    it('overwrites code for existing track', () => {
      getStore().setTrackCode('track-1', 'old-code');
      getStore().setTrackCode('track-1', 'new-code');
      expect(getStore().trackCodes['track-1']).toBe('new-code');
    });
  });

  describe('removeTrackCode', () => {
    it('removes code for a track', () => {
      getStore().setTrackCode('track-1', 'code-1');
      getStore().setTrackCode('track-2', 'code-2');
      getStore().removeTrackCode('track-1');
      expect(getStore().trackCodes['track-1']).toBeUndefined();
      expect(getStore().trackCodes['track-2']).toBe('code-2');
    });

    it('does nothing if track not present', () => {
      getStore().setTrackCode('track-1', 'code-1');
      getStore().removeTrackCode('track-nonexistent');
      expect(getStore().trackCodes['track-1']).toBe('code-1');
    });
  });

  // ----------------------------------------------------------------
  // getMergedCode
  // ----------------------------------------------------------------
  describe('getMergedCode', () => {
    it('returns generatedCode when no trackCodes are stored', () => {
      getStore().setGeneratedCode('fallback-code');
      expect(getStore().getMergedCode()).toBe('fallback-code');
    });

    it('returns single track code directly when only one track has code', () => {
      const trackId = useTrackStore.getState().tracks[0].id;
      const code = `${PREAMBLE}\n\nfn dsp() -> float {\n  sinwave(440.0, 0.0)\n}`;
      getStore().setTrackCode(trackId, code);
      expect(getStore().getMergedCode()).toBe(code);
    });

    it('merges multiple tracks using mergeTracks', () => {
      // Add a second track
      useTrackStore.getState().addTrack();
      const tracks = useTrackStore.getState().tracks;
      expect(tracks.length).toBe(2);

      const code1 = `${PREAMBLE}\n\nfn dsp() -> float {\n  sinwave(440.0, 0.0)\n}`;
      const code2 = `${PREAMBLE}\n\nfn dsp() -> float {\n  saw(220.0, 0.0)\n}`;

      getStore().setTrackCode(tracks[0].id, code1);
      getStore().setTrackCode(tracks[1].id, code2);

      const merged = getStore().getMergedCode();

      // Merged code should contain both track functions
      expect(merged).toContain('fn track1()');
      expect(merged).toContain('fn track2()');
      expect(merged).toContain('sinwave(440.0, 0.0)');
      expect(merged).toContain('saw(220.0, 0.0)');
      expect(merged).toContain('fn dsp()');
    });

    it('skips tracks with empty code', () => {
      useTrackStore.getState().addTrack();
      const tracks = useTrackStore.getState().tracks;

      const code1 = `${PREAMBLE}\n\nfn dsp() -> float {\n  sinwave(440.0, 0.0)\n}`;
      getStore().setTrackCode(tracks[0].id, code1);
      // track[1] has no code set

      // Only one track with code, so it returns that code directly
      expect(getStore().getMergedCode()).toBe(code1);
    });

    it('respects muted tracks', () => {
      useTrackStore.getState().addTrack();
      const tracks = useTrackStore.getState().tracks;

      const code1 = `${PREAMBLE}\n\nfn dsp() -> float {\n  sinwave(440.0, 0.0)\n}`;
      const code2 = `${PREAMBLE}\n\nfn dsp() -> float {\n  saw(220.0, 0.0)\n}`;

      getStore().setTrackCode(tracks[0].id, code1);
      getStore().setTrackCode(tracks[1].id, code2);

      // Mute the first track
      useTrackStore.getState().toggleMute(tracks[0].id);

      const merged = getStore().getMergedCode();
      // Should only contain the second track's code (unmuted)
      expect(merged).toContain('saw(220.0, 0.0)');
      expect(merged).not.toContain('track1');
    });

    it('respects solo tracks', () => {
      useTrackStore.getState().addTrack();
      const tracks = useTrackStore.getState().tracks;

      const code1 = `${PREAMBLE}\n\nfn dsp() -> float {\n  sinwave(440.0, 0.0)\n}`;
      const code2 = `${PREAMBLE}\n\nfn dsp() -> float {\n  saw(220.0, 0.0)\n}`;

      getStore().setTrackCode(tracks[0].id, code1);
      getStore().setTrackCode(tracks[1].id, code2);

      // Solo the first track
      useTrackStore.getState().toggleSolo(tracks[0].id);

      const merged = getStore().getMergedCode();
      // Should only contain the first track's code (soloed)
      expect(merged).toContain('sinwave(440.0, 0.0)');
      expect(merged).not.toContain('track2');
    });
  });
});
