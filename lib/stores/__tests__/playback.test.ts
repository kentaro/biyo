import { beforeEach, describe, expect, it } from 'vitest';
import type { PlaybackStore } from '../playback';
import { usePlaybackStore } from '../playback';

function getStore(): PlaybackStore {
  return usePlaybackStore.getState();
}

describe('PlaybackStore', () => {
  beforeEach(() => {
    usePlaybackStore.setState(usePlaybackStore.getInitialState(), true);
  });

  // ----------------------------------------------------------------
  // Initial state
  // ----------------------------------------------------------------
  describe('initial state', () => {
    it('isPlaying is false', () => {
      expect(getStore().isPlaying).toBe(false);
    });

    it('bpm is 120', () => {
      expect(getStore().bpm).toBe(120);
    });
  });

  // ----------------------------------------------------------------
  // setIsPlaying
  // ----------------------------------------------------------------
  describe('setIsPlaying', () => {
    it('sets isPlaying to true', () => {
      getStore().setIsPlaying(true);
      expect(getStore().isPlaying).toBe(true);
    });

    it('sets isPlaying to false', () => {
      getStore().setIsPlaying(true);
      getStore().setIsPlaying(false);
      expect(getStore().isPlaying).toBe(false);
    });

    it('can toggle back and forth', () => {
      getStore().setIsPlaying(true);
      expect(getStore().isPlaying).toBe(true);
      getStore().setIsPlaying(false);
      expect(getStore().isPlaying).toBe(false);
      getStore().setIsPlaying(true);
      expect(getStore().isPlaying).toBe(true);
    });
  });

  // ----------------------------------------------------------------
  // setBpm
  // ----------------------------------------------------------------
  describe('setBpm', () => {
    it('sets bpm to a valid value', () => {
      getStore().setBpm(140);
      expect(getStore().bpm).toBe(140);
    });

    it('clamps bpm to minimum of 20', () => {
      getStore().setBpm(5);
      expect(getStore().bpm).toBe(20);
    });

    it('clamps bpm to maximum of 300', () => {
      getStore().setBpm(500);
      expect(getStore().bpm).toBe(300);
    });

    it('accepts boundary value 20', () => {
      getStore().setBpm(20);
      expect(getStore().bpm).toBe(20);
    });

    it('accepts boundary value 300', () => {
      getStore().setBpm(300);
      expect(getStore().bpm).toBe(300);
    });

    it('clamps negative values to 20', () => {
      getStore().setBpm(-10);
      expect(getStore().bpm).toBe(20);
    });

    it('clamps zero to 20', () => {
      getStore().setBpm(0);
      expect(getStore().bpm).toBe(20);
    });
  });
});
