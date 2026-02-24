import { create } from 'zustand';
import { mergeTracks } from '@/lib/blockly/generator/code-merger';
import type { TrackCode } from '@/lib/blockly/generator/code-merger';
import { useTrackStore } from './tracks';

export type CompileStatus = 'ready' | 'compiling' | 'error';

export interface CompileStore {
  generatedCode: string;
  compileError: string | null;
  status: CompileStatus;
  trackCodes: Record<string, string>;
  setGeneratedCode: (code: string) => void;
  setTrackCode: (trackId: string, code: string) => void;
  removeTrackCode: (trackId: string) => void;
  getMergedCode: () => string;
  setError: (error: string | null) => void;
  setStatus: (status: CompileStatus) => void;
}

export const useCompileStore = create<CompileStore>((set, get) => ({
  generatedCode: '',
  compileError: null,
  status: 'ready',
  trackCodes: {},

  setGeneratedCode: (code) => set({ generatedCode: code, compileError: null, status: 'ready' }),

  setTrackCode: (trackId, code) =>
    set((s) => ({
      trackCodes: { ...s.trackCodes, [trackId]: code },
    })),

  removeTrackCode: (trackId) =>
    set((s) => {
      const { [trackId]: _, ...rest } = s.trackCodes;
      return { trackCodes: rest };
    }),

  getMergedCode: () => {
    const { trackCodes } = get();
    const tracks = useTrackStore.getState().tracks;

    const trackCodeList: TrackCode[] = [];
    for (const track of tracks) {
      const code = trackCodes[track.id];
      if (!code || code.trim() === '') continue;
      trackCodeList.push({
        code,
        volume: track.volume,
        muted: track.muted,
        solo: track.solo,
      });
    }

    if (trackCodeList.length === 0) {
      // Fallback: return the active track's generatedCode if no trackCodes stored
      return get().generatedCode;
    }

    if (trackCodeList.length === 1) {
      // Single track: return its code directly (no merge overhead)
      return trackCodeList[0].code;
    }

    return mergeTracks(trackCodeList);
  },

  setError: (error) => set({ compileError: error }),
  setStatus: (status) => set({ status }),
}));
