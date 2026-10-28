import { create } from 'zustand';
import type {
  TemplateData,
  CsvRecord,
  FieldPlacement,
  CustomFont,
  GenerationProgress,
  DownloadBatch,
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

  // Split ZIP Batch Configuration (Default: 250)
  splitBatchSize: number;
  setSplitBatchSize: (size: number) => void;

  // Generation
  progress: GenerationProgress;
  setProgress: (p: GenerationProgress) => void;

  // Downloadable Asset Batches
  downloadBatches: DownloadBatch[];
  addDownloadBatch: (batch: DownloadBatch) => void;
  clearDownloadBatches: () => void;

  // Purge only generated ZIP & free memory (keeps template & CSV)
  purgeGenerationOnly: () => void;

  // Purge / Reset Everything
  purgeAllData: () => void;
}

const initialProgress: GenerationProgress = {
  current: 0,
  total: 0,
  currentBatch: 0,
  totalBatches: 0,
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

  // Default to 250 records per ZIP
  splitBatchSize: 250,
  setSplitBatchSize: (splitBatchSize) => set({ splitBatchSize }),

  progress: initialProgress,
  setProgress: (progress) => set({ progress }),

  downloadBatches: [],
  addDownloadBatch: (batch) =>
    set((s) => ({ downloadBatches: [...s.downloadBatches, batch] })),
  clearDownloadBatches: () => {
    const batches = get().downloadBatches;
    batches.forEach((b) => {
      try {
        URL.revokeObjectURL(b.url);
      } catch (e) {
        // Ignore
      }
    });
    set({ downloadBatches: [] });
  },

  purgeGenerationOnly: () => {
    const batches = get().downloadBatches;
    batches.forEach((b) => {
      try {
        URL.revokeObjectURL(b.url);
      } catch (e) {
        // Ignore
      }
    });
    set({
      downloadBatches: [],
      progress: initialProgress,
    });
  },

  purgeAllData: () => {
    const batches = get().downloadBatches;
    batches.forEach((b) => {
      try {
        URL.revokeObjectURL(b.url);
      } catch (e) {
        // Ignore
      }
    });

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
      downloadBatches: [],
    });
  },
}));
