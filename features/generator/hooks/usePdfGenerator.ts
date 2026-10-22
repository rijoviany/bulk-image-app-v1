import { useCallback } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { renderSinglePdf } from '../lib/pdf-engine';
import { useTemplateStore } from './useTemplateStore';

function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function usePdfGenerator() {
  const {
    template,
    records,
    placements,
    customFonts,
    setProgress,
    setDownloadResult,
  } = useTemplateStore();

  const generate = useCallback(
    async (canvasWidth: number, canvasHeight: number) => {
      if (!template || records.length === 0 || placements.length === 0) return;

      const total = records.length;
      setProgress({ current: 0, total, status: 'generating' });

      const zip = new JSZip();
      const CHUNK = 4; // Chunk size to keep browser UI frame rate 60fps

      try {
        for (let i = 0; i < total; i += CHUNK) {
          const batch = records.slice(i, i + CHUNK);
          const pdfs = await Promise.all(
            batch.map((record) =>
              renderSinglePdf(template, record, placements, customFonts, canvasWidth, canvasHeight),
            ),
          );

          pdfs.forEach((bytes, j) => {
            const idx = i + j;
            // Use first non-empty CSV column value as filename
            const firstKey = Object.keys(records[idx])[0];
            const rawVal = records[idx][firstKey] || `record_${idx + 1}`;
            const label = String(rawVal).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 32);
            zip.file(`${label}_${idx + 1}.pdf`, bytes);
          });

          setProgress({ current: Math.min(i + CHUNK, total), total, status: 'generating' });

          // Yield to browser main thread
          await new Promise((r) => setTimeout(r, 10));
        }

        setProgress({ current: total, total, status: 'zipping' });
        const blob = await zip.generateAsync({
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 },
        });

        const filename = `bulk_certificates_${Date.now()}.zip`;
        const blobUrl = URL.createObjectURL(blob);
        const humanSize = formatBytes(blob.size);

        setDownloadResult(blobUrl, filename, humanSize);
        setProgress({ current: total, total, status: 'done' });

        // Auto trigger download for zero-friction
        saveAs(blob, filename);
      } catch (err) {
        console.error('PDF Bulk generation error:', err);
        setProgress({
          current: 0,
          total,
          status: 'error',
          error: err instanceof Error ? err.message : 'Generation failed unexpectedly',
        });
      }
    },
    [template, records, placements, customFonts, setProgress, setDownloadResult],
  );

  return { generate };
}
