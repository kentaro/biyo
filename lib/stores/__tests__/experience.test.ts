import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isEffectBlock, useExperienceStore } from '../experience';

/* ------------------------------------------------------------------ */
/*  localStorage mock                                                  */
/* ------------------------------------------------------------------ */

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get _store() {
      return store;
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = 'biyo_experience';

function resetStore() {
  useExperienceStore.setState({
    level: 'beginner',
    blocksPlaced: 0,
    tracksCreated: 0,
    effectsUsed: new Set<string>(),
    achievements: [],
    manualUnlock: false,
  });
}

function getPersistedState() {
  const raw = localStorageMock.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe('useExperienceStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    resetStore();
  });

  /* ---------- initial state ---------- */

  describe('initial state', () => {
    it('starts at beginner level with zeroed counters', () => {
      const state = useExperienceStore.getState();
      expect(state.level).toBe('beginner');
      expect(state.blocksPlaced).toBe(0);
      expect(state.tracksCreated).toBe(0);
      expect(state.effectsUsed).toEqual(new Set());
      expect(state.achievements).toEqual([]);
      expect(state.manualUnlock).toBe(false);
    });
  });

  /* ---------- loadFromStorage ---------- */

  describe('loadFromStorage', () => {
    it('does nothing when localStorage is empty', () => {
      useExperienceStore.getState().loadFromStorage();
      const state = useExperienceStore.getState();
      expect(state.level).toBe('beginner');
      expect(state.blocksPlaced).toBe(0);
    });

    it('restores persisted state and recomputes level', () => {
      localStorageMock.setItem(
        STORAGE_KEY,
        JSON.stringify({
          level: 'beginner',
          blocksPlaced: 15,
          tracksCreated: 1,
          effectsUsed: ['biyo_delay'],
          achievements: ['first_block'],
          manualUnlock: false,
        }),
      );

      useExperienceStore.getState().loadFromStorage();
      const state = useExperienceStore.getState();
      expect(state.blocksPlaced).toBe(15);
      expect(state.tracksCreated).toBe(1);
      expect(state.effectsUsed).toEqual(new Set(['biyo_delay']));
      expect(state.achievements).toEqual(['first_block']);
      expect(state.manualUnlock).toBe(false);
      // 15 blocks >= 10 → intermediate
      expect(state.level).toBe('intermediate');
    });

    it('restores manualUnlock=true as advanced regardless of counters', () => {
      localStorageMock.setItem(
        STORAGE_KEY,
        JSON.stringify({
          level: 'beginner',
          blocksPlaced: 0,
          tracksCreated: 0,
          effectsUsed: [],
          achievements: [],
          manualUnlock: true,
        }),
      );

      useExperienceStore.getState().loadFromStorage();
      const state = useExperienceStore.getState();
      expect(state.level).toBe('advanced');
      expect(state.manualUnlock).toBe(true);
    });

    it('handles corrupted JSON gracefully (falls back to null)', () => {
      localStorageMock.getItem.mockReturnValueOnce('NOT_JSON{{{');

      useExperienceStore.getState().loadFromStorage();
      const state = useExperienceStore.getState();
      // Should remain at default because loadState returns null
      expect(state.level).toBe('beginner');
      expect(state.blocksPlaced).toBe(0);
    });

    it('handles localStorage.getItem throwing an error', () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('access denied');
      });

      useExperienceStore.getState().loadFromStorage();
      const state = useExperienceStore.getState();
      expect(state.level).toBe('beginner');
    });

    it('loads advanced level from storage when effectsUsed >= 5', () => {
      localStorageMock.setItem(
        STORAGE_KEY,
        JSON.stringify({
          level: 'beginner',
          blocksPlaced: 0,
          tracksCreated: 0,
          effectsUsed: ['a', 'b', 'c', 'd', 'e'],
          achievements: [],
          manualUnlock: false,
        }),
      );

      useExperienceStore.getState().loadFromStorage();
      expect(useExperienceStore.getState().level).toBe('advanced');
    });

    it('loads advanced level from storage when tracksCreated >= 3', () => {
      localStorageMock.setItem(
        STORAGE_KEY,
        JSON.stringify({
          level: 'beginner',
          blocksPlaced: 0,
          tracksCreated: 3,
          effectsUsed: [],
          achievements: [],
          manualUnlock: false,
        }),
      );

      useExperienceStore.getState().loadFromStorage();
      expect(useExperienceStore.getState().level).toBe('advanced');
    });

    it('loads intermediate level when tracksCreated == 2', () => {
      localStorageMock.setItem(
        STORAGE_KEY,
        JSON.stringify({
          level: 'beginner',
          blocksPlaced: 0,
          tracksCreated: 2,
          effectsUsed: [],
          achievements: [],
          manualUnlock: false,
        }),
      );

      useExperienceStore.getState().loadFromStorage();
      expect(useExperienceStore.getState().level).toBe('intermediate');
    });
  });

  /* ---------- incrementBlocksPlaced ---------- */

  describe('incrementBlocksPlaced', () => {
    it('increments blocksPlaced by 1', () => {
      useExperienceStore.getState().incrementBlocksPlaced();
      expect(useExperienceStore.getState().blocksPlaced).toBe(1);
    });

    it('stays at beginner below 10 blocks', () => {
      for (let i = 0; i < 9; i++) {
        useExperienceStore.getState().incrementBlocksPlaced();
      }
      expect(useExperienceStore.getState().blocksPlaced).toBe(9);
      expect(useExperienceStore.getState().level).toBe('beginner');
    });

    it('transitions to intermediate at exactly 10 blocks', () => {
      for (let i = 0; i < 10; i++) {
        useExperienceStore.getState().incrementBlocksPlaced();
      }
      expect(useExperienceStore.getState().blocksPlaced).toBe(10);
      expect(useExperienceStore.getState().level).toBe('intermediate');
    });

    it('persists state to localStorage on each call', () => {
      useExperienceStore.getState().incrementBlocksPlaced();
      const persisted = getPersistedState();
      expect(persisted).not.toBeNull();
      expect(persisted.blocksPlaced).toBe(1);
      expect(persisted.level).toBe('beginner');
    });

    it('persists all current state fields correctly', () => {
      // First add some effects so we have richer state
      useExperienceStore.getState().addEffectUsed('biyo_delay');
      useExperienceStore.getState().incrementBlocksPlaced();

      const persisted = getPersistedState();
      expect(persisted.effectsUsed).toEqual(['biyo_delay']);
      expect(persisted.blocksPlaced).toBe(1);
      expect(persisted.tracksCreated).toBe(0);
      expect(persisted.achievements).toEqual([]);
      expect(persisted.manualUnlock).toBe(false);
    });
  });

  /* ---------- incrementTracksCreated ---------- */

  describe('incrementTracksCreated', () => {
    it('increments tracksCreated by 1', () => {
      useExperienceStore.getState().incrementTracksCreated();
      expect(useExperienceStore.getState().tracksCreated).toBe(1);
    });

    it('stays beginner at 1 track', () => {
      useExperienceStore.getState().incrementTracksCreated();
      expect(useExperienceStore.getState().level).toBe('beginner');
    });

    it('transitions to intermediate at 2 tracks', () => {
      useExperienceStore.getState().incrementTracksCreated();
      useExperienceStore.getState().incrementTracksCreated();
      expect(useExperienceStore.getState().tracksCreated).toBe(2);
      expect(useExperienceStore.getState().level).toBe('intermediate');
    });

    it('transitions to advanced at 3 tracks', () => {
      for (let i = 0; i < 3; i++) {
        useExperienceStore.getState().incrementTracksCreated();
      }
      expect(useExperienceStore.getState().tracksCreated).toBe(3);
      expect(useExperienceStore.getState().level).toBe('advanced');
    });

    it('persists state to localStorage on each call', () => {
      useExperienceStore.getState().incrementTracksCreated();
      const persisted = getPersistedState();
      expect(persisted.tracksCreated).toBe(1);
    });
  });

  /* ---------- addEffectUsed ---------- */

  describe('addEffectUsed', () => {
    it('adds a new effect type to the set', () => {
      useExperienceStore.getState().addEffectUsed('biyo_delay');
      expect(useExperienceStore.getState().effectsUsed.has('biyo_delay')).toBe(true);
      expect(useExperienceStore.getState().effectsUsed.size).toBe(1);
    });

    it('does NOT add a duplicate effect type (early return)', () => {
      useExperienceStore.getState().addEffectUsed('biyo_delay');
      useExperienceStore.getState().addEffectUsed('biyo_delay');
      expect(useExperienceStore.getState().effectsUsed.size).toBe(1);
      // localStorage.setItem should have been called only once for the first add
      const setItemCalls = localStorageMock.setItem.mock.calls.filter(
        ([key]: [string, string]) => key === STORAGE_KEY,
      );
      expect(setItemCalls.length).toBe(1);
    });

    it('stays beginner with fewer than 5 effects', () => {
      for (const e of ['a', 'b', 'c', 'd']) {
        useExperienceStore.getState().addEffectUsed(e);
      }
      expect(useExperienceStore.getState().effectsUsed.size).toBe(4);
      expect(useExperienceStore.getState().level).toBe('beginner');
    });

    it('transitions to advanced at exactly 5 different effects', () => {
      for (const e of ['a', 'b', 'c', 'd', 'e']) {
        useExperienceStore.getState().addEffectUsed(e);
      }
      expect(useExperienceStore.getState().effectsUsed.size).toBe(5);
      expect(useExperienceStore.getState().level).toBe('advanced');
    });

    it('persists effectsUsed as an array in localStorage', () => {
      useExperienceStore.getState().addEffectUsed('biyo_reverb');
      const persisted = getPersistedState();
      expect(Array.isArray(persisted.effectsUsed)).toBe(true);
      expect(persisted.effectsUsed).toContain('biyo_reverb');
    });

    it('does not update state or persist when duplicate is added', () => {
      useExperienceStore.getState().addEffectUsed('biyo_delay');
      const stateAfterFirst = useExperienceStore.getState();

      // Clear mocks to track second call
      vi.clearAllMocks();

      useExperienceStore.getState().addEffectUsed('biyo_delay');
      // setItem should NOT be called again
      expect(localStorageMock.setItem).not.toHaveBeenCalled();

      // State reference for effectsUsed should be the same (no set() call)
      const stateAfterSecond = useExperienceStore.getState();
      expect(stateAfterSecond.effectsUsed).toBe(stateAfterFirst.effectsUsed);
    });
  });

  /* ---------- unlockAll ---------- */

  describe('unlockAll', () => {
    it('sets level to advanced and manualUnlock to true', () => {
      useExperienceStore.getState().unlockAll();
      const state = useExperienceStore.getState();
      expect(state.level).toBe('advanced');
      expect(state.manualUnlock).toBe(true);
    });

    it('persists the unlocked state', () => {
      useExperienceStore.getState().unlockAll();
      const persisted = getPersistedState();
      expect(persisted.level).toBe('advanced');
      expect(persisted.manualUnlock).toBe(true);
    });

    it('preserves existing counters when unlocking', () => {
      // Build up some state first
      for (let i = 0; i < 5; i++) {
        useExperienceStore.getState().incrementBlocksPlaced();
      }
      useExperienceStore.getState().addEffectUsed('biyo_delay');

      useExperienceStore.getState().unlockAll();
      const persisted = getPersistedState();
      expect(persisted.blocksPlaced).toBe(5);
      expect(persisted.effectsUsed).toContain('biyo_delay');
      expect(persisted.manualUnlock).toBe(true);
    });
  });

  /* ---------- resetExperience ---------- */

  describe('resetExperience', () => {
    it('resets all state to initial values', () => {
      // Build up state
      for (let i = 0; i < 15; i++) {
        useExperienceStore.getState().incrementBlocksPlaced();
      }
      useExperienceStore.getState().addEffectUsed('biyo_delay');
      useExperienceStore.getState().unlockAll();

      // Now reset
      useExperienceStore.getState().resetExperience();
      const state = useExperienceStore.getState();
      expect(state.level).toBe('beginner');
      expect(state.blocksPlaced).toBe(0);
      expect(state.tracksCreated).toBe(0);
      expect(state.effectsUsed).toEqual(new Set());
      expect(state.achievements).toEqual([]);
      expect(state.manualUnlock).toBe(false);
    });

    it('persists the reset state to localStorage', () => {
      useExperienceStore.getState().unlockAll();
      useExperienceStore.getState().resetExperience();

      const persisted = getPersistedState();
      expect(persisted.level).toBe('beginner');
      expect(persisted.blocksPlaced).toBe(0);
      expect(persisted.tracksCreated).toBe(0);
      expect(persisted.effectsUsed).toEqual([]);
      expect(persisted.achievements).toEqual([]);
      expect(persisted.manualUnlock).toBe(false);
    });
  });

  /* ---------- computeLevel transitions (via store actions) ---------- */

  describe('computeLevel transitions', () => {
    it('beginner → intermediate via blocksPlaced == 10', () => {
      for (let i = 0; i < 10; i++) {
        useExperienceStore.getState().incrementBlocksPlaced();
      }
      expect(useExperienceStore.getState().level).toBe('intermediate');
    });

    it('beginner → intermediate via tracksCreated == 2', () => {
      useExperienceStore.getState().incrementTracksCreated();
      useExperienceStore.getState().incrementTracksCreated();
      expect(useExperienceStore.getState().level).toBe('intermediate');
    });

    it('beginner → advanced via effectsUsed == 5 (skipping intermediate)', () => {
      for (const e of ['a', 'b', 'c', 'd', 'e']) {
        useExperienceStore.getState().addEffectUsed(e);
      }
      expect(useExperienceStore.getState().level).toBe('advanced');
    });

    it('beginner → advanced via tracksCreated == 3 (skipping intermediate)', () => {
      for (let i = 0; i < 3; i++) {
        useExperienceStore.getState().incrementTracksCreated();
      }
      expect(useExperienceStore.getState().level).toBe('advanced');
    });

    it('intermediate → advanced via effectsUsed reaching 5', () => {
      // Get to intermediate first with blocks
      for (let i = 0; i < 10; i++) {
        useExperienceStore.getState().incrementBlocksPlaced();
      }
      expect(useExperienceStore.getState().level).toBe('intermediate');

      // Now add 5 effects to reach advanced
      for (const e of ['a', 'b', 'c', 'd', 'e']) {
        useExperienceStore.getState().addEffectUsed(e);
      }
      expect(useExperienceStore.getState().level).toBe('advanced');
    });

    it('intermediate → advanced via tracksCreated reaching 3', () => {
      // Get to intermediate with 2 tracks
      useExperienceStore.getState().incrementTracksCreated();
      useExperienceStore.getState().incrementTracksCreated();
      expect(useExperienceStore.getState().level).toBe('intermediate');

      // Third track → advanced
      useExperienceStore.getState().incrementTracksCreated();
      expect(useExperienceStore.getState().level).toBe('advanced');
    });

    it('manualUnlock always results in advanced regardless of counters', () => {
      useExperienceStore.getState().unlockAll();
      expect(useExperienceStore.getState().level).toBe('advanced');

      // Even incrementing blocks should stay advanced
      useExperienceStore.getState().incrementBlocksPlaced();
      expect(useExperienceStore.getState().level).toBe('advanced');
    });

    it('remains at advanced once already at advanced level', () => {
      // Reach advanced through effects
      for (const e of ['a', 'b', 'c', 'd', 'e']) {
        useExperienceStore.getState().addEffectUsed(e);
      }
      expect(useExperienceStore.getState().level).toBe('advanced');

      // More blocks should not downgrade
      useExperienceStore.getState().incrementBlocksPlaced();
      expect(useExperienceStore.getState().level).toBe('advanced');
    });
  });

  /* ---------- localStorage persistence ---------- */

  describe('localStorage persistence', () => {
    it('writes to correct storage key', () => {
      useExperienceStore.getState().incrementBlocksPlaced();
      expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEY, expect.any(String));
    });

    it('round-trips through localStorage correctly', () => {
      // Build state
      for (let i = 0; i < 12; i++) {
        useExperienceStore.getState().incrementBlocksPlaced();
      }
      useExperienceStore.getState().addEffectUsed('biyo_reverb');
      useExperienceStore.getState().addEffectUsed('biyo_delay');
      useExperienceStore.getState().incrementTracksCreated();

      // Reset in-memory state
      resetStore();
      expect(useExperienceStore.getState().blocksPlaced).toBe(0);

      // Reload from storage
      useExperienceStore.getState().loadFromStorage();
      const state = useExperienceStore.getState();
      expect(state.blocksPlaced).toBe(12);
      expect(state.tracksCreated).toBe(1);
      expect(state.effectsUsed).toEqual(new Set(['biyo_reverb', 'biyo_delay']));
      expect(state.level).toBe('intermediate');
    });
  });
});

/* ------------------------------------------------------------------ */
/*  isEffectBlock                                                      */
/* ------------------------------------------------------------------ */

describe('isEffectBlock', () => {
  const knownEffects = [
    'biyo_lowpass',
    'biyo_highpass',
    'biyo_bandpass',
    'biyo_delay',
    'biyo_pingpong',
    'biyo_reverb',
    'biyo_tremolo',
    'biyo_autowah',
    'biyo_vibrato',
    'biyo_distortion',
    'biyo_gain_up',
    'biyo_gain_down',
    'biyo_telephone',
  ];

  for (const effectType of knownEffects) {
    it(`returns true for known effect "${effectType}"`, () => {
      expect(isEffectBlock(effectType)).toBe(true);
    });
  }

  it('returns false for non-effect types', () => {
    expect(isEffectBlock('biyo_note')).toBe(false);
    expect(isEffectBlock('biyo_rest')).toBe(false);
    expect(isEffectBlock('biyo_loop')).toBe(false);
    expect(isEffectBlock('')).toBe(false);
    expect(isEffectBlock('random_string')).toBe(false);
    expect(isEffectBlock('lowpass')).toBe(false);
  });
});
