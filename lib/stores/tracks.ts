import { create } from 'zustand';

export interface Track {
  id: string;
  name: string;
  workspaceXml: string;
  volume: number;
  muted: boolean;
  solo: boolean;
}

export interface TrackStore {
  tracks: Track[];
  activeTrackId: string;
  workspaceVersion: number;
  pendingAppendXml: string | null;
  addTrack: () => void;
  removeTrack: (id: string) => void;
  setActiveTrack: (id: string) => void;
  updateTrackWorkspace: (id: string, xml: string) => void;
  loadWorkspaceXml: (xml: string) => void;
  appendWorkspaceXml: (xml: string) => void;
  clearPendingAppend: () => void;
  renameTrack: (id: string, name: string) => void;
  getTrack: (id: string) => Track | undefined;
  setVolume: (id: string, volume: number) => void;
  toggleMute: (id: string) => void;
  toggleSolo: (id: string) => void;
}

let idCounter = 0;

function uniqueId(): string {
  return `${Date.now()}_${++idCounter}`;
}

function makeTrack(name: string): Track {
  return {
    id: uniqueId(),
    name,
    workspaceXml: '',
    volume: 80,
    muted: false,
    solo: false,
  };
}

const ROOM_NAMES = [
  'おへや 🎵',
  'おへや 🎶',
  'おへや 🎹',
  'おへや 🎸',
  'おへや 🥁',
  'おへや 🎺',
  'おへや 🎻',
  'おへや 🪗',
];

const defaultTrack = makeTrack(ROOM_NAMES[0]);

export const useTrackStore = create<TrackStore>((set, get) => ({
  tracks: [defaultTrack],
  activeTrackId: defaultTrack.id,
  workspaceVersion: 0,
  pendingAppendXml: null,

  addTrack: () =>
    set((s) => {
      const name = ROOM_NAMES[s.tracks.length % ROOM_NAMES.length];
      const track = makeTrack(name);
      return { tracks: [...s.tracks, track], activeTrackId: track.id };
    }),

  removeTrack: (id) =>
    set((s) => {
      if (s.tracks.length <= 1) return s;
      const tracks = s.tracks.filter((t) => t.id !== id);
      const activeTrackId = s.activeTrackId === id ? tracks[0].id : s.activeTrackId;
      return { tracks, activeTrackId };
    }),

  setActiveTrack: (id) => set({ activeTrackId: id }),

  updateTrackWorkspace: (id, xml) =>
    set((s) => ({
      tracks: s.tracks.map((t) => (t.id === id ? { ...t, workspaceXml: xml } : t)),
    })),

  loadWorkspaceXml: (xml) =>
    set((s) => ({
      tracks: s.tracks.map((t) => (t.id === s.activeTrackId ? { ...t, workspaceXml: xml } : t)),
      workspaceVersion: s.workspaceVersion + 1,
    })),

  appendWorkspaceXml: (xml) =>
    set({ pendingAppendXml: xml, workspaceVersion: get().workspaceVersion + 1 }),

  clearPendingAppend: () => set({ pendingAppendXml: null }),

  renameTrack: (id, name) =>
    set((s) => ({
      tracks: s.tracks.map((t) => (t.id === id ? { ...t, name } : t)),
    })),

  getTrack: (id) => get().tracks.find((t) => t.id === id),

  setVolume: (id, volume) =>
    set((s) => ({
      tracks: s.tracks.map((t) =>
        t.id === id ? { ...t, volume: Math.max(0, Math.min(100, volume)) } : t,
      ),
    })),

  toggleMute: (id) =>
    set((s) => ({
      tracks: s.tracks.map((t) => (t.id === id ? { ...t, muted: !t.muted } : t)),
    })),

  toggleSolo: (id) =>
    set((s) => ({
      tracks: s.tracks.map((t) => (t.id === id ? { ...t, solo: !t.solo } : t)),
    })),
}));
