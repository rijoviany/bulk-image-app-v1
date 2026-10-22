export interface FontDefinition {
  id: string;
  label: string;
  category: 'Cursive' | 'Minimalist' | 'Professional' | 'Standard';
  fileUrl?: string;
  cssFamily: string;
  isStandard?: boolean;
}

export const CURATED_FONTS: FontDefinition[] = [
  // Cursive & Calligraphy
  {
    id: 'Great-Vibes',
    label: 'Great Vibes (Cursive Calligraphy)',
    category: 'Cursive',
    fileUrl: '/fonts/Great-Vibes.woff',
    cssFamily: "'Great Vibes', cursive",
  },
  {
    id: 'Dancing-Script',
    label: 'Dancing Script (Casual Cursive)',
    category: 'Cursive',
    fileUrl: '/fonts/Dancing-Script.woff',
    cssFamily: "'Dancing Script', cursive",
  },

  // Minimalist & Clean
  {
    id: 'Montserrat',
    label: 'Montserrat (Minimalist Sans)',
    category: 'Minimalist',
    fileUrl: '/fonts/Montserrat-Regular.woff',
    cssFamily: "'Montserrat', sans-serif",
  },
  {
    id: 'Montserrat-Bold',
    label: 'Montserrat Bold (Minimalist Bold)',
    category: 'Minimalist',
    fileUrl: '/fonts/Montserrat-Bold.woff',
    cssFamily: "'Montserrat', sans-serif",
  },

  // Professional & Elegant
  {
    id: 'Cinzel',
    label: 'Cinzel (Professional Classical Serif)',
    category: 'Professional',
    fileUrl: '/fonts/Cinzel-Regular.woff',
    cssFamily: "'Cinzel', serif",
  },
  {
    id: 'Cinzel-Bold',
    label: 'Cinzel Bold (Professional Diploma Title)',
    category: 'Professional',
    fileUrl: '/fonts/Cinzel-Bold.woff',
    cssFamily: "'Cinzel', serif",
  },

  // Standard Universal PDF Fonts
  {
    id: 'Helvetica',
    label: 'Helvetica (Simple Clean Sans)',
    category: 'Standard',
    cssFamily: 'Helvetica, Arial, sans-serif',
    isStandard: true,
  },
  {
    id: 'Helvetica-Bold',
    label: 'Helvetica Bold (Simple Sans Bold)',
    category: 'Standard',
    cssFamily: 'Helvetica, Arial, sans-serif',
    isStandard: true,
  },
  {
    id: 'Helvetica-Oblique',
    label: 'Helvetica Italic (Simple Italic)',
    category: 'Standard',
    cssFamily: 'Helvetica, Arial, sans-serif',
    isStandard: true,
  },
  {
    id: 'Times-Roman',
    label: 'Times Roman (Classic Serif)',
    category: 'Standard',
    cssFamily: "'Times New Roman', Times, serif",
    isStandard: true,
  },
  {
    id: 'Times-Roman-Bold',
    label: 'Times Roman Bold (Classic Serif Bold)',
    category: 'Standard',
    cssFamily: "'Times New Roman', Times, serif",
    isStandard: true,
  },
  {
    id: 'Courier',
    label: 'Courier (Simple Monospace)',
    category: 'Standard',
    cssFamily: 'Courier, monospace',
    isStandard: true,
  },
  {
    id: 'Courier-Bold',
    label: 'Courier Bold (Simple Monospace Bold)',
    category: 'Standard',
    cssFamily: 'Courier, monospace',
    isStandard: true,
  },
];

// In-memory cache for bundled font ArrayBuffers so we only fetch once
const fontBufferCache = new Map<string, ArrayBuffer>();

export async function getFontBuffer(fontId: string): Promise<ArrayBuffer | null> {
  if (fontBufferCache.has(fontId)) {
    return fontBufferCache.get(fontId)!.slice(0);
  }

  const def = CURATED_FONTS.find((f) => f.id === fontId);
  if (!def?.fileUrl) return null;

  try {
    const res = await fetch(def.fileUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching font ${fontId}`);
    const buffer = await res.arrayBuffer();
    fontBufferCache.set(fontId, buffer);
    return buffer.slice(0);
  } catch (err) {
    console.warn(`Could not load font buffer for ${fontId}`, err);
    return null;
  }
}
