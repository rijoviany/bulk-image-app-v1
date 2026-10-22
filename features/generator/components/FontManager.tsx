'use client';

import { useState, useCallback } from 'react';
import { useTemplateStore } from '../hooks/useTemplateStore';

export const BUILT_IN_FONTS = [
  'Helvetica',
  'Helvetica-Bold',
  'Helvetica-Oblique',
  'Times-Roman',
  'Times-Roman-Bold',
  'Times-Roman-Italic',
  'Courier',
  'Courier-Bold',
];

export function FontManager() {
  const { customFonts, addCustomFont } = useTemplateStore();
  const [fontStatus, setFontStatus] = useState<string | null>(null);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const data = await file.arrayBuffer();
        const rawName = file.name.replace(/\.(ttf|otf|woff)$/i, '');
        // Clean font family name for CSS
        const cleanName = rawName.replace(/[^a-zA-Z0-9_-]/g, '_');

        // Dynamically register with browser document fonts using a clone
        try {
          const fontFace = new FontFace(cleanName, data.slice(0));
          await fontFace.load();
          document.fonts.add(fontFace);
        } catch (cssErr) {
          console.warn('Could not register font with CSS FontFace API', cssErr);
        }

        addCustomFont({ name: cleanName, data: data.slice(0) });
        setFontStatus(`Font "${cleanName}" loaded successfully.`);
        setTimeout(() => setFontStatus(null), 3500);
      } catch (err) {
        console.error('Failed to load font:', err);
        setFontStatus('Failed to load font file. Ensure it is a valid .ttf or .otf file.');
      }
      e.target.value = '';
    },
    [addCustomFont],
  );

  return (
    <div className="space-y-4 rounded-xl border border-neutral-200/80 bg-white p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">3. Fonts & Typography</h2>
          <p className="text-xs text-neutral-500">
            Standard PDF fonts are ready. Upload any custom branding font (.ttf / .otf).
          </p>
        </div>

        <label className="inline-flex cursor-pointer items-center gap-1.5 self-start rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-xs hover:bg-neutral-50 transition-colors">
          <svg className="h-4 w-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Upload Custom Font (.ttf / .otf)
          <input type="file" accept=".ttf,.otf" onChange={handleUpload} className="sr-only" />
        </label>
      </div>

      <div className="flex flex-wrap gap-1.5 pt-1">
        {BUILT_IN_FONTS.map((f) => (
          <span
            key={f}
            className="inline-flex items-center rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 font-mono"
          >
            {f}
          </span>
        ))}
        {customFonts.map((f) => (
          <span
            key={f.name}
            className="inline-flex items-center gap-1 rounded-md bg-purple-50 border border-purple-200 px-2.5 py-1 text-xs font-semibold text-purple-700"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
            {f.name} (Custom)
          </span>
        ))}
      </div>

      {fontStatus && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-2 text-xs text-blue-700">
          {fontStatus}
        </div>
      )}
    </div>
  );
}
