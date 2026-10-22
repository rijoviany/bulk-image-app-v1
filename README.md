# Bulk PDF Studio

A client-side personalized PDF bulk generator built for deployment on **Vercel** with **perpetual free-tier** adherence.

Generate hundreds of certificates, diplomas, event passes, invoices, or badges from a single template (image or PDF) and a CSV recipient list — with real-time drag-and-drop placeholder positioning, custom typography, live per-record preview, and instant ZIP download.

---

## 🚀 Key Features

- **100% Client-Side Architecture**:
  - All PDF rendering, font embedding, and ZIP archiving runs directly in the user's browser using `pdf-lib` and WebAssembly.
  - Zero serverless execution timeouts, zero database connection limits, and zero compute costs on Vercel.
- **Dual Template Support**:
  - Upload high-resolution images (`PNG`, `JPG`) or single-page `PDF` vector templates.
  - Automatic aspect-ratio scaling to match canvas coordinates to PDF point dimensions.
- **Dynamic Recipient CSV Parser**:
  - Upload CSV spreadsheets with custom headers (`FullName`, `Course`, `Date`, `Grade`, `ID`).
  - First-5-row live table preview with validation.
  - Includes sample CSV download and 1-click demo data loaders.
- **Interactive Drag-and-Drop Canvas**:
  - Add column placeholders `{Name}`, `{Course}` to the canvas with 1 click.
  - Drag and drop anywhere on the template.
  - Choose fonts (Helvetica, Times Roman, Courier, Bold/Italic variants + custom `.ttf`/`.otf` font upload).
  - Fine-tune font size (8–96px), text color (color picker + hex), text alignment (Left, Center, Right), and numeric X/Y pixel coords.
- **Live Per-Recipient Preview**:
  - Cycle through all records (Prev / Next) to verify text wrapping, margins, and styling.
  - Single-click test export ("Download This PDF") for instant quality checks.
- **Bulk PDF Engine & Instant ZIP Download**:
  - Multi-threaded chunked processing with responsive percentage progress bar.
  - Automatic filename generation based on recipient names.
  - Downloadable ZIP link generated via `JSZip` + `file-saver`.
- **Privacy & Memory Purge**:
  - "Remove from Vercel App & Purge Memory" button immediately revokes all blob URLs and clears state from browser memory once downloaded.

---

## 🛠️ Tech Stack & Constraints

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (Flat minimalist design system, 8pt spatial grid, WCAG AA contrast)
- **PDF Engine**: [pdf-lib](https://pdf-lib.js.org/) + [@pdf-lib/fontkit](https://github.com/Hopding/fontkit)
- **CSV Parser**: [PapaParse](https://www.papaparse.com/)
- **Archiver**: [JSZip](https://stuk.github.io/jszip/) + [FileSaver](https://github.com/eligrey/FileSaver.js/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)

---

## 📦 Deployment to Vercel

### Option 1: Vercel CLI
```bash
npm i -g vercel
vercel
```

### Option 2: GitHub Integration
1. Push repository to GitHub.
2. Import project into your [Vercel Dashboard](https://vercel.com).
3. Framework preset: **Next.js**.
4. Click **Deploy** — zero environment variables or database connections required!

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Production build test
npm run build
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

# bulk-image-app-v1
