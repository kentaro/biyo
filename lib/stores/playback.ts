import { create } from 'zustand';

export interface PlaybackStore {
  isPlaying: boolean;
  bpm: number;
  setIsPlaying: (v: boolean) => void;
  setBpm: (bpm: number) => void;
}

export const usePlaybackStore = create<PlaybackStore>((set) => ({
  isPlaying: false,
  bpm: 120,

  setIsPlaying: (v) => set({ isPlaying: v }),
  setBpm: (bpm) => set({ bpm: Math.max(20, Math.min(300, bpm)) }),
}));
