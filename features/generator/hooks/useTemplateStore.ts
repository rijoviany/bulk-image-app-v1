import { create } from 'zustand';
import type {
  TemplateData,
  CsvRecord,
  FieldPlacement,
  CustomFont,
  GenerationProgress,
  Step,
} from '../lib/types';

interface TemplateStore {
  // Navigation
  step: Step;
  setStep: (s: Step) => void;

  // Template
  template: TemplateData | null;
  setTemplate: (t: TemplateData | null) => void;

  // CSV
  headers: string[];
  records: CsvRecord[];
  setCsvData: (headers: string[], records: CsvRecord[]) => void;

  // Placements
  placements: FieldPlacement[];
  addPlacement: (p: FieldPlacement) => void;
  updatePlacement: (id: string, patch: Partial<FieldPlacement>) => void;
  removePlacement: (id: string) => void;

  // Fonts
  customFonts: CustomFont[];
  addCustomFont: (f: CustomFont) => void;

  // Preview
  previewIndex: number;
  setPreviewIndex: (i: number) => void;

  // Generation
  progress: GenerationProgress;
  setProgress: (p: GenerationProgress) => void;

  // Downloadable Asset Result
  downloadUrl: string | null;
  downloadFilename: string | null;
  downloadSize: string | null;
  setDownloadResult: (url: string | null, filename: string | null, size: string | null) => void;

  // Purge / Reset
  purgeAllData: () => void;
}

const initialProgress: GenerationProgress = {
  current: 0,
  total: 0,
  status: 'idle',
};

export const useTemplateStore = create<TemplateStore>((set, get) => ({
  step: 'upload',
  setStep: (step) => set({ step }),

  template: null,
  setTemplate: (template) => set({ template }),

  headers: [],
  records: [],
  setCsvData: (headers, records) => set({ headers, records }),

  placements: [],
  addPlacement: (p) => set((s) => ({ placements: [...s.placements, p] })),
  updatePlacement: (id, patch) =>
    set((s) => ({
      placements: s.placements.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    })),
  removePlacement: (id) =>
    set((s) => ({ placements: s.placements.filter((p) => p.id !== id) })),

  customFonts: [],
  addCustomFont: (f) => set((s) => ({ customFonts: [...s.customFonts, f] })),

  previewIndex: 0,
  setPreviewIndex: (previewIndex) => set({ previewIndex }),

  progress: initialProgress,
  setProgress: (progress) => set({ progress }),

  downloadUrl: null,
  downloadFilename: null,
  downloadSize: null,
  setDownloadResult: (downloadUrl, downloadFilename, downloadSize) =>
    set({ downloadUrl, downloadFilename, downloadSize }),

  purgeAllData: () => {
    const currentUrl = get().downloadUrl;
    if (currentUrl) {
      try {
        URL.revokeObjectURL(currentUrl);
      } catch (e) {
        // Ignore
      }
    }
    const currentTemplateUrl = get().template?.dataUrl;
    if (currentTemplateUrl && currentTemplateUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(currentTemplateUrl);
      } catch (e) {
        // Ignore
      }
    }

    set({
      step: 'upload',
      template: null,
      headers: [],
      records: [],
      placements: [],
      customFonts: [],
      previewIndex: 0,
      progress: initialProgress,
      downloadUrl: null,
      downloadFilename: null,
      downloadSize: null,
    });
  },
}));
