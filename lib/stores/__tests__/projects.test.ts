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
  });
});
