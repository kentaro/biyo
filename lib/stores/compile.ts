import { create } from 'zustand';

export type CompileStatus = 'ready' | 'compiling' | 'error';

export interface CompileStore {
  generatedCode: string;
  compileError: string | null;
  status: CompileStatus;
  setGeneratedCode: (code: string) => void;
  setError: (error: string | null) => void;
  setStatus: (status: CompileStatus) => void;
}

export const useCompileStore = create<CompileStore>((set) => ({
  generatedCode: '',
  compileError: null,
  status: 'ready',

  setGeneratedCode: (code) => set({ generatedCode: code }),
  setError: (error) => set({ compileError: error }),
  setStatus: (status) => set({ status }),
}));
