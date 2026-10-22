'use client';

import { useTemplateStore } from '../hooks/useTemplateStore';
import { TemplateUploader } from './TemplateUploader';
import { CsvUploader } from './CsvUploader';
import { FontManager } from './FontManager';
import { FieldPlacer } from './FieldPlacer';
import { RecordPreview } from './RecordPreview';
import { BulkGenerator } from './BulkGenerator';
import { createSampleTemplate, SAMPLE_HEADERS, SAMPLE_RECORDS, createSamplePlacements } from '../lib/demo-data';
import type { Step } from '../lib/types';

const STEPS: { key: Step; label: string; number: number }[] = [
  { key: 'upload', label: '1. Upload & Setup', number: 1 },
  { key: 'place', label: '2. Place Placeholders', number: 2 },
  { key: 'preview', label: '3. Record Preview', number: 3 },
  { key: 'generate', label: '4. Bulk Generate', number: 4 },
];

export function StepWizard() {
  const {
    step,
    setStep,
    template,
    records,
    placements,
    purgeAllData,
    setTemplate,
    setCsvData,
    addPlacement,
  } = useTemplateStore();

  const canProceed: Record<Step, boolean> = {
    upload: Boolean(template && records.length > 0),
    place: placements.length > 0,
    preview: placements.length > 0,
    generate: true,
  };

  const stepIdx = STEPS.findIndex((s) => s.key === step);

  const handleLoadFullDemo = async () => {
    try {
      const demoTemplate = await createSampleTemplate();
      setTemplate(demoTemplate);
      setCsvData(SAMPLE_HEADERS, SAMPLE_RECORDS);
      
      const aspect = demoTemplate.height / demoTemplate.width;
      const canvasW = Math.min(860, demoTemplate.width);
      const canvasH = Math.round(canvasW * aspect);
      const demoPlacements = createSamplePlacements(canvasW, canvasH);
      demoPlacements.forEach((p) => addPlacement(p));

      // Advance to step 2 automatically
      setStep('place');
    } catch (e) {
      console.error('Demo load error', e);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50/70 text-neutral-900 pb-16">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold shadow-xs">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-neutral-900">
                  Bulk PDF Studio
                </span>
                <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-600 border border-neutral-200">
                  Client-Side · Vercel Ready
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                Generate personalized certificates, badges & documents in bulk
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!template && (
              <button
                type="button"
                onClick={handleLoadFullDemo}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                1-Click Full Demo
              </button>
            )}

            <button
              type="button"
              onClick={purgeAllData}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              Reset / Start Over
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-5xl px-4 pt-8 sm:px-6 space-y-8">
        {/* Modern Step Wizard Tabs */}
        <nav aria-label="Progress Steps" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {STEPS.map((s, i) => {
            const isActive = s.key === step;
            const isDone = i < stepIdx;
            const isSelectable = isDone || isActive || (i === 1 && Boolean(template && records.length > 0)) || (i > 1 && canProceed[STEPS[i - 1].key]);

            return (
              <button
                key={s.key}
                type="button"
                disabled={!isSelectable}
                onClick={() => setStep(s.key)}
                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                  isActive
                    ? 'border-blue-600 bg-white shadow-xs ring-1 ring-blue-600'
                    : isDone
                      ? 'border-neutral-200/90 bg-white hover:border-neutral-300 cursor-pointer'
                      : 'border-neutral-200/50 bg-neutral-100/50 opacity-60 cursor-not-allowed'
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : isDone
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-neutral-200 text-neutral-600'
                  }`}
                >
                  {isDone ? '✓' : s.number}
                </span>
                <div className="truncate">
                  <p className={`text-xs font-bold leading-tight ${isActive ? 'text-blue-600' : 'text-neutral-800'}`}>
                    {s.label.split('. ')[1]}
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    {s.key === 'upload' && 'Files & Fonts'}
                    {s.key === 'place' && 'Drag & Adjust'}
                    {s.key === 'preview' && 'Inspect Rows'}
                    {s.key === 'generate' && 'Download ZIP'}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Dynamic Step View */}
        <div className="min-h-[440px]">
          {step === 'upload' && (
            <div className="space-y-6">
              <TemplateUploader />
              <CsvUploader />
              <FontManager />
            </div>
          )}

          {step === 'place' && <FieldPlacer />}

          {step === 'preview' && <RecordPreview />}

          {step === 'generate' && <BulkGenerator />}
        </div>

        {/* Footer Navigation Controls */}
        <footer className="flex items-center justify-between border-t border-neutral-200 pt-6">
          <button
            type="button"
            onClick={() => setStep(STEPS[Math.max(0, stepIdx - 1)].key)}
            disabled={stepIdx === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            ← Previous Step
          </button>

          <div className="flex items-center gap-3">
            {step === 'upload' && !canProceed.upload && (
              <span className="text-xs text-neutral-400">Upload template & CSV to proceed</span>
            )}
            {step === 'place' && !canProceed.place && (
              <span className="text-xs text-amber-600">Place at least one field to proceed</span>
            )}

            {stepIdx < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep(STEPS[stepIdx + 1].key)}
                disabled={!canProceed[step]}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Continue to {STEPS[stepIdx + 1].label.split('. ')[1]} →
              </button>
            ) : null}
          </div>
        </footer>
      </main>
    </div>
  );
}
