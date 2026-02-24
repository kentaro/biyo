import { validateWorkspaceXml } from '@/lib/sharing/validate-xml';
import { create } from 'zustand';
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

function loadProjects(): SavedProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistProjects(projects: SavedProject[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export interface ProjectStore {
  projects: SavedProject[];
  loadProjectList: () => void;
  saveProject: (name: string, bpm: number, tracks: Track[]) => string;
  deleteProject: (id: string) => void;
  getProject: (id: string) => SavedProject | undefined;
  exportAsFile: (name: string, bpm: number, tracks: Track[]) => void;
  importFromFile: (file: File) => Promise<BiyoFile>;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],

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
    persistProjects(updated);
    set({ projects: updated });
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
          if (!data.version || !data.tracks || typeof data.bpm !== 'number') {
            reject(new Error('このファイルはひらけないみたい。べつのファイルをえらんでみてね！'));
            return;
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
