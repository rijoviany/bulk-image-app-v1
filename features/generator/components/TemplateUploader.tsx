'use client';

import { useState, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import { useTemplateStore } from '../hooks/useTemplateStore';
import { renderPdfPageToDataUrl } from '../lib/pdf-rasterizer';
import { createSampleTemplate } from '../lib/demo-data';

export function TemplateUploader() {
  const { setTemplate, template } = useTemplateStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setLoading(true);
      setError(null);
      try {
        const bytes = await file.arrayBuffer();

        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          try {
            // First try rendering via pdfjs-dist for crisp canvas rendering
            const { dataUrl, width, height } = await renderPdfPageToDataUrl(bytes);
            setTemplate({ type: 'pdf', bytes, dataUrl, width, height });
          } catch (pdfErr) {
            console.warn('pdfjs-dist preview failed, falling back to pdf-lib metadata', pdfErr);
            const doc = await PDFDocument.load(bytes);
            const page = doc.getPages()[0];
            const { width, height } = page.getSize();
            const blob = new Blob([bytes], { type: 'application/pdf' });
            const dataUrl = URL.createObjectURL(blob);
            setTemplate({ type: 'pdf', bytes, dataUrl, width, height });
          }
        } else {
          // Image file (PNG, JPG, WebP)
          const dataUrl = await fileToDataUrl(file);
          const { width, height } = await getImageDimensions(dataUrl);
          setTemplate({ type: 'image', bytes, dataUrl, width, height });
        }
      } catch (err) {
        console.error('File load error:', err);
        setError('Failed to process file. Please ensure it is a valid PNG, JPG, or PDF.');
      } finally {
        setLoading(false);
      }
    },
    [setTemplate],
  );

  const handleLoadSample = async () => {
    setLoading(true);
    setError(null);
    try {
      const sample = await createSampleTemplate();
      setTemplate(sample);
    } catch (err) {
      setError('Could not generate sample template.');
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <div className="space-y-4 rounded-xl border border-neutral-200/80 bg-white p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">1. Template Background</h2>
          <p className="text-xs text-neutral-500">
            Upload an image (PNG, JPG) or single-page PDF certificate / diploma / badge.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLoadSample}
          disabled={loading}
          className="inline-flex items-center gap-1.5 self-start text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50/80 hover:bg-blue-100/70 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Load Demo Template
        </button>
      </div>

      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-all px-6 py-10 ${
          template
            ? 'border-emerald-300 bg-emerald-50/20'
            : 'border-neutral-300 bg-neutral-50/60 hover:border-neutral-400 hover:bg-neutral-50'
        }`}
      >
        {loading ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="text-xs text-neutral-500">Processing file...</p>
          </div>
        ) : (
          <>
            <div className="p-3 bg-neutral-100 rounded-full text-neutral-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <p className="text-sm font-medium text-neutral-700 text-center">
              Drag & drop template here or{' '}
              <label className="cursor-pointer text-blue-600 underline underline-offset-2 hover:text-blue-700 font-semibold">
                browse file
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.pdf"
                  onChange={onInputChange}
                  className="sr-only"
                />
              </label>
            </p>
            <p className="text-xs text-neutral-400">Supported: High-res PNG, JPG, or PDF</p>
          </>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {template && (
        <div className="flex items-center justify-between rounded-lg bg-emerald-50/80 border border-emerald-200 px-4 py-3 text-xs text-emerald-900">
          <div className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-[10px]">
              ✓
            </span>
            <span>
              <strong>Ready:</strong> {Math.round(template.width)} × {Math.round(template.height)} pt ({template.type.toUpperCase()})
            </span>
          </div>
          <button
            type="button"
            onClick={() => setTemplate(null as unknown as typeof template)}
            className="text-emerald-700 hover:text-emerald-900 underline font-medium cursor-pointer"
          >
            Replace
          </button>
        </div>
      )}
    </div>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.src = src;
  });
}
