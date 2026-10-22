'use client';

import { useState, useCallback } from 'react';
import { useTemplateStore } from '../hooks/useTemplateStore';
import { CURATED_FONTS } from '../lib/fonts';

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

  const categories = ['Cursive', 'Minimalist', 'Professional', 'Standard'] as const;

  return (
    <div className="space-y-4 rounded-xl border border-neutral-200/80 bg-white p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">3. Built-In Typography</h2>
          <p className="text-xs text-neutral-500">
            Curated cursive calligraphy, minimalist modern sans, and professional classical fonts are ready to use.
          </p>
        </div>

        <label className="inline-flex cursor-pointer items-center gap-1.5 self-start rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-xs hover:bg-neutral-50 transition-colors">
          <svg className="h-4 w-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Upload Custom (.ttf / .otf)
          <input type="file" accept=".ttf,.otf,.woff" onChange={handleUpload} className="sr-only" />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        {categories.map((cat) => (
          <div key={cat} className="rounded-lg bg-neutral-50/80 p-3 border border-neutral-200/60 space-y-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-neutral-400">
              {cat}
            </span>
            <div className="flex flex-wrap gap-1">
              {CURATED_FONTS.filter((f) => f.category === cat).map((f) => (
                <span
                  key={f.id}
                  className="inline-block rounded-md bg-white px-2 py-1 text-xs font-medium text-neutral-800 border border-neutral-200/80 shadow-2xs"
                  style={{ fontFamily: f.cssFamily }}
                >
                  {f.label.split(' (')[0]}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {customFonts.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
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
      )}

      {fontStatus && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-2 text-xs text-blue-700">
          {fontStatus}
        </div>
      )}
    </div>
  );
}
