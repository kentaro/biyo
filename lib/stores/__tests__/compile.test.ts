import { beforeEach, describe, expect, it } from 'vitest';
import type { CompileStore } from '../compile';
import { useCompileStore } from '../compile';

function getStore(): CompileStore {
  return useCompileStore.getState();
}

describe('CompileStore', () => {
  beforeEach(() => {
    useCompileStore.setState(useCompileStore.getInitialState(), true);
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
});
