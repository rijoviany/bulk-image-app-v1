/**
 * Client-side helper to render page 1 of a PDF to an image DataURL
 * Loads pdf.js dynamically from CDN to avoid Node.js canvas bundling issues with Turbopack.
 */
export async function renderPdfPageToDataUrl(
  pdfBytes: ArrayBuffer,
  scale = 2,
): Promise<{ dataUrl: string; width: number; height: number }> {
  if (typeof window === 'undefined') {
    throw new Error('renderPdfPageToDataUrl must be called in browser environment');
  }

  // Load PDF.js from CDN if not already loaded on window
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(window as any).pdfjsLib) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load PDF preview engine from CDN'));
      document.head.appendChild(script);
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfjsLib = (window as any).pdfjsLib;
  if (!pdfjsLib) {
    throw new Error('PDF.js library failed to initialize');
  }

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  // Load document from Uint8Array
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBytes) });
  const pdfDoc = await loadingTask.promise;
  const page = await pdfDoc.getPage(1);

  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas 2D context not available');
  }

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvasContext: context,
    viewport,
  }).promise;

  const dataUrl = canvas.toDataURL('image/png');
  const unscaledViewport = page.getViewport({ scale: 1 });

  return {
    dataUrl,
    width: unscaledViewport.width,
    height: unscaledViewport.height,
  };
}
