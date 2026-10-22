'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useTemplateStore } from '../hooks/useTemplateStore';
import { CURATED_FONTS } from '../lib/fonts';
import type { FieldPlacement } from '../lib/types';

const CANVAS_MAX_W = 860;

export function FieldPlacer() {
  const {
    template,
    headers,
    records,
    placements,
    addPlacement,
    updatePlacement,
    removePlacement,
    customFonts,
    previewIndex,
  } = useTemplateStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [canvasSize, setCanvasSize] = useState({ w: CANVAS_MAX_W, h: 600 });

  // Calculate display scale preserving aspect ratio
  useEffect(() => {
    if (!template) return;
    const aspect = template.height / template.width;
    const w = Math.min(CANVAS_MAX_W, template.width);
    setCanvasSize({ w, h: Math.round(w * aspect) });
  }, [template]);

  // Keep a valid active selection: if selectedId doesn't exist, default to the first placement
  const activeSelectedId = (selectedId && placements.some((p) => p.id === selectedId))
    ? selectedId
    : (placements[0]?.id ?? null);

  const currentRecord = records[previewIndex] ?? {};
  const selected = placements.find((p) => p.id === activeSelectedId) ?? null;

  const getCssFamily = useCallback((fontId: string) => {
    const curated = CURATED_FONTS.find((f) => f.id === fontId);
    if (curated) return curated.cssFamily;
    if (fontId.startsWith('Times')) return "'Times New Roman', serif";
    if (fontId.startsWith('Courier')) return 'Courier, monospace';
    return fontId;
  }, []);

  const addField = useCallback(
    (field: string) => {
      const existingCount = placements.filter((p) => p.field === field).length;
      const newId = `${field}-${Date.now()}-${existingCount}`;
      const placement: FieldPlacement = {
        id: newId,
        field,
        x: Math.round(canvasSize.w / 2),
        y: Math.min(canvasSize.h - 50, 80 + placements.length * 45),
        fontSize: 28,
        fontFamily: 'Great-Vibes', // Default to cursive for names/certificates
        color: '#ffffff', // Default to bright color visible on templates
        align: 'center',
      };
      addPlacement(placement);
      setSelectedId(newId);
    },
    [addPlacement, canvasSize, placements],
  );

  const autoPlaceAll = useCallback(() => {
    let firstId: string | null = null;
    headers.forEach((h, idx) => {
      const alreadyPlaced = placements.some((p) => p.field === h);
      if (!alreadyPlaced) {
        const newId = `${h}-${Date.now()}-${idx}`;
        if (!firstId) firstId = newId;
        addPlacement({
          id: newId,
          field: h,
          x: Math.round(canvasSize.w / 2),
          y: Math.round((canvasSize.h / (headers.length + 1)) * (idx + 1)),
          fontSize: idx === 0 ? 36 : 22,
          fontFamily: idx === 0 ? 'Great-Vibes' : idx === 1 ? 'Cinzel-Bold' : 'Montserrat',
          color: idx === 0 ? '#fbbf24' : '#ffffff',
          align: 'center',
        });
      }
    });
    if (firstId) {
      setSelectedId(firstId);
    }
  }, [headers, placements, addPlacement, canvasSize]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent, id: string) => {
      e.stopPropagation();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const p = placements.find((item) => item.id === id);
      if (!p) return;

      setDragging({
        id,
        offsetX: e.clientX - rect.left - p.x,
        offsetY: e.clientY - rect.top - p.y,
      });
      setSelectedId(id);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [placements],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const rawX = e.clientX - rect.left - dragging.offsetX;
      const rawY = e.clientY - rect.top - dragging.offsetY;

      const x = Math.max(0, Math.min(Math.round(rawX), canvasSize.w));
      const y = Math.max(0, Math.min(Math.round(rawY), canvasSize.h));

      updatePlacement(dragging.id, { x, y });
    },
    [dragging, canvasSize, updatePlacement],
  );

  const onPointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  if (!template) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
        Please upload or load a template background in Step 1 first.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Field selector bar */}
      <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Add Available CSV Fields</h3>
            <p className="text-xs text-neutral-500">
              Click any column below to add its placeholder to the template canvas. Drag to position.
            </p>
          </div>
          {headers.length > 0 && (
            <button
              type="button"
              onClick={autoPlaceAll}
              className="text-xs text-blue-600 hover:text-blue-700 bg-blue-50/70 hover:bg-blue-100/70 font-semibold px-3 py-1.5 rounded-lg border border-blue-200 transition-colors self-start cursor-pointer"
            >
              Auto-Place All Fields
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {headers.map((h) => {
            const isPlaced = placements.some((p) => p.field === h);
            return (
              <button
                key={h}
                type="button"
                onClick={() => addField(h)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  isPlaced
                    ? 'bg-blue-50 text-blue-800 border border-blue-200 shadow-xs'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200'
                }`}
              >
                <span className="text-blue-500 font-bold">+</span>
                {`{${h}}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Canvas & Inspector Layout */}
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* Interactive Canvas Viewport */}
        <div className="flex-1 w-full flex flex-col items-center">
          <div
            ref={containerRef}
            className="relative overflow-hidden rounded-xl border border-neutral-300 bg-neutral-950 shadow-md select-none touch-none"
            style={{
              width: canvasSize.w,
              height: canvasSize.h,
              maxWidth: '100%',
            }}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            {/* Background Template */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={template.dataUrl}
              alt="Certificate template background"
              className="pointer-events-none absolute inset-0 h-full w-full object-contain"
              draggable={false}
            />

            {/* Placed Dynamic Fields - Clean Text Without Background */}
            {placements.map((p) => {
              const displayText = currentRecord[p.field] || `{${p.field}}`;
              const isSelected = activeSelectedId === p.id;

              // Transform for exact anchor alignment
              let transform = 'translate(0, 0)';
              if (p.align === 'center') transform = 'translate(-50%, 0)';
              if (p.align === 'right') transform = 'translate(-100%, 0)';

              return (
                <div
                  key={p.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(p.id);
                  }}
                  onPointerDown={(e) => onPointerDown(e, p.id)}
                  className={`absolute cursor-grab active:cursor-grabbing whitespace-nowrap transition-all select-none ${
                    isSelected
                      ? 'z-30'
                      : 'hover:outline-1 hover:outline-dashed hover:outline-blue-400/60 z-20 cursor-pointer'
                  }`}
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
                    padding: '2px 6px',
                    // Pure transparent background for clear view of artwork
                    backgroundColor: 'transparent',
                    border: isSelected ? '1.5px dashed #3b82f6' : '1.5px dashed transparent',
                    borderRadius: 2,
                    textShadow: p.color === '#ffffff' ? '0 1px 3px rgba(0,0,0,0.7)' : 'none',
                  }}
                >
                  {isSelected && (
                    <span className="absolute -top-4 left-0 text-[10px] bg-blue-600 text-white font-mono px-1 rounded-t leading-tight pointer-events-none shadow-xs">
                      {`{${p.field}}`}
                    </span>
                  )}
                  {displayText}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between w-full max-w-[860px] text-xs text-neutral-400 mt-2 px-1">
            <span>Clear view enabled (no background). Click any text to edit or drag to reposition.</span>
            <span>Canvas size: {canvasSize.w} × {canvasSize.h}px</span>
          </div>
        </div>

        {/* Right-Side Properties Inspector */}
        <div className="w-full xl:w-80 rounded-xl border border-neutral-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                Field Properties
              </h3>
              {selected && (
                <p className="text-[11px] text-blue-600 font-mono font-medium">
                  {`{${selected.field}}`}
                </p>
              )}
            </div>
            {selected && (
              <button
                type="button"
                onClick={() => {
                  removePlacement(selected.id);
                  setSelectedId(null);
                }}
                className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
              >
                Delete Field
              </button>
            )}
          </div>

          {/* Quick Field Selector Dropdown if multiple fields exist */}
          {placements.length > 0 && (
            <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200/80 space-y-1">
              <label className="block text-[11px] font-semibold text-neutral-600">
                Active Field ({placements.length} placed)
              </label>
              <select
                value={selected?.id || ''}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-800 font-medium shadow-2xs focus:border-blue-500 focus:outline-hidden"
              >
                {placements.map((p, idx) => (
                  <option key={p.id} value={p.id}>
                    #{idx + 1}: {`{${p.field}}`} ({p.fontSize}px, {p.fontFamily})
                  </option>
                ))}
              </select>
            </div>
          )}

          {!selected ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              No fields placed on the canvas yet. Click any field button above to add one.
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              {/* Typeface Selection with Categories */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-neutral-700">Typeface / Font Style</label>
                <select
                  value={selected.fontFamily}
                  onChange={(e) => updatePlacement(selected.id, { fontFamily: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-800 shadow-2xs focus:border-blue-500 focus:outline-hidden"
                >
                  <optgroup label="✨ Cursive & Calligraphy">
                    {CURATED_FONTS.filter((f) => f.category === 'Cursive').map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="⚡ Minimalist & Modern">
                    {CURATED_FONTS.filter((f) => f.category === 'Minimalist').map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🎓 Professional Classical">
                    {CURATED_FONTS.filter((f) => f.category === 'Professional').map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="📄 Simple Universal PDF Fonts">
                    {CURATED_FONTS.filter((f) => f.category === 'Standard').map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </optgroup>
                  {customFonts.length > 0 && (
                    <optgroup label="📁 Uploaded Custom Fonts">
                      {customFonts.map((f) => (
                        <option key={f.name} value={f.name}>
                          {f.name} (Custom)
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Font Size Slider & Quick Step */}
              <div>
                <div className="flex items-center justify-between mb-1 text-xs">
                  <label className="font-semibold text-neutral-700">Font Size</label>
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {selected.fontSize} px
                  </span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={96}
                  value={selected.fontSize}
                  onChange={(e) => updatePlacement(selected.id, { fontSize: Number(e.target.value) })}
                  className="w-full accent-blue-600 cursor-pointer h-2 bg-neutral-200 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
                  <button
                    type="button"
                    onClick={() => updatePlacement(selected.id, { fontSize: Math.max(8, selected.fontSize - 2) })}
                    className="hover:text-neutral-700 font-mono"
                  >
                    -2px
                  </button>
                  <span>8px - 96px</span>
                  <button
                    type="button"
                    onClick={() => updatePlacement(selected.id, { fontSize: Math.min(96, selected.fontSize + 2) })}
                    className="hover:text-neutral-700 font-mono"
                  >
                    +2px
                  </button>
                </div>
              </div>

              {/* Text Alignment */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-neutral-700">Alignment</label>
                <div className="grid grid-cols-3 gap-1 rounded-lg bg-neutral-100 p-1">
                  {(['left', 'center', 'right'] as const).map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => updatePlacement(selected.id, { align: a })}
                      className={`rounded-md py-1.5 text-xs font-medium capitalize transition-all cursor-pointer ${
                        selected.align === a
                          ? 'bg-white text-blue-700 shadow-2xs font-bold'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Picker & Presets */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-neutral-700">Text Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selected.color}
                    onChange={(e) => updatePlacement(selected.id, { color: e.target.value })}
                    className="h-9 w-12 cursor-pointer rounded-lg border border-neutral-300 p-1 bg-white"
                  />
                  <input
                    type="text"
                    value={selected.color}
                    onChange={(e) => updatePlacement(selected.id, { color: e.target.value })}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 font-mono text-xs uppercase text-neutral-800"
                  />
                </div>
                {/* Quick Color Swatches */}
                <div className="flex items-center gap-1.5 mt-2">
                  {[
                    { label: 'White', hex: '#ffffff' },
                    { label: 'Gold', hex: '#fbbf24' },
                    { label: 'Navy', hex: '#1e3a8a' },
                    { label: 'Black', hex: '#0f172a' },
                    { label: 'Red', hex: '#dc2626' },
                    { label: 'Silver', hex: '#94a3b8' },
                  ].map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      title={c.label}
                      onClick={() => updatePlacement(selected.id, { color: c.hex })}
                      className="h-5 w-5 rounded-full border border-neutral-300 shadow-2xs cursor-pointer transition-transform hover:scale-110"
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>

              {/* Exact Coordinates */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100">
                <div>
                  <label className="mb-1 block text-xs font-medium text-neutral-500">X Position (px)</label>
                  <input
                    type="number"
                    value={Math.round(selected.x)}
                    onChange={(e) => updatePlacement(selected.id, { x: Number(e.target.value) })}
                    className="w-full rounded-lg border border-neutral-300 px-2.5 py-1.5 font-mono text-xs text-neutral-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-neutral-500">Y Position (px)</label>
                  <input
                    type="number"
                    value={Math.round(selected.y)}
                    onChange={(e) => updatePlacement(selected.id, { y: Number(e.target.value) })}
                    className="w-full rounded-lg border border-neutral-300 px-2.5 py-1.5 font-mono text-xs text-neutral-800"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
