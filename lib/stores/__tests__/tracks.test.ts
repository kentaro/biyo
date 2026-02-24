import { beforeEach, describe, expect, it } from 'vitest';
import type { TrackStore } from '../tracks';
import { useTrackStore } from '../tracks';

/**
 * Helper: reset the zustand store to its initial state before each test.
 * We call getState().addTrack() etc. directly — zustand stores work outside
 * React when accessed via getState / setState.
 */
function getStore(): TrackStore {
  return useTrackStore.getState();
}

describe('TrackStore', () => {
  beforeEach(() => {
    // Reset store to a clean single-track state.
    // We replace state entirely to avoid leaking between tests.
    const fresh = useTrackStore.getInitialState();
    useTrackStore.setState(fresh, true);
  });

  // ----------------------------------------------------------------
  // addTrack
  // ----------------------------------------------------------------
  describe('addTrack', () => {
    it('creates a track with a unique ID', () => {
      const before = getStore().tracks.length;
      getStore().addTrack();
      const after = getStore().tracks;
      expect(after.length).toBe(before + 1);

      const newTrack = after[after.length - 1];
      expect(newTrack.id).toBeDefined();
      expect(typeof newTrack.id).toBe('string');
      expect(newTrack.id.length).toBeGreaterThan(0);
    });

    it('assigns unique IDs to each new track', () => {
      getStore().addTrack();
      getStore().addTrack();
      const ids = getStore().tracks.map((t) => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('sets the newly created track as active', () => {
      getStore().addTrack();
      const tracks = getStore().tracks;
      const newest = tracks[tracks.length - 1];
      expect(getStore().activeTrackId).toBe(newest.id);
    });

    it('assigns name from ROOM_NAMES cycling by index', () => {
      // Initial track occupies index 0, so next track gets index 1.
      getStore().addTrack();
      const second = getStore().tracks[1];
      // The second room name in the store source
      expect(second.name).toContain('おへや');
    });

    it('wraps ROOM_NAMES when tracks exceed the array length', () => {
      // ROOM_NAMES has 8 entries. Add 8 more tracks (total 9 with the default).
      // The 9th track (index 8) should wrap to ROOM_NAMES[8 % 8] = ROOM_NAMES[0].
      for (let i = 0; i < 8; i++) {
        getStore().addTrack();
      }
      const tracks = getStore().tracks;
      expect(tracks.length).toBe(9);
      // Track at index 8 wraps: 8 % 8 === 0, so same name as index 0
      expect(tracks[8].name).toBe(tracks[0].name);
    });

    it('new track has default property values', () => {
      getStore().addTrack();
      const track = getStore().tracks[getStore().tracks.length - 1];
      expect(track.workspaceXml).toBe('');
      expect(track.volume).toBe(80);
      expect(track.muted).toBe(false);
      expect(track.solo).toBe(false);
    });
  });

  // ----------------------------------------------------------------
  // removeTrack
  // ----------------------------------------------------------------
  describe('removeTrack', () => {
    it('removes the correct track by id', () => {
      getStore().addTrack(); // now 2 tracks
      const [first, second] = getStore().tracks;
      getStore().removeTrack(first.id);

      const remaining = getStore().tracks;
      expect(remaining.length).toBe(1);
      expect(remaining[0].id).toBe(second.id);
    });

    it('does not remove the last track (minimum 1 track)', () => {
      const onlyTrack = getStore().tracks[0];
      getStore().removeTrack(onlyTrack.id);
      expect(getStore().tracks.length).toBe(1);
      expect(getStore().tracks[0].id).toBe(onlyTrack.id);
    });

    it('switches activeTrackId to first track when active track is removed', () => {
      getStore().addTrack(); // track at index 1 is now active
      const [first, second] = getStore().tracks;
      expect(getStore().activeTrackId).toBe(second.id);

      getStore().removeTrack(second.id);
      expect(getStore().activeTrackId).toBe(first.id);
    });

    it('keeps activeTrackId unchanged when a non-active track is removed', () => {
      getStore().addTrack();
      const [first, second] = getStore().tracks;
      // active is second (the newly added one)
      getStore().setActiveTrack(second.id);
      getStore().removeTrack(first.id);
      expect(getStore().activeTrackId).toBe(second.id);
    });
  });

  // ----------------------------------------------------------------
  // setActiveTrack
  // ----------------------------------------------------------------
  describe('setActiveTrack', () => {
    it('changes the active track id', () => {
      getStore().addTrack();
      const [first] = getStore().tracks;
      getStore().setActiveTrack(first.id);
      expect(getStore().activeTrackId).toBe(first.id);
    });
  });

  // ----------------------------------------------------------------
  // updateTrackWorkspace
  // ----------------------------------------------------------------
  describe('updateTrackWorkspace', () => {
    it('saves XML for the specified track', () => {
      const trackId = getStore().tracks[0].id;
      const xml = '<xml><block type="note"></block></xml>';
      getStore().updateTrackWorkspace(trackId, xml);

      const track = getStore().tracks.find((t) => t.id === trackId);
      expect(track?.workspaceXml).toBe(xml);
    });

    it('does not affect other tracks', () => {
      getStore().addTrack();
      const [first, second] = getStore().tracks;
      getStore().updateTrackWorkspace(first.id, '<xml>first</xml>');

      const secondTrack = getStore().tracks.find((t) => t.id === second.id);
      expect(secondTrack?.workspaceXml).toBe('');
    });
  });

  // ----------------------------------------------------------------
  // loadWorkspaceXml
  // ----------------------------------------------------------------
  describe('loadWorkspaceXml', () => {
    it('sets workspaceXml on the active track and increments workspaceVersion', () => {
      const versionBefore = getStore().workspaceVersion;
      const xml = '<xml>loaded</xml>';
      getStore().loadWorkspaceXml(xml);

      const active = getStore().tracks.find((t) => t.id === getStore().activeTrackId);
      expect(active?.workspaceXml).toBe(xml);
      expect(getStore().workspaceVersion).toBe(versionBefore + 1);
    });

    it('does not affect non-active tracks', () => {
      getStore().addTrack();
      const [first, second] = getStore().tracks;
      // second is active (newly added)
      expect(getStore().activeTrackId).toBe(second.id);

      getStore().loadWorkspaceXml('<xml>for-active</xml>');

      const firstTrack = getStore().tracks.find((t) => t.id === first.id);
      const secondTrack = getStore().tracks.find((t) => t.id === second.id);
      expect(secondTrack?.workspaceXml).toBe('<xml>for-active</xml>');
      expect(firstTrack?.workspaceXml).toBe('');
    });
  });

  // ----------------------------------------------------------------
  // setVolume
  // ----------------------------------------------------------------
  describe('setVolume', () => {
    it('sets volume to the given value within range', () => {
      const id = getStore().tracks[0].id;
      getStore().setVolume(id, 50);
      expect(getStore().tracks[0].volume).toBe(50);
    });

    it('clamps volume to 0 when given a negative value', () => {
      const id = getStore().tracks[0].id;
      getStore().setVolume(id, -10);
      expect(getStore().tracks[0].volume).toBe(0);
    });

    it('clamps volume to 100 when given a value above 100', () => {
      const id = getStore().tracks[0].id;
      getStore().setVolume(id, 150);
      expect(getStore().tracks[0].volume).toBe(100);
    });

    it('accepts boundary values 0 and 100', () => {
      const id = getStore().tracks[0].id;
      getStore().setVolume(id, 0);
      expect(getStore().tracks[0].volume).toBe(0);
      getStore().setVolume(id, 100);
      expect(getStore().tracks[0].volume).toBe(100);
    });

    it('does not affect other tracks', () => {
      getStore().addTrack();
      const [first, second] = getStore().tracks;
      getStore().setVolume(first.id, 42);

      const secondTrack = getStore().tracks.find((t) => t.id === second.id);
      expect(secondTrack?.volume).toBe(80); // default unchanged
      expect(getStore().tracks.find((t) => t.id === first.id)?.volume).toBe(42);
    });
  });

  // ----------------------------------------------------------------
  // toggleMute
  // ----------------------------------------------------------------
  describe('toggleMute', () => {
    it('toggles muted from false to true', () => {
      const id = getStore().tracks[0].id;
      expect(getStore().tracks[0].muted).toBe(false);
      getStore().toggleMute(id);
      expect(getStore().tracks[0].muted).toBe(true);
    });

    it('toggles muted from true back to false', () => {
      const id = getStore().tracks[0].id;
      getStore().toggleMute(id);
      getStore().toggleMute(id);
      expect(getStore().tracks[0].muted).toBe(false);
    });

    it('only affects the specified track', () => {
      getStore().addTrack();
      const [first, second] = getStore().tracks;
      getStore().toggleMute(first.id);
      expect(getStore().tracks.find((t) => t.id === first.id)?.muted).toBe(true);
      expect(getStore().tracks.find((t) => t.id === second.id)?.muted).toBe(false);
    });

    it('leaves all tracks unchanged when given a non-existent id', () => {
      const before = getStore().tracks.map((t) => ({ ...t }));
      getStore().toggleMute('nonexistent');
      const after = getStore().tracks;
      expect(after).toEqual(before);
    });
  });

  // ----------------------------------------------------------------
  // toggleSolo
  // ----------------------------------------------------------------
  describe('toggleSolo', () => {
    it('toggles solo from false to true', () => {
      const id = getStore().tracks[0].id;
      expect(getStore().tracks[0].solo).toBe(false);
      getStore().toggleSolo(id);
      expect(getStore().tracks[0].solo).toBe(true);
    });

    it('toggles solo from true back to false', () => {
      const id = getStore().tracks[0].id;
      getStore().toggleSolo(id);
      getStore().toggleSolo(id);
      expect(getStore().tracks[0].solo).toBe(false);
    });

    it('only affects the specified track', () => {
      getStore().addTrack();
      const [first, second] = getStore().tracks;
      getStore().toggleSolo(first.id);
      expect(getStore().tracks.find((t) => t.id === first.id)?.solo).toBe(true);
      expect(getStore().tracks.find((t) => t.id === second.id)?.solo).toBe(false);
    });

    it('leaves all tracks unchanged when given a non-existent id', () => {
      const before = getStore().tracks.map((t) => ({ ...t }));
      getStore().toggleSolo('nonexistent');
      const after = getStore().tracks;
      expect(after).toEqual(before);
    });
  });

  // ----------------------------------------------------------------
  // renameTrack
  // ----------------------------------------------------------------
  describe('renameTrack', () => {
    it('updates the name of the specified track', () => {
      const id = getStore().tracks[0].id;
      getStore().renameTrack(id, 'My Cool Track');
      expect(getStore().tracks[0].name).toBe('My Cool Track');
    });

    it('does not affect other tracks', () => {
      getStore().addTrack();
      const [first, second] = getStore().tracks;
      getStore().renameTrack(first.id, 'Renamed');
      expect(getStore().tracks.find((t) => t.id === second.id)?.name).not.toBe('Renamed');
    });

    it('allows renaming to an empty string', () => {
      const id = getStore().tracks[0].id;
      getStore().renameTrack(id, '');
      expect(getStore().tracks[0].name).toBe('');
    });
  });

  // ----------------------------------------------------------------
  // appendWorkspaceXml / clearPendingAppend
  // ----------------------------------------------------------------
  describe('appendWorkspaceXml', () => {
    it('sets pendingAppendXml', () => {
      const xml = '<block type="biyo_note"></block>';
      getStore().appendWorkspaceXml(xml);
      expect(getStore().pendingAppendXml).toBe(xml);
    });

    it('increments workspaceVersion', () => {
      const before = getStore().workspaceVersion;
      getStore().appendWorkspaceXml('<block/>');
      expect(getStore().workspaceVersion).toBe(before + 1);
    });

    it('increments workspaceVersion correctly on rapid successive calls', () => {
      const before = getStore().workspaceVersion;
      getStore().appendWorkspaceXml('<block1/>');
      getStore().appendWorkspaceXml('<block2/>');
      getStore().appendWorkspaceXml('<block3/>');
      expect(getStore().workspaceVersion).toBe(before + 3);
    });
  });

  describe('clearPendingAppend', () => {
    it('clears pendingAppendXml to null', () => {
      getStore().appendWorkspaceXml('<block/>');
      expect(getStore().pendingAppendXml).not.toBeNull();
      getStore().clearPendingAppend();
      expect(getStore().pendingAppendXml).toBeNull();
    });
  });

  // ----------------------------------------------------------------
  // getTrack
  // ----------------------------------------------------------------
  describe('getTrack', () => {
    it('returns the correct track by id', () => {
      const id = getStore().tracks[0].id;
      const track = getStore().getTrack(id);
      expect(track).toBeDefined();
      expect(track?.id).toBe(id);
    });

    it('returns undefined for a non-existent id', () => {
      expect(getStore().getTrack('nonexistent')).toBeUndefined();
    });
  });
});
