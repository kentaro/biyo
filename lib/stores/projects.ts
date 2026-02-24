import { create } from 'zustand';
import { validateWorkspaceXml } from '@/lib/sharing/validate-xml';
import type { Track } from './tracks';

export interface SavedProject {
  id: string;
  name: string;
  savedAt: number; // timestamp
  bpm: number;
  tracks: Track[];
}

/** Shape of a .biyo export file */
export interface BiyoFile {
  version: 1;
  name: string;
  bpm: number;
  tracks: Track[];
  savedAt: number;
}

const STORAGE_KEY = 'biyo_projects';

/** Minimal shape check for a Track object loaded from untrusted JSON. */
function isValidTrack(t: unknown): t is Track {
  if (typeof t !== 'object' || t === null) return false;
  const obj = t as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.volume === 'number' &&
    typeof obj.muted === 'boolean' &&
    typeof obj.solo === 'boolean' &&
    (typeof obj.workspaceXml === 'string' || obj.workspaceXml === undefined)
  );
}

/** Minimal shape check for a SavedProject loaded from untrusted JSON. */
function isValidProject(p: unknown): p is SavedProject {
  if (typeof p !== 'object' || p === null) return false;
  const obj = p as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.savedAt === 'number' &&
    typeof obj.bpm === 'number' &&
    Array.isArray(obj.tracks) &&
    (obj.tracks as unknown[]).every(isValidTrack)
  );
}

function loadProjects(): SavedProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Filter out any malformed entries rather than rejecting everything
    return parsed.filter(isValidProject);
  } catch {
    return [];
  }
}

function persistProjects(projects: SavedProject[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    return true;
  } catch (e) {
    // localStorage quota exceeded or other storage error.
    // Log the error but don't crash the app.
    console.warn('[biyo] localStorage write failed:', e);
    return false;
  }
}

export interface ProjectStore {
  projects: SavedProject[];
  /** Error message when save fails (e.g., localStorage quota exceeded). */
  saveError: string | null;
  loadProjectList: () => void;
  saveProject: (name: string, bpm: number, tracks: Track[]) => string;
  deleteProject: (id: string) => void;
  getProject: (id: string) => SavedProject | undefined;
  exportAsFile: (name: string, bpm: number, tracks: Track[]) => void;
  importFromFile: (file: File) => Promise<BiyoFile>;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  saveError: null,

  loadProjectList: () => {
    set({ projects: loadProjects() });
  },

  saveProject: (name, bpm, tracks) => {
    const id = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const project: SavedProject = {
      id,
      name,
      savedAt: Date.now(),
      bpm,
      tracks,
    };
    const existing = loadProjects();
    const updated = [project, ...existing];
    const ok = persistProjects(updated);
    if (ok) {
      set({ projects: updated, saveError: null });
    } else {
      // localStorage quota exceeded — still update in-memory list so the UI
      // reflects the current session, but surface an error to the user.
      set({
        projects: updated,
        saveError: 'ほぞんできなかったよ。ふるいプロジェクトをけしてみてね！',
      });
    }
    return id;
  },

  deleteProject: (id) => {
    const updated = loadProjects().filter((p) => p.id !== id);
    persistProjects(updated);
    set({ projects: updated });
  },

  getProject: (id) => {
    return get().projects.find((p) => p.id === id);
  },

  exportAsFile: (name, bpm, tracks) => {
    const data: BiyoFile = {
      version: 1,
      name,
      bpm,
      tracks,
      savedAt: Date.now(),
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name || 'biyo-project'}.biyo`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importFromFile: (file: File): Promise<BiyoFile> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string) as BiyoFile;
          if (!data.version || !Array.isArray(data.tracks) || typeof data.bpm !== 'number') {
            reject(new Error('このファイルはひらけないみたい。べつのファイルをえらんでみてね！'));
            return;
          }

          // Validate each track has the required shape
          for (const track of data.tracks) {
            if (!isValidTrack(track)) {
              reject(new Error('このファイルはひらけないみたい。べつのファイルをえらんでみてね！'));
              return;
            }
          }

          // Validate workspace XML in each track to prevent XSS/injection
          for (const track of data.tracks) {
            if (track.workspaceXml && track.workspaceXml.trim() !== '') {
              const validation = validateWorkspaceXml(track.workspaceXml);
              if (!validation.valid) {
                reject(
                  new Error(
                    'このファイルにはあやしいデータがはいっているみたい。べつのファイルをえらんでみてね！',
                  ),
                );
                return;
              }
            }
          }

          resolve(data);
        } catch {
          reject(new Error('ファイルがよめなかったよ。もういちどためしてみてね！'));
        }
      };
      reader.onerror = () =>
        reject(new Error('ファイルがよめなかったよ。もういちどためしてみてね！'));
      reader.readAsText(file);
    });
  },
}));
