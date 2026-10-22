'use client';

import { useState, useCallback } from 'react';
import { useTemplateStore } from '../hooks/useTemplateStore';
import { renderSinglePdf } from '../lib/pdf-engine';
import { CURATED_FONTS } from '../lib/fonts';
import { saveAs } from 'file-saver';

export function RecordPreview() {
  const {
    template,
    records,
    headers,
    placements,
    previewIndex,
    setPreviewIndex,
    customFonts,
  } = useTemplateStore();

  const [downloadingSingle, setDownloadingSingle] = useState(false);

  if (!template || records.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
        Please complete Step 1 (Upload Template & CSV) first.
      </div>
    );
  }

  const record = records[previewIndex] ?? {};
  const total = records.length;

  // Preserve aspect ratio
  const aspect = template.height / template.width;
  const w = Math.min(860, template.width);
  const h = Math.round(w * aspect);

  const getCssFamily = useCallback((fontId: string) => {
    const curated = CURATED_FONTS.find((f) => f.id === fontId);
    if (curated) return curated.cssFamily;
    if (fontId.startsWith('Times')) return "'Times New Roman', serif";
    if (fontId.startsWith('Courier')) return 'Courier, monospace';
    return fontId;
  }, []);

  const handleDownloadSingle = async () => {
    setDownloadingSingle(true);
    try {
      const pdfBytes = await renderSinglePdf(
        template,
        record,
        placements,
        customFonts,
        w,
        h,
      );
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const firstVal = Object.values(record)[0] || `sample_${previewIndex + 1}`;
      const safeName = String(firstVal).replace(/[^a-zA-Z0-9_-]/g, '_');
      saveAs(blob, `${safeName}_sample.pdf`);
    } catch (err) {
      console.error('Failed to generate sample PDF', err);
      alert('Failed to generate sample PDF: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setDownloadingSingle(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar with Navigation & Sample Download */}
      <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">3. Live Record Preview</h2>
          <p className="text-xs text-neutral-500">
            Cycle through recipients to verify text fitting, alignment, and formatting before bulk generation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50/70 p-1">
            <button
              type="button"
              onClick={() => setPreviewIndex(Math.max(0, previewIndex - 1))}
              disabled={previewIndex === 0}
              className="rounded-md px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-white hover:shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              ← Prev
            </button>
            <span className="px-2 font-mono text-xs font-semibold text-neutral-700">
              {previewIndex + 1} / {total}
            </span>
            <button
              type="button"
              onClick={() => setPreviewIndex(Math.min(total - 1, previewIndex + 1))}
              disabled={previewIndex === total - 1}
              className="rounded-md px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-white hover:shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              Next →
            </button>
          </div>

          <button
            type="button"
            onClick={handleDownloadSingle}
            disabled={downloadingSingle || placements.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 shadow-xs hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {downloadingSingle ? 'Exporting...' : 'Download This PDF'}
          </button>
        </div>
      </div>

      {/* Current Recipient Field Badges */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-neutral-200/80 bg-neutral-50/80 px-5 py-3 text-xs">
        <span className="font-semibold text-neutral-600">Active Row:</span>
        {headers.map((h) => (
          <span key={h} className="inline-flex items-center gap-1">
            <span className="font-medium text-neutral-500">{h}:</span>
            <span className="font-semibold text-neutral-800">{record[h] || <span className="text-neutral-300 italic">none</span>}</span>
          </span>
        ))}
      </div>

      {/* High-fidelity Canvas Preview */}
      <div className="flex justify-center">
        <div
          className="relative overflow-hidden rounded-xl border border-neutral-300 bg-white shadow-lg"
          style={{ width: w, height: h, maxWidth: '100%' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={template.dataUrl}
            alt="Preview Background"
            className="pointer-events-none absolute inset-0 h-full w-full object-contain"
            draggable={false}
          />

          {placements.map((p) => {
            const text = record[p.field] || `{${p.field}}`;

            let transform = 'translate(0, 0)';
            if (p.align === 'center') transform = 'translate(-50%, 0)';
            if (p.align === 'right') transform = 'translate(-100%, 0)';

            return (
              <div
                key={p.id}
                className="absolute pointer-events-none whitespace-nowrap"
                style={{
                  left: `${p.x}px`,
                  top: `${p.y}px`,
                  transform,
                  fontSize: `${p.fontSize}px`,
                  color: p.color,
                  fontFamily: getCssFamily(p.fontFamily),
                  fontWeight: p.fontFamily.includes('Bold') ? 'bold' : 'normal',
                  fontStyle: p.fontFamily.includes('Oblique') || p.fontFamily.includes('Italic') ? 'italic' : 'normal',
                  lineHeight: 1,
                  padding: '2px 4px',
                  backgroundColor: 'transparent',
                }}
              >
                {text}
              </div>
            );
          })}
        </div>
      </div>

      {placements.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
          ⚠ No placeholders placed yet. Please return to <strong>Step 2 (Place Fields)</strong> to position your fields.
        </div>
      )}
    </div>
  );
}
