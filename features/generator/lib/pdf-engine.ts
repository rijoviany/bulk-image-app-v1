import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { FieldPlacement, CsvRecord, CustomFont, TemplateData } from './types';

/** Hex string (#RRGGBB) → pdf-lib rgb */
function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  return rgb(
    parseInt(h.substring(0, 2), 16) / 255,
    parseInt(h.substring(2, 4), 16) / 255,
    parseInt(h.substring(4, 6), 16) / 255,
  );
}

export const STANDARD_FONT_MAP: Record<string, StandardFonts> = {
  Helvetica: StandardFonts.Helvetica,
  'Helvetica-Bold': StandardFonts.HelveticaBold,
  'Helvetica-Oblique': StandardFonts.HelveticaOblique,
  'Times-Roman': StandardFonts.TimesRoman,
  'Times-Roman-Bold': StandardFonts.TimesRomanBold,
  'Times-Roman-Italic': StandardFonts.TimesRomanItalic,
  Courier: StandardFonts.Courier,
  'Courier-Bold': StandardFonts.CourierBold,
};

interface FontCache {
  [name: string]: PDFFont;
}

async function embedFonts(
  doc: PDFDocument,
  placements: FieldPlacement[],
  customFonts: CustomFont[],
): Promise<FontCache> {
  const cache: FontCache = {};
  const needed = new Set(placements.map((p) => p.fontFamily));

  // If we have custom fonts, register fontkit
  if (customFonts.length > 0) {
    doc.registerFontkit(fontkit);
  }

  for (const name of needed) {
    if (cache[name]) continue;

    const stdKey = STANDARD_FONT_MAP[name];
    if (stdKey) {
      cache[name] = await doc.embedFont(stdKey);
      continue;
    }

    const custom = customFonts.find((f) => f.name === name);
    if (custom) {
      try {
        cache[name] = await doc.embedFont(custom.data);
      } catch (err) {
        console.warn(`Failed to embed custom font "${name}", falling back to Helvetica`, err);
        cache[name] = await doc.embedFont(StandardFonts.Helvetica);
      }
    } else {
      // Fallback to Helvetica
      cache[name] = await doc.embedFont(StandardFonts.Helvetica);
    }
  }
  return cache;
}

/** Render a single record to a PDF and return raw bytes */
export async function renderSinglePdf(
  template: TemplateData,
  record: CsvRecord,
  placements: FieldPlacement[],
  customFonts: CustomFont[],
  canvasWidth: number,
  canvasHeight: number,
): Promise<Uint8Array> {
  let doc: PDFDocument;
  let page: PDFPage;
  let pdfWidth: number;
  let pdfHeight: number;

  if (template.type === 'pdf') {
    // Load original PDF, use first page
    doc = await PDFDocument.load(template.bytes);
    page = doc.getPages()[0];
    pdfWidth = page.getWidth();
    pdfHeight = page.getHeight();
  } else {
    // Create new PDF with image dimensions
    doc = await PDFDocument.create();

    // Embed the image
    let img;
    const header = new Uint8Array(template.bytes.slice(0, 4));
    const isPng =
      header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47;
    if (isPng) {
      img = await doc.embedPng(template.bytes);
    } else {
      img = await doc.embedJpg(template.bytes);
    }

    pdfWidth = img.width;
    pdfHeight = img.height;
    page = doc.addPage([pdfWidth, pdfHeight]);
    page.drawImage(img, { x: 0, y: 0, width: pdfWidth, height: pdfHeight });
  }

  // Scale factor: canvas pixels → PDF points
  const scaleX = pdfWidth / canvasWidth;
  const scaleY = pdfHeight / canvasHeight;

  const fontCache = await embedFonts(doc, placements, customFonts);

  for (const pl of placements) {
    const text = String(record[pl.field] ?? '');
    const font = fontCache[pl.fontFamily] ?? fontCache['Helvetica'];
    const size = pl.fontSize * scaleY;

    // Convert canvas coords (origin top-left) to PDF coords (origin bottom-left)
    let x = pl.x * scaleX;
    const y = pdfHeight - pl.y * scaleY - size;

    // Handle horizontal alignment
    if (pl.align === 'center') {
      const textWidth = font.widthOfTextAtSize(text, size);
      x -= textWidth / 2;
    } else if (pl.align === 'right') {
      const textWidth = font.widthOfTextAtSize(text, size);
      x -= textWidth;
    }

    page.drawText(text, {
      x,
      y,
      size,
      font,
      color: hexToRgb(pl.color),
    });
  }

  return doc.save();
}
