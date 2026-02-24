import { create } from 'zustand';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

const STORAGE_KEY = 'biyo_experience';

interface PersistedState {
  level: ExperienceLevel;
  blocksPlaced: number;
  tracksCreated: number;
  effectsUsed: string[];
  achievements: string[];
  manualUnlock: boolean;
}

function loadState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return null;
}

function persistState(state: PersistedState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export interface ExperienceStore {
  level: ExperienceLevel;
  blocksPlaced: number;
  tracksCreated: number;
  effectsUsed: Set<string>;
  achievements: string[];
  manualUnlock: boolean;
  incrementBlocksPlaced: () => void;
  incrementTracksCreated: () => void;
  addEffectUsed: (type: string) => void;
  unlockAll: () => void;
  resetExperience: () => void;
  loadFromStorage: () => void;
}

/** All effect block types for tracking */
const EFFECT_BLOCK_TYPES = new Set([
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
]);

export function isEffectBlock(type: string): boolean {
  return EFFECT_BLOCK_TYPES.has(type);
}

function computeLevel(
  blocksPlaced: number,
  tracksCreated: number,
  effectsUsedCount: number,
  manualUnlock: boolean,
): ExperienceLevel {
  if (manualUnlock) return 'advanced';

  // Advanced: 5+ different effect types OR 3+ tracks
  if (effectsUsedCount >= 5 || tracksCreated >= 3) {
    return 'advanced';
  }

  // Intermediate: 10+ blocks placed OR 2+ tracks
  if (blocksPlaced >= 10 || tracksCreated >= 2) {
    return 'intermediate';
  }

  return 'beginner';
}

export const useExperienceStore = create<ExperienceStore>((set, get) => ({
  level: 'beginner',
  blocksPlaced: 0,
  tracksCreated: 0,
  effectsUsed: new Set<string>(),
  achievements: [],
  manualUnlock: false,

  loadFromStorage: () => {
    const saved = loadState();
    if (saved) {
      const effectsUsed = new Set(saved.effectsUsed);
      set({
        level: saved.manualUnlock
          ? 'advanced'
          : computeLevel(
              saved.blocksPlaced,
              saved.tracksCreated,
              effectsUsed.size,
              saved.manualUnlock,
            ),
        blocksPlaced: saved.blocksPlaced,
        tracksCreated: saved.tracksCreated,
        effectsUsed,
        achievements: saved.achievements,
        manualUnlock: saved.manualUnlock,
      });
    }
  },

  incrementBlocksPlaced: () => {
    const state = get();
    const blocksPlaced = state.blocksPlaced + 1;
    const newLevel = computeLevel(
      blocksPlaced,
      state.tracksCreated,
      state.effectsUsed.size,
      state.manualUnlock,
    );

    set({ blocksPlaced, level: newLevel });
    persistState({
      level: newLevel,
      blocksPlaced,
      tracksCreated: state.tracksCreated,
      effectsUsed: [...state.effectsUsed],
      achievements: state.achievements,
      manualUnlock: state.manualUnlock,
    });
  },

  incrementTracksCreated: () => {
    const state = get();
    const tracksCreated = state.tracksCreated + 1;
    const newLevel = computeLevel(
      state.blocksPlaced,
      tracksCreated,
      state.effectsUsed.size,
      state.manualUnlock,
    );

    set({ tracksCreated, level: newLevel });
    persistState({
      level: newLevel,
      blocksPlaced: state.blocksPlaced,
      tracksCreated,
      effectsUsed: [...state.effectsUsed],
      achievements: state.achievements,
      manualUnlock: state.manualUnlock,
    });
  },

  addEffectUsed: (type: string) => {
    const state = get();
    if (state.effectsUsed.has(type)) return;

    const effectsUsed = new Set(state.effectsUsed);
    effectsUsed.add(type);
    const newLevel = computeLevel(
      state.blocksPlaced,
      state.tracksCreated,
      effectsUsed.size,
      state.manualUnlock,
    );

    set({ effectsUsed, level: newLevel });
    persistState({
      level: newLevel,
      blocksPlaced: state.blocksPlaced,
      tracksCreated: state.tracksCreated,
      effectsUsed: [...effectsUsed],
      achievements: state.achievements,
      manualUnlock: state.manualUnlock,
    });
  },

  unlockAll: () => {
    const state = get();
    set({ level: 'advanced', manualUnlock: true });
    persistState({
      level: 'advanced',
      blocksPlaced: state.blocksPlaced,
      tracksCreated: state.tracksCreated,
      effectsUsed: [...state.effectsUsed],
      achievements: state.achievements,
      manualUnlock: true,
    });
  },

  resetExperience: () => {
    set({
      level: 'beginner',
      blocksPlaced: 0,
      tracksCreated: 0,
      effectsUsed: new Set<string>(),
      achievements: [],
      manualUnlock: false,
    });
    persistState({
      level: 'beginner',
      blocksPlaced: 0,
      tracksCreated: 0,
      effectsUsed: [],
      achievements: [],
      manualUnlock: false,
    });
  },
}));
