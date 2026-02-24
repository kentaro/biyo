import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BiyoFile, ProjectStore } from '../projects';
import type { Track } from '../tracks';

function makeMockTrack(overrides: Partial<Track> = {}): Track {
  return {
    id: `track_${Math.random().toString(36).slice(2)}`,
    name: 'Test Track',
    workspaceXml: '<xml></xml>',
    volume: 80,
    muted: false,
    solo: false,
    ...overrides,
  };
}

/**
 * Create a minimal in-memory localStorage mock that implements
 * getItem, setItem, removeItem, clear, key, and length.
 */
function createLocalStorageMock(): Storage {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    get length() {
      return Object.keys(store).length;
    },
  };
}

describe('ProjectStore', () => {
  let mockStorage: Storage;
  // We dynamically import the store so it picks up our mocked localStorage
  let useProjectStore: typeof import('../projects').useProjectStore;

  beforeEach(async () => {
    mockStorage = createLocalStorageMock();
    vi.stubGlobal('localStorage', mockStorage);

    // Clear module cache so the store re-evaluates with our mock
    vi.resetModules();
    const mod = await import('../projects');
    useProjectStore = mod.useProjectStore;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function getStore(): ProjectStore {
    return useProjectStore.getState();
  }

  // ----------------------------------------------------------------
  // saveProject
  // ----------------------------------------------------------------
  describe('saveProject', () => {
    it('persists project to localStorage', () => {
      const tracks = [makeMockTrack()];
      getStore().saveProject('My Song', 120, tracks);

      const stored = JSON.parse(mockStorage.getItem('biyo_projects')!);
      expect(stored).toHaveLength(1);
      expect(stored[0].name).toBe('My Song');
      expect(stored[0].bpm).toBe(120);
      expect(stored[0].tracks).toHaveLength(1);
    });

    it('returns a unique project id', () => {
      const tracks = [makeMockTrack()];
      const id = getStore().saveProject('Song 1', 120, tracks);
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id).toMatch(/^proj_/);
    });

    it('assigns unique IDs to separate saves', () => {
      const tracks = [makeMockTrack()];
      const id1 = getStore().saveProject('Song 1', 120, tracks);
      const id2 = getStore().saveProject('Song 2', 130, tracks);
      expect(id1).not.toBe(id2);
    });

    it('adds project to store state', () => {
      const tracks = [makeMockTrack()];
      getStore().saveProject('My Song', 140, tracks);
      expect(getStore().projects).toHaveLength(1);
      expect(getStore().projects[0].name).toBe('My Song');
      expect(getStore().projects[0].bpm).toBe(140);
    });

    it('prepends new project (newest first)', () => {
      const tracks = [makeMockTrack()];
      getStore().saveProject('Song 1', 120, tracks);
      getStore().saveProject('Song 2', 130, tracks);
      expect(getStore().projects[0].name).toBe('Song 2');
      expect(getStore().projects[1].name).toBe('Song 1');
    });

    it('saves savedAt timestamp', () => {
      const before = Date.now();
      const tracks = [makeMockTrack()];
      getStore().saveProject('Song', 120, tracks);
      const after = Date.now();

      const savedAt = getStore().projects[0].savedAt;
      expect(savedAt).toBeGreaterThanOrEqual(before);
      expect(savedAt).toBeLessThanOrEqual(after);
    });
  });

  // ----------------------------------------------------------------
  // loadProjectList
  // ----------------------------------------------------------------
  describe('loadProjectList', () => {
    it('reads projects from localStorage into store state', () => {
      const mockProjects = [
        {
          id: 'proj_1',
          name: 'Saved Song',
          savedAt: Date.now(),
          bpm: 100,
          tracks: [makeMockTrack()],
        },
      ];
      mockStorage.setItem('biyo_projects', JSON.stringify(mockProjects));

      getStore().loadProjectList();
      expect(getStore().projects).toHaveLength(1);
      expect(getStore().projects[0].name).toBe('Saved Song');
      expect(getStore().projects[0].bpm).toBe(100);
    });

    it('returns empty array when localStorage is empty', () => {
      getStore().loadProjectList();
      expect(getStore().projects).toEqual([]);
    });

    it('returns empty array when localStorage contains invalid JSON', () => {
      mockStorage.setItem('biyo_projects', 'not valid json{{{');
      getStore().loadProjectList();
      expect(getStore().projects).toEqual([]);
    });
  });

  // ----------------------------------------------------------------
  // deleteProject
  // ----------------------------------------------------------------
  describe('deleteProject', () => {
    it('removes the project with the given id', () => {
      const tracks = [makeMockTrack()];
      const id = getStore().saveProject('To Delete', 120, tracks);
      expect(getStore().projects).toHaveLength(1);

      getStore().deleteProject(id);
      expect(getStore().projects).toHaveLength(0);
    });

    it('removes from localStorage as well', () => {
      const tracks = [makeMockTrack()];
      const id = getStore().saveProject('To Delete', 120, tracks);
      getStore().deleteProject(id);

      const stored = JSON.parse(mockStorage.getItem('biyo_projects')!);
      expect(stored).toHaveLength(0);
    });

    it('does not remove other projects', () => {
      const tracks = [makeMockTrack()];
      const id1 = getStore().saveProject('Song 1', 120, tracks);
      const id2 = getStore().saveProject('Song 2', 130, tracks);

      getStore().deleteProject(id1);
      expect(getStore().projects).toHaveLength(1);
      expect(getStore().projects[0].id).toBe(id2);
    });

    it('does nothing when id does not exist', () => {
      const tracks = [makeMockTrack()];
      getStore().saveProject('Song', 120, tracks);
      getStore().deleteProject('nonexistent_id');
      expect(getStore().projects).toHaveLength(1);
    });
  });

  // ----------------------------------------------------------------
  // getProject
  // ----------------------------------------------------------------
  describe('getProject', () => {
    it('returns the project matching the id', () => {
      const tracks = [makeMockTrack()];
      const id = getStore().saveProject('Find Me', 120, tracks);
      const project = getStore().getProject(id);
      expect(project).toBeDefined();
      expect(project?.name).toBe('Find Me');
    });

    it('returns undefined for non-existent id', () => {
      expect(getStore().getProject('nonexistent')).toBeUndefined();
    });
  });

  // ----------------------------------------------------------------
  // exportAsFile
  // ----------------------------------------------------------------
  describe('exportAsFile', () => {
    it('creates a downloadable blob with correct BiyoFile structure', () => {
      const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url');
      const revokeObjectURLMock = vi.fn();
      const clickMock = vi.fn();
      const appendChildMock = vi.fn();
      const removeChildMock = vi.fn();

      vi.stubGlobal('URL', {
        createObjectURL: createObjectURLMock,
        revokeObjectURL: revokeObjectURLMock,
      });

      const mockAnchor = {
        href: '',
        download: '',
        click: clickMock,
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement);
      vi.spyOn(document.body, 'appendChild').mockImplementation(appendChildMock);
      vi.spyOn(document.body, 'removeChild').mockImplementation(removeChildMock);

      const tracks = [makeMockTrack({ name: 'Export Track' })];
      getStore().exportAsFile('My Export', 140, tracks);

      // Verify Blob was created
      expect(createObjectURLMock).toHaveBeenCalledOnce();
      const blob = createObjectURLMock.mock.calls[0][0] as Blob;
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/json');

      // Verify anchor element
      expect(mockAnchor.download).toBe('My Export.biyo');
      expect(mockAnchor.href).toBe('blob:mock-url');
      expect(clickMock).toHaveBeenCalledOnce();

      // Verify cleanup
      expect(appendChildMock).toHaveBeenCalledOnce();
      expect(removeChildMock).toHaveBeenCalledOnce();
      expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url');

      vi.restoreAllMocks();
    });

    it('uses fallback filename when name is empty', () => {
      const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url');
      const revokeObjectURLMock = vi.fn();
      const clickMock = vi.fn();

      vi.stubGlobal('URL', {
        createObjectURL: createObjectURLMock,
        revokeObjectURL: revokeObjectURLMock,
      });

      const mockAnchor = { href: '', download: '', click: clickMock };
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement);
      vi.spyOn(document.body, 'appendChild').mockImplementation(vi.fn());
      vi.spyOn(document.body, 'removeChild').mockImplementation(vi.fn());

      getStore().exportAsFile('', 120, []);
      expect(mockAnchor.download).toBe('biyo-project.biyo');

      vi.restoreAllMocks();
    });
  });

  // ----------------------------------------------------------------
  // importFromFile
  // ----------------------------------------------------------------
  describe('importFromFile', () => {
    it('resolves with parsed BiyoFile data on valid file', async () => {
      const biyoData: BiyoFile = {
        version: 1,
        name: 'Imported Song',
        bpm: 150,
        tracks: [makeMockTrack()],
        savedAt: Date.now(),
      };
      const json = JSON.stringify(biyoData);
      const file = new File([json], 'test.biyo', {
        type: 'application/json',
      });

      const result = await getStore().importFromFile(file);
      expect(result.version).toBe(1);
      expect(result.name).toBe('Imported Song');
      expect(result.bpm).toBe(150);
      expect(result.tracks).toHaveLength(1);
    });

    it('rejects with error when file has invalid JSON', async () => {
      const file = new File(['not json!!!'], 'bad.biyo', {
        type: 'application/json',
      });

      await expect(getStore().importFromFile(file)).rejects.toThrow('ファイルがよめなかったよ');
    });

    it('rejects when file is valid JSON but missing required fields', async () => {
      const data = { name: 'Missing fields' }; // no version, no tracks
      const file = new File([JSON.stringify(data)], 'incomplete.biyo', {
        type: 'application/json',
      });

      await expect(getStore().importFromFile(file)).rejects.toThrow(
        'このファイルはひらけないみたい。べつのファイルをえらんでみてね！',
      );
    });

    it('rejects when version is 0 (falsy)', async () => {
      const data = { version: 0, name: 'Bad', tracks: [], bpm: 120, savedAt: 0 };
      const file = new File([JSON.stringify(data)], 'bad-version.biyo', {
        type: 'application/json',
      });

      await expect(getStore().importFromFile(file)).rejects.toThrow(
        'このファイルはひらけないみたい。べつのファイルをえらんでみてね！',
      );
    });

    it('rejects when bpm is missing', async () => {
      const data = { version: 1, name: 'No BPM', tracks: [], savedAt: 0 };
      const file = new File([JSON.stringify(data)], 'no-bpm.biyo', {
        type: 'application/json',
      });

      await expect(getStore().importFromFile(file)).rejects.toThrow(
        'このファイルはひらけないみたい。べつのファイルをえらんでみてね！',
      );
    });

    it('rejects when FileReader triggers onerror', async () => {
      const OriginalFileReader = globalThis.FileReader;
      // Mock FileReader so that readAsText triggers onerror
      class MockFileReader {
        onload: ((ev: ProgressEvent<FileReader>) => void) | null = null;
        onerror: ((ev: ProgressEvent<FileReader>) => void) | null = null;
        result: string | ArrayBuffer | null = null;
        readAsText() {
          // Simulate a read error
          if (this.onerror) {
            this.onerror(new ProgressEvent('error') as ProgressEvent<FileReader>);
          }
        }
      }
      vi.stubGlobal('FileReader', MockFileReader);

      // Re-import the module so it picks up the mocked FileReader
      vi.resetModules();
      const mod = await import('../projects');
      const store = mod.useProjectStore.getState();

      const file = new File(['anything'], 'fail.biyo', {
        type: 'application/json',
      });

      await expect(store.importFromFile(file)).rejects.toThrow('ファイルがよめなかったよ');

      // Restore original FileReader
      vi.stubGlobal('FileReader', OriginalFileReader);
    });

    it('resolves when tracks is an empty array (truthy)', async () => {
      const data: BiyoFile = {
        version: 1,
        name: 'Empty tracks',
        bpm: 120,
        tracks: [],
        savedAt: Date.now(),
      };
      const file = new File([JSON.stringify(data)], 'empty-tracks.biyo', {
        type: 'application/json',
      });

      const result = await getStore().importFromFile(file);
      expect(result.tracks).toEqual([]);
    });

    it('rejects when tracks is not an array (e.g. string)', async () => {
      const data = { version: 1, name: 'Bad', tracks: 'not-an-array', bpm: 120, savedAt: 0 };
      const file = new File([JSON.stringify(data)], 'bad-tracks.biyo', {
        type: 'application/json',
      });

      await expect(getStore().importFromFile(file)).rejects.toThrow(
        'このファイルはひらけないみたい。べつのファイルをえらんでみてね！',
      );
    });

    it('rejects when tracks is an object instead of array', async () => {
      const data = { version: 1, name: 'Bad', tracks: { a: 1 }, bpm: 120, savedAt: 0 };
      const file = new File([JSON.stringify(data)], 'obj-tracks.biyo', {
        type: 'application/json',
      });

      await expect(getStore().importFromFile(file)).rejects.toThrow(
        'このファイルはひらけないみたい。べつのファイルをえらんでみてね！',
      );
    });

    it('rejects when a track is missing required fields', async () => {
      const data = {
        version: 1,
        name: 'Bad Track',
        bpm: 120,
        tracks: [{ id: 'track_1' }], // missing name, volume, muted, solo
        savedAt: Date.now(),
      };
      const file = new File([JSON.stringify(data)], 'bad-track-shape.biyo', {
        type: 'application/json',
      });

      await expect(getStore().importFromFile(file)).rejects.toThrow(
        'このファイルはひらけないみたい。べつのファイルをえらんでみてね！',
      );
    });

    it('rejects when a track has wrong field types', async () => {
      const data = {
        version: 1,
        name: 'Wrong types',
        bpm: 120,
        tracks: [{ id: 123, name: 'T', volume: 80, muted: false, solo: false, workspaceXml: '' }],
        savedAt: Date.now(),
      };
      const file = new File([JSON.stringify(data)], 'wrong-types.biyo', {
        type: 'application/json',
      });

      await expect(getStore().importFromFile(file)).rejects.toThrow(
        'このファイルはひらけないみたい。べつのファイルをえらんでみてね！',
      );
    });

    it('rejects when workspace XML contains script tags', async () => {
      const data = {
        version: 1,
        name: 'XSS attempt',
        bpm: 120,
        tracks: [
          makeMockTrack({
            workspaceXml: '<xml><block type="biyo_test"><script>alert(1)</script></block></xml>',
          }),
        ],
        savedAt: Date.now(),
      };
      const file = new File([JSON.stringify(data)], 'xss.biyo', {
        type: 'application/json',
      });

      await expect(getStore().importFromFile(file)).rejects.toThrow(
        'このファイルにはあやしいデータがはいっているみたい。べつのファイルをえらんでみてね！',
      );
    });

    it('rejects when workspace XML contains event handlers', async () => {
      const data = {
        version: 1,
        name: 'Event handler XSS',
        bpm: 120,
        tracks: [
          makeMockTrack({
            workspaceXml: '<xml><block type="biyo_x" onerror="alert(1)"></block></xml>',
          }),
        ],
        savedAt: Date.now(),
      };
      const file = new File([JSON.stringify(data)], 'event-xss.biyo', {
        type: 'application/json',
      });

      await expect(getStore().importFromFile(file)).rejects.toThrow(
        'このファイルにはあやしいデータがはいっているみたい。べつのファイルをえらんでみてね！',
      );
    });

    it('accepts tracks with empty workspaceXml (no validation needed)', async () => {
      const data: BiyoFile = {
        version: 1,
        name: 'Empty XML',
        bpm: 120,
        tracks: [makeMockTrack({ workspaceXml: '' })],
        savedAt: Date.now(),
      };
      const file = new File([JSON.stringify(data)], 'empty-xml.biyo', {
        type: 'application/json',
      });

      const result = await getStore().importFromFile(file);
      expect(result.tracks[0].workspaceXml).toBe('');
    });
  });

  // ----------------------------------------------------------------
  // Track property preservation (save/load round-trip)
  // ----------------------------------------------------------------
  describe('track property preservation', () => {
    it('preserves all track properties through save/load cycle', () => {
      const track = makeMockTrack({
        id: 'track_12345_1',
        name: 'My Custom Track',
        workspaceXml: '<xml><block type="biyo_sine"></block></xml>',
        volume: 42,
        muted: true,
        solo: true,
      });
      getStore().saveProject('Full Track Test', 140, [track]);

      // Reload from localStorage
      vi.resetModules();
      // Read directly from storage to verify persistence
      const stored = JSON.parse(mockStorage.getItem('biyo_projects')!);
      const savedTrack = stored[0].tracks[0];

      expect(savedTrack.id).toBe('track_12345_1');
      expect(savedTrack.name).toBe('My Custom Track');
      expect(savedTrack.workspaceXml).toBe('<xml><block type="biyo_sine"></block></xml>');
      expect(savedTrack.volume).toBe(42);
      expect(savedTrack.muted).toBe(true);
      expect(savedTrack.solo).toBe(true);
    });

    it('preserves track IDs (timestamp-based) on save', () => {
      const track1 = makeMockTrack({ id: '1709000000000_1' });
      const track2 = makeMockTrack({ id: '1709000000001_2' });

      getStore().saveProject('ID Test', 120, [track1, track2]);

      const project = getStore().projects[0];
      expect(project.tracks[0].id).toBe('1709000000000_1');
      expect(project.tracks[1].id).toBe('1709000000001_2');
    });

    it('preserves multiple tracks with different settings', () => {
      const tracks = [
        makeMockTrack({ id: 't1', name: 'Lead', volume: 100, muted: false, solo: true }),
        makeMockTrack({ id: 't2', name: 'Bass', volume: 60, muted: true, solo: false }),
        makeMockTrack({ id: 't3', name: 'Drums', volume: 80, muted: false, solo: false }),
      ];

      getStore().saveProject('Multi Track', 160, tracks);
      const project = getStore().projects[0];

      expect(project.tracks).toHaveLength(3);
      expect(project.tracks[0]).toMatchObject({
        id: 't1',
        name: 'Lead',
        volume: 100,
        muted: false,
        solo: true,
      });
      expect(project.tracks[1]).toMatchObject({
        id: 't2',
        name: 'Bass',
        volume: 60,
        muted: true,
        solo: false,
      });
      expect(project.tracks[2]).toMatchObject({
        id: 't3',
        name: 'Drums',
        volume: 80,
        muted: false,
        solo: false,
      });
    });
  });

  // ----------------------------------------------------------------
  // Multiple saves / data integrity
  // ----------------------------------------------------------------
  describe('multiple saves', () => {
    it('does not corrupt existing projects when saving new ones', () => {
      const track1 = makeMockTrack({ id: 'first_track', name: 'First' });
      const track2 = makeMockTrack({ id: 'second_track', name: 'Second' });

      getStore().saveProject('Project A', 100, [track1]);
      getStore().saveProject('Project B', 200, [track2]);

      const projects = getStore().projects;
      expect(projects).toHaveLength(2);

      // Newest first
      expect(projects[0].name).toBe('Project B');
      expect(projects[0].bpm).toBe(200);
      expect(projects[0].tracks[0].id).toBe('second_track');

      expect(projects[1].name).toBe('Project A');
      expect(projects[1].bpm).toBe(100);
      expect(projects[1].tracks[0].id).toBe('first_track');
    });

    it('saves are independent - modifying tracks after save does not affect stored data', () => {
      const tracks = [makeMockTrack({ id: 'original', name: 'Original', volume: 80 })];
      getStore().saveProject('Immutable Test', 120, tracks);

      // Mutate the original track array
      tracks[0].name = 'Mutated';
      tracks[0].volume = 0;

      // Read from localStorage (the source of truth)
      const stored = JSON.parse(mockStorage.getItem('biyo_projects')!);
      // JSON serialization creates a copy, so mutation of the original object
      // does not affect what was stored
      expect(stored[0].tracks[0].name).toBe('Original');
      expect(stored[0].tracks[0].volume).toBe(80);
    });
  });

  // ----------------------------------------------------------------
  // localStorage corruption resilience
  // ----------------------------------------------------------------
  describe('localStorage corruption resilience', () => {
    it('filters out malformed projects from localStorage', () => {
      const goodProject = {
        id: 'proj_good',
        name: 'Good',
        savedAt: Date.now(),
        bpm: 120,
        tracks: [makeMockTrack()],
      };
      const badProject = {
        id: 'proj_bad',
        // missing name, bpm, tracks
      };
      mockStorage.setItem('biyo_projects', JSON.stringify([goodProject, badProject]));

      getStore().loadProjectList();
      expect(getStore().projects).toHaveLength(1);
      expect(getStore().projects[0].id).toBe('proj_good');
    });

    it('returns empty when localStorage has a non-array JSON value', () => {
      mockStorage.setItem('biyo_projects', JSON.stringify({ not: 'an array' }));
      getStore().loadProjectList();
      expect(getStore().projects).toEqual([]);
    });

    it('returns empty when localStorage has a JSON string', () => {
      mockStorage.setItem('biyo_projects', JSON.stringify('just a string'));
      getStore().loadProjectList();
      expect(getStore().projects).toEqual([]);
    });

    it('returns empty when localStorage has a JSON number', () => {
      mockStorage.setItem('biyo_projects', '42');
      getStore().loadProjectList();
      expect(getStore().projects).toEqual([]);
    });

    it('filters out projects with malformed tracks', () => {
      const projectWithBadTrack = {
        id: 'proj_bad_track',
        name: 'Bad Track Project',
        savedAt: Date.now(),
        bpm: 120,
        tracks: [{ id: 'track_1' }], // missing required fields
      };
      mockStorage.setItem('biyo_projects', JSON.stringify([projectWithBadTrack]));

      getStore().loadProjectList();
      expect(getStore().projects).toHaveLength(0);
    });

    it('filters out projects where tracks is not an array', () => {
      const projectWithStringTracks = {
        id: 'proj_str',
        name: 'String Tracks',
        savedAt: Date.now(),
        bpm: 120,
        tracks: 'not-an-array',
      };
      mockStorage.setItem('biyo_projects', JSON.stringify([projectWithStringTracks]));

      getStore().loadProjectList();
      expect(getStore().projects).toHaveLength(0);
    });
  });

  // ----------------------------------------------------------------
  // importFromFile round-trip with exportAsFile
  // ----------------------------------------------------------------
  describe('export/import round-trip', () => {
    it('exported data can be re-imported successfully', async () => {
      // Capture the blob content from exportAsFile
      let capturedBlob: Blob | null = null;
      const createObjectURLMock = vi.fn((blob: Blob) => {
        capturedBlob = blob;
        return 'blob:mock';
      });
      const revokeObjectURLMock = vi.fn();

      vi.stubGlobal('URL', {
        createObjectURL: createObjectURLMock,
        revokeObjectURL: revokeObjectURLMock,
      });

      const mockAnchor = { href: '', download: '', click: vi.fn() };
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement);
      vi.spyOn(document.body, 'appendChild').mockImplementation(vi.fn());
      vi.spyOn(document.body, 'removeChild').mockImplementation(vi.fn());

      const tracks = [
        makeMockTrack({
          id: 'roundtrip_1',
          name: 'Round Trip',
          volume: 55,
          muted: true,
          solo: false,
          workspaceXml: '<xml><block type="biyo_sine"></block></xml>',
        }),
      ];

      getStore().exportAsFile('Round Trip Project', 145, tracks);

      // Read the blob content and create a File from it
      expect(capturedBlob).not.toBeNull();
      const text = await capturedBlob!.text();
      const file = new File([text], 'roundtrip.biyo', { type: 'application/json' });

      vi.restoreAllMocks();

      const imported = await getStore().importFromFile(file);
      expect(imported.name).toBe('Round Trip Project');
      expect(imported.bpm).toBe(145);
      expect(imported.tracks).toHaveLength(1);
      expect(imported.tracks[0].id).toBe('roundtrip_1');
      expect(imported.tracks[0].name).toBe('Round Trip');
      expect(imported.tracks[0].volume).toBe(55);
      expect(imported.tracks[0].muted).toBe(true);
      expect(imported.tracks[0].solo).toBe(false);
      expect(imported.tracks[0].workspaceXml).toBe('<xml><block type="biyo_sine"></block></xml>');
    });
  });

  // ----------------------------------------------------------------
  // localStorage key isolation
  // ----------------------------------------------------------------
  describe('localStorage key isolation', () => {
    it('uses biyo_projects key and does not interfere with other keys', () => {
      mockStorage.setItem('other_app_key', 'should not be touched');
      const tracks = [makeMockTrack()];

      getStore().saveProject('Isolation Test', 120, tracks);

      expect(mockStorage.getItem('other_app_key')).toBe('should not be touched');
      expect(mockStorage.getItem('biyo_projects')).not.toBeNull();
    });

    it('deleteProject does not affect other localStorage keys', () => {
      mockStorage.setItem('other_key', 'preserved');
      const tracks = [makeMockTrack()];
      const id = getStore().saveProject('Delete Test', 120, tracks);

      getStore().deleteProject(id);

      expect(mockStorage.getItem('other_key')).toBe('preserved');
    });
  });
});
