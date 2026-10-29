import { useCallback, useRef, useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { renderSinglePdf } from '../lib/pdf-engine';
import { cleanText } from '../lib/text-sanitizer';
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
    splitBatchSize,
    setProgress,
    addDownloadBatch,
    purgeGenerationOnly,
  } = useTemplateStore();

  const abortControllerRef = useRef<AbortController | null>(null);
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setProgress({
      current: 0,
      total: records.length,
      currentBatch: 0,
      totalBatches: 0,
      status: 'cancelled',
    });
  }, [records.length, setProgress]);

  const generate = useCallback(
    async (canvasWidth: number, canvasHeight: number) => {
      if (!template || records.length === 0 || placements.length === 0) return;

      // Automatically purge previous generation blobs before creating new ones
      purgeGenerationOnly();

      const controller = new AbortController();
      abortControllerRef.current = controller;
      const { signal } = controller;

      const total = records.length;
      // Default to 250 records per ZIP
      const batchSize = Math.max(1, splitBatchSize || 250);
      const totalBatches = Math.ceil(total / batchSize);

      // Acquire Screen Wake Lock if supported so mobile/tablet screen stays awake during generation
      let wakeLock: unknown = null;
      if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          wakeLock = await (navigator as any).wakeLock.request('screen');
        } catch {
          // Ignore wake lock failure (not critical)
        }
      }

      setProgress({
        current: 0,
        total,
        currentBatch: 1,
        totalBatches,
        status: 'generating',
      });

      const CHUNK = 4; // sub-chunks to keep browser UI frame rate at 60fps

      try {
        let overallProcessed = 0;

        for (let b = 0; b < totalBatches; b++) {
          if (signal.aborted) {
            setProgress({
              current: overallProcessed,
              total,
              currentBatch: b + 1,
              totalBatches,
              status: 'cancelled',
            });
            return;
          }

          const batchStart = b * batchSize;
          const batchEnd = Math.min(batchStart + batchSize, total);
          const batchRecords = records.slice(batchStart, batchEnd);
          const batchCount = batchRecords.length;
          const partNumber = b + 1;

          const zip = new JSZip();

          for (let i = 0; i < batchCount; i += CHUNK) {
            if (signal.aborted) {
              setProgress({
                current: overallProcessed,
                total,
                currentBatch: partNumber,
                totalBatches,
                status: 'cancelled',
              });
              return;
            }

            const subChunk = batchRecords.slice(i, i + CHUNK);
            const pdfs = await Promise.all(
              subChunk.map((record) =>
                renderSinglePdf(template, record, placements, customFonts, canvasWidth, canvasHeight),
              ),
            );

            if (signal.aborted) {
              setProgress({
                current: overallProcessed,
                total,
                currentBatch: partNumber,
                totalBatches,
                status: 'cancelled',
              });
              return;
            }

            pdfs.forEach((bytes, j) => {
              const globalIdx = batchStart + i + j;
              const record = records[globalIdx];
              // Use first non-empty CSV column value as filename, sanitized
              const firstKey = Object.keys(record)[0];
              const rawVal = cleanText(record[firstKey]) || `record_${globalIdx + 1}`;
              const label = String(rawVal).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 32);
              zip.file(`${label}_${globalIdx + 1}.pdf`, bytes);
            });

            overallProcessed = Math.min(overallProcessed + subChunk.length, total);
            setProgress({
              current: overallProcessed,
              total,
              currentBatch: partNumber,
              totalBatches,
              status: 'generating',
            });

            // Yield to browser main thread
            await new Promise((r) => setTimeout(r, 10));
          }

          if (signal.aborted) {
            setProgress({
              current: overallProcessed,
              total,
              currentBatch: partNumber,
              totalBatches,
              status: 'cancelled',
            });
            return;
          }

          // Compressing this batch into ZIP
          setProgress({
            current: overallProcessed,
            total,
            currentBatch: partNumber,
            totalBatches,
            status: 'zipping',
          });

          const blob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 },
          });

          if (signal.aborted) {
            setProgress({
              current: overallProcessed,
              total,
              currentBatch: partNumber,
              totalBatches,
              status: 'cancelled',
            });
            return;
          }

          const filename =
            totalBatches > 1
              ? `certificates_part_${partNumber}_of_${totalBatches}_(${batchStart + 1}-${batchEnd}).zip`
              : `bulk_certificates_(${total}_records).zip`;

          const url = URL.createObjectURL(blob);
          const size = formatBytes(blob.size);

          addDownloadBatch({
            id: `batch-${partNumber}-${Date.now()}`,
            partNumber,
            totalParts: totalBatches,
            startRecord: batchStart + 1,
            endRecord: batchEnd,
            count: batchCount,
            url,
            filename,
            size,
          });

          // If single batch, auto-download. If multi-batch, auto-download Part 1 so user has immediate confirmation
          if (b === 0) {
            saveAs(blob, filename);
          }

          // Small yield between batch downloads
          await new Promise((r) => setTimeout(r, 150));
        }

        if (!signal.aborted) {
          setProgress({
            current: total,
            total,
            currentBatch: totalBatches,
            totalBatches,
            status: 'done',
          });
        }
      } catch (err) {
        if (signal.aborted) return;
        console.error('PDF Bulk generation error:', err);
        setProgress({
          current: 0,
          total,
          currentBatch: 0,
          totalBatches,
          status: 'error',
          error: err instanceof Error ? err.message : 'Generation failed unexpectedly',
        });
      } finally {
        if (wakeLock) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (wakeLock as any).release();
          } catch {
            // Ignore
          }
        }
        abortControllerRef.current = null;
      }
    },
    [
      template,
      records,
      placements,
      customFonts,
      splitBatchSize,
      setProgress,
      addDownloadBatch,
      purgeGenerationOnly,
    ],
  );

  const generateSample = useCallback(
    async (canvasWidth: number, canvasHeight: number, sampleCount = 5) => {
      if (!template || records.length === 0 || placements.length === 0) return null;

      setIsGeneratingSample(true);
      try {
        const count = Math.min(sampleCount, records.length);
        const chosenIndices = new Set<number>();
        while (chosenIndices.size < count) {
          chosenIndices.add(Math.floor(Math.random() * records.length));
        }
        const sampleIndices = Array.from(chosenIndices);
        const sampleRecords = sampleIndices.map((idx) => ({ record: records[idx], index: idx }));

        const zip = new JSZip();
        const sampledNames: string[] = [];

        for (const { record, index } of sampleRecords) {
          const pdfBytes = await renderSinglePdf(
            template,
            record,
            placements,
            customFonts,
            canvasWidth,
            canvasHeight,
          );

          const firstKey = Object.keys(record)[0];
          const rawVal = cleanText(record[firstKey]) || `sample_${index + 1}`;
          sampledNames.push(String(rawVal));
          const label = String(rawVal).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 32);
          zip.file(`${label}_sample_${index + 1}.pdf`, pdfBytes);
        }

        const blob = await zip.generateAsync({
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 },
        });

        const filename = `sample_${count}_random_recipients.zip`;
        saveAs(blob, filename);

        return { count, sampledNames, filename };
      } catch (err) {
        console.error('Sample generation error:', err);
        throw err;
      } finally {
        setIsGeneratingSample(false);
      }
    },
    [template, records, placements, customFonts],
  );

  return { generate, cancel, generateSample, isGeneratingSample };
}
