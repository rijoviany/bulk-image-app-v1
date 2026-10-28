import type { PDFFont } from 'pdf-lib';

/**
 * Strips zero-width characters, bidi control codes (like U+202A, U+202C),
 * soft hyphens, and replaces common typographical Unicode marks with
 * clean equivalents.
 */
export function cleanText(input: unknown): string {
  if (input === null || input === undefined) return '';
  let str = String(input);

  // 1. Strip invisible control characters & bidirectional formatting markers
  // U+200B: Zero Width Space
  // U+200C: Zero Width Non-Joiner
  // U+200D: Zero Width Joiner
  // U+200E: Left-to-Right Mark
  // U+200F: Right-to-Left Mark
  // U+202A: Left-to-Right Embedding (The exact 0x202a error from Excel/CSV!)
  // U+202B: Right-to-Left Embedding
  // U+202C: Pop Directional Formatting
  // U+202D: Left-to-Right Override
  // U+202E: Right-to-Left Override
  // U+2060..U+206F: Word joiners & invisible formatting
  // U+FEFF: Zero Width No-Break Space / BOM
  // U+00AD: Soft Hyphen
  str = str.replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF\u00AD]/g, '');

  // 2. Normalize common typographical Unicode symbols to clean standard equivalents
  str = str
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'") // smart single quotes
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"') // smart double quotes
    .replace(/[\u2013\u2014]/g, '-')             // en-dash & em-dash
    .replace(/\u2026/g, '...')                   // ellipsis
    .replace(/[\u00A0\u202F\u2000-\u200A]/g, ' ') // non-breaking and special spaces
    .replace(/\u2022/g, '*');                    // bullet point

  return str.trim();
}

/**
 * Ensures text can be encoded by the specific font without throwing WinAnsi encoding errors.
 * For standard WinAnsi fonts (Helvetica, Times, Courier), verifies that every character
 * is encodable. If a character cannot be encoded, attempts NFD accent stripping
 * (e.g. é -> e), and if still unencodable, replaces with ASCII space to guarantee
 * that PDF rendering NEVER crashes on large CSV batches.
 */
export function sanitizeForFont(text: string, font: PDFFont): string {
  const cleaned = cleanText(text);

  // Fast path: test if font can encode the whole string cleanly
  try {
    font.encodeText(cleaned);
    return cleaned;
  } catch {
    // If encode failed, process character by character
  }

  let result = '';
  for (const char of cleaned) {
    try {
      font.encodeText(char);
      result += char;
    } catch {
      // Try stripping diacritic/accent (e.g. ç -> c, é -> e)
      const asciiChar = char.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      try {
        font.encodeText(asciiChar);
        result += asciiChar;
      } catch {
        // Last resort fallback: space so PDF never throws WinAnsi error
        result += ' ';
      }
    }
  }
  return result;
}
