'use client';

import { useState } from 'react';
import { useTemplateStore } from '../hooks/useTemplateStore';
import { usePdfGenerator } from '../hooks/usePdfGenerator';
import { saveAs } from 'file-saver';

export function BulkGenerator() {
  const {
    records,
    placements,
    progress,
    setProgress,
    template,
    splitBatchSize,
    setSplitBatchSize,
    downloadBatches,
    purgeGenerationOnly,
    purgeAllData,
  } = useTemplateStore();

  const { generate, cancel, generateSample, isGeneratingSample } = usePdfGenerator();
  const [notification, setNotification] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadAllProgress, setDownloadAllProgress] = useState<string | null>(null);

  const canGenerate = Boolean(template && records.length > 0 && placements.length > 0);

  const getCanvasSize = () => {
    if (!template) return { w: 860, h: 600 };
    const aspect = template.height / template.width;
    const w = Math.min(860, template.width);
    return { w, h: Math.round(w * aspect) };
  };

  const handleGenerate = () => {
    const { w, h } = getCanvasSize();
    generate(w, h);
  };

  const handleCancel = () => {
    cancel();
    setNotification('🛑 Bulk generation halted immediately via Kill Switch.');
  };

  const handleDownloadSample = async () => {
    const { w, h } = getCanvasSize();
    try {
      const result = await generateSample(w, h, 5);
      if (result) {
        const preview = result.sampledNames.slice(0, 3).join(', ');
        const extra = result.sampledNames.length > 3 ? ` + ${result.sampledNames.length - 3} more` : '';
        setNotification(
          `✓ Sample ZIP downloaded! Verified 5 random recipients: "${preview}${extra}". Check layout & font fidelity before running all ${records.length} records.`
        );
        setTimeout(() => setNotification(null), 8000);
      }
    } catch {
      setNotification('Failed to generate sample batch. Please try again.');
    }
  };

  const handlePurgeGeneration = () => {
    purgeGenerationOnly();
    setNotification('✓ Generated ZIP batches purged from memory. Your template and placements are preserved.');
    setTimeout(() => setNotification(null), 5000);
  };

  const handlePurgeAll = () => {
    purgeAllData();
    setNotification('✓ All session data, templates, CSVs, and generated files have been purged.');
    setTimeout(() => setNotification(null), 5000);
  };

  const handleDownloadAllSequentially = async () => {
    if (downloadBatches.length === 0 || downloadingAll) return;
    setDownloadingAll(true);

    for (let i = 0; i < downloadBatches.length; i++) {
      const batch = downloadBatches[i];
      setDownloadAllProgress(`Downloading Part ${batch.partNumber} of ${batch.totalParts}...`);
      try {
        const res = await fetch(batch.url);
        const blob = await res.blob();
        saveAs(blob, batch.filename);
      } catch (err) {
        console.error('Download error for batch:', batch.filename, err);
      }
      // 1.2s delay between downloads prevents browser multi-download blocking
      await new Promise((r) => setTimeout(r, 1200));
    }

    setDownloadAllProgress(null);
    setDownloadingAll(false);
  };

  const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
  const isGenerating = progress.status === 'generating' || progress.status === 'zipping';

  const totalBatchesExpected = Math.ceil(records.length / (splitBatchSize || 250));

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold tracking-tight text-neutral-900">Generate Bulk PDFs</h2>
        <p className="text-xs text-neutral-500">
          Everything processes in your browser. Automatic ZIP splitting & Unicode sanitization enabled.
        </p>
      </div>

      {notification && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/90 p-4 text-xs font-semibold text-blue-900 flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-blue-700 hover:text-blue-900 font-bold px-1 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-xs text-center">
          <p className="text-2xl font-bold tabular-nums text-neutral-900">{records.length}</p>
          <p className="text-xs font-medium text-neutral-500 mt-0.5">Recipients in CSV</p>
        </div>
        <div className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-xs text-center">
          <p className="text-2xl font-bold tabular-nums text-neutral-900">{placements.length}</p>
          <p className="text-xs font-medium text-neutral-500 mt-0.5">Placeholders Placed</p>
        </div>
        <div className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-xs text-center">
          <p className="text-2xl font-bold tabular-nums text-blue-600">
            {records.length > 0 ? `${totalBatchesExpected} ZIP ${totalBatchesExpected === 1 ? 'file' : 'parts'}` : '0'}
          </p>
          <p className="text-xs font-medium text-neutral-500 mt-0.5">
            {splitBatchSize} per ZIP
          </p>
        </div>
      </div>

      {/* ZIP Batch Split Setting */}
      <div className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div>
          <span className="font-semibold text-neutral-800">Split ZIP Archive Batches</span>
          <p className="text-neutral-500 text-[11px]">
            Splits large certificate sets into lightweight ZIP files for faster download and zero memory crashes.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <label className="text-neutral-600 font-medium">Batch Size:</label>
          <select
            value={splitBatchSize}
            onChange={(e) => setSplitBatchSize(Number(e.target.value))}
            disabled={isGenerating}
            className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-800 shadow-2xs focus:border-blue-500 focus:outline-hidden cursor-pointer"
          >
            <option value={100}>100 names per ZIP</option>
            <option value={250}>250 names per ZIP (Recommended)</option>
            <option value={500}>500 names per ZIP</option>
            <option value={10000}>All in 1 ZIP (No split)</option>
          </select>
        </div>
      </div>

      {/* Large Dataset Sample Download Banner (Active when records > 100) */}
      {records.length > 100 && (
        <div className="rounded-xl border border-indigo-200/90 bg-gradient-to-r from-indigo-50/70 via-blue-50/40 to-white p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800 tracking-wide uppercase">
                Sample Test
              </span>
              <span className="text-xs font-bold text-neutral-900">
                Large List Detected ({records.length} Recipients)
              </span>
            </div>
            <p className="text-[11px] text-neutral-600">
              Download a quick ZIP with <strong>5 randomly picked recipients</strong> to inspect alignments, font styling, and text boundaries before generating all {records.length} files.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadSample}
            disabled={!canGenerate || isGenerating || isGeneratingSample}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white px-4 py-2 text-xs font-bold shadow-xs hover:shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
            title="Generate and download 5 randomly sampled certificates"
          >
            {isGeneratingSample ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Generating 5 Samples...</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download Sample (5 Random Names)</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Main Action Box */}
      <div className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-xs space-y-6">
        {/* Progress Display */}
        {progress.status !== 'idle' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-800 flex items-center gap-2">
                {isGenerating && (
                  <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping" />
                )}
                {progress.status === 'generating' && (
                  <span>
                    Rendering {progress.totalBatches > 1 ? `Part ${progress.currentBatch} of ${progress.totalBatches}` : 'PDFs'}: {progress.current} of {progress.total}...
                  </span>
                )}
                {progress.status === 'zipping' && (
                  <span>
                    Compressing {progress.totalBatches > 1 ? `Part ${progress.currentBatch} of ${progress.totalBatches}` : 'ZIP archive'}...
                  </span>
                )}
                {progress.status === 'done' && '✓ All certificates generated and packaged successfully!'}
                {progress.status === 'cancelled' && (
                  <span className="text-amber-800 font-bold">
                    🛑 Generation stopped via Kill Switch ({progress.current} of {progress.total} processed)
                  </span>
                )}
                {progress.status === 'error' && `Error: ${progress.error}`}
              </span>

              <div className="flex items-center gap-2.5">
                {isGenerating && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="inline-flex items-center gap-1 rounded-md bg-red-100 hover:bg-red-200 text-red-700 px-2 py-0.5 text-xs font-bold transition-colors cursor-pointer border border-red-200"
                    title="Halt bulk generation immediately"
                  >
                    <svg className="w-3.5 h-3.5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Kill Switch
                  </button>
                )}
                <span className="font-mono font-bold text-neutral-600 tabular-nums">{pct}%</span>
              </div>
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-100 p-0.5 border border-neutral-200">
              <div
                className={`h-full rounded-full transition-all duration-200 ${
                  progress.status === 'error'
                    ? 'bg-red-500'
                    : progress.status === 'cancelled'
                      ? 'bg-amber-500'
                      : progress.status === 'done'
                        ? 'bg-emerald-500'
                        : 'bg-blue-600'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>

            {progress.status === 'cancelled' && (
              <div className="flex items-center justify-between rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Generation process was aborted. Any ZIP parts completed prior to stopping remain saved below.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setProgress({ current: 0, total: 0, currentBatch: 0, totalBatches: 0, status: 'idle' })}
                  className="font-semibold text-amber-800 underline hover:text-amber-950 cursor-pointer ml-2 shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        )}

        {/* Download Batches Card */}
        {downloadBatches.length > 0 && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                  READY FOR DOWNLOAD
                </span>
                <p className="text-sm font-bold text-neutral-900 mt-1">
                  {downloadBatches.length === 1
                    ? '1 ZIP Archive Ready'
                    : `${downloadBatches.length} Split ZIP Archives Ready (${downloadBatches.reduce((acc, b) => acc + b.count, 0)} Total PDFs)`}
                </p>
              </div>

              {downloadBatches.length > 1 && (
                <button
                  type="button"
                  onClick={handleDownloadAllSequentially}
                  disabled={downloadingAll}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {downloadAllProgress || `Download All ${downloadBatches.length} ZIP Parts`}
                </button>
              )}
            </div>

            {/* List of Batches */}
            <div className="space-y-2 pt-1">
              {downloadBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-lg border border-emerald-200/80 bg-white p-3 shadow-2xs"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-neutral-800">
                      📦 Part {batch.partNumber} of {batch.totalParts}: Records #{batch.startRecord} – #{batch.endRecord}
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      {batch.count} PDFs · Size: <strong>{batch.size}</strong> · {batch.filename}
                    </p>
                  </div>

                  <a
                    href={batch.url}
                    download={batch.filename}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors shrink-0 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Part {batch.partNumber}
                  </a>
                </div>
              ))}
            </div>

            {/* Granular Purge Actions */}
            <div className="pt-3 border-t border-emerald-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-600">
              <p>
                Downloaded your files? Purge memory or reset:
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handlePurgeGeneration}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-700 hover:text-neutral-900 bg-white hover:bg-neutral-100 border border-neutral-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
                  title="Purge only the generated ZIP from memory while preserving your template & CSV"
                >
                  <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Purge Generations (Keep Template)
                </button>

                <button
                  type="button"
                  onClick={handlePurgeAll}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/80 border border-red-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  title="Wipe everything including template, CSV, and generated files"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Purge Everything
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Primary Generate Button & Kill Switch Actions */}
        {progress.status !== 'done' && (
          <div className="space-y-3">
            {isGenerating ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  disabled
                  className="flex-1 rounded-xl bg-blue-600/75 py-3.5 px-4 text-sm font-bold text-white shadow-md cursor-not-allowed transition-all"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Generating {records.length} Bulk PDFs ({totalBatchesExpected} {totalBatchesExpected === 1 ? 'part' : 'split parts'})...
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white px-6 py-3.5 text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0"
                  title="Emergency Stop / Cancel generation immediately"
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Kill Switch (Stop)</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="w-full rounded-xl bg-blue-600 py-3.5 px-4 text-sm font-bold text-white shadow-md hover:bg-blue-700 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {`Generate ${records.length} Personalized PDFs (${totalBatchesExpected} ${totalBatchesExpected === 1 ? 'ZIP' : 'Split ZIPs of ' + splitBatchSize})`}
              </button>
            )}

            {!canGenerate && (
              <p className="text-center text-xs text-amber-600">
                {!template && '• Upload a template image or PDF first. '}
                {records.length === 0 && '• Upload a CSV recipient dataset. '}
                {placements.length === 0 && template && records.length > 0 && '• Place at least one field on the template canvas.'}
              </p>
            )}
          </div>
        )}

        {/* Architecture Note */}
        <div className="rounded-xl border border-neutral-100 bg-neutral-50/60 p-4 text-xs text-neutral-500 space-y-1">
          <p className="font-semibold text-neutral-700">🔒 Smart Batching & Zero-Server Deployment</p>
          <p>
            Large recipient lists (up to 2,000+ records) are split into clean batches of 250 to ensure maximum speed and stability across phones, tablets, and laptops. All special Unicode characters and invisible spreadsheet markers are sanitized automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
