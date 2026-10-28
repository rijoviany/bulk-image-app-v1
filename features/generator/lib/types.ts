export interface FieldPlacement {
  id: string;
  /** CSV column header name */
  field: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  align: 'left' | 'center' | 'right';
}

export interface CustomFont {
  name: string;
  /** Raw ArrayBuffer of the .ttf/.otf file */
  data: ArrayBuffer;
}

export interface TemplateData {
  /** Original file type */
  type: 'image' | 'pdf';
  /** Raw bytes */
  bytes: ArrayBuffer;
  /** Data URL for canvas preview */
  dataUrl: string;
  /** Width in pixels (for images) or points (for PDF) */
  width: number;
  /** Height in pixels (for images) or points (for PDF) */
  height: number;
}

export interface DownloadBatch {
  id: string;
  partNumber: number;
  totalParts: number;
  startRecord: number;
  endRecord: number;
  count: number;
  url: string;
  filename: string;
  size: string;
}

export interface GenerationProgress {
  current: number;
  total: number;
  currentBatch: number;
  totalBatches: number;
  status: 'idle' | 'generating' | 'zipping' | 'done' | 'error';
  error?: string;
}

export type CsvRecord = Record<string, string>;

export type Step = 'upload' | 'place' | 'preview' | 'generate';
