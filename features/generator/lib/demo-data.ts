import type { TemplateData, CsvRecord, FieldPlacement } from './types';

/**
 * Creates an in-memory crisp certificate template as PNG bytes & DataURL
 */
export async function createSampleTemplate(): Promise<TemplateData> {
  const width = 1200;
  const height = 850;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas context not available');
  }

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#f8fafc');
  grad.addColorStop(1, '#f1f5f9');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Outer Border
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 12;
  ctx.strokeRect(36, 36, width - 72, height - 72);

  // Inner Accent Border
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.strokeRect(48, 48, width - 96, height - 96);

  // Corner Ornaments
  const drawCorner = (x: number, y: number) => {
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(x, y, 16, 16);
  };
  drawCorner(48, 48);
  drawCorner(width - 64, 48);
  drawCorner(48, height - 64);
  drawCorner(width - 64, height - 64);

  // Certificate Header
  ctx.textAlign = 'center';
  ctx.fillStyle = '#3b82f6';
  ctx.font = 'bold 20px sans-serif';
  ctx.letterSpacing = '4px';
  ctx.fillText('ACME INSTITUTE OF TECHNOLOGY', width / 2, 160);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 54px serif';
  ctx.fillText('Certificate of Completion', width / 2, 240);

  ctx.fillStyle = '#64748b';
  ctx.font = 'italic 22px serif';
  ctx.fillText('This is proudly awarded to', width / 2, 310);

  // Divider Line
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 250, 430);
  ctx.lineTo(width / 2 + 250, 430);
  ctx.stroke();

  // Footer labels
  ctx.fillStyle = '#64748b';
  ctx.font = '16px sans-serif';
  ctx.fillText('for successfully mastering the advanced curriculum in', width / 2, 480);

  // Signatures
  ctx.strokeStyle = '#94a3b8';
  ctx.beginPath();
  ctx.moveTo(180, 720);
  ctx.lineTo(380, 720);
  ctx.moveTo(width - 380, 720);
  ctx.lineTo(width - 180, 720);
  ctx.stroke();

  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Program Director', 280, 745);
  ctx.fillText('Authorized Signature', width - 280, 745);

  const dataUrl = canvas.toDataURL('image/png');
  const res = await fetch(dataUrl);
  const bytes = await res.arrayBuffer();

  return {
    type: 'image',
    bytes,
    dataUrl,
    width,
    height,
  };
}

export const SAMPLE_RECORDS: CsvRecord[] = [
  {
    FullName: 'Sarah Connor',
    Course: 'Full-Stack Cloud Architecture',
    IssueDate: 'October 24, 2026',
    Grade: 'Distinction',
    CertificateID: 'CERT-2026-9041',
  },
  {
    FullName: 'Alexander Vance',
    Course: 'Quantum Computing & Edge AI',
    IssueDate: 'October 24, 2026',
    Grade: 'High Honors',
    CertificateID: 'CERT-2026-9042',
  },
  {
    FullName: 'Elena Rostova',
    Course: 'Distributed Systems & SRE',
    IssueDate: 'October 24, 2026',
    Grade: 'Distinction',
    CertificateID: 'CERT-2026-9043',
  },
  {
    FullName: 'Marcus Brody',
    Course: 'DevSecOps & Zero Trust',
    IssueDate: 'October 24, 2026',
    Grade: 'Honors',
    CertificateID: 'CERT-2026-9044',
  },
];

export const SAMPLE_HEADERS = ['FullName', 'Course', 'IssueDate', 'Grade', 'CertificateID'];

export function createSamplePlacements(canvasW: number, canvasH: number): FieldPlacement[] {
  return [
    {
      id: 'name-field',
      field: 'FullName',
      x: canvasW / 2,
      y: Math.round(canvasH * 0.44),
      fontSize: 48,
      fontFamily: 'Great-Vibes',
      color: '#1e3a8a',
      align: 'center',
    },
    {
      id: 'course-field',
      field: 'Course',
      x: canvasW / 2,
      y: Math.round(canvasH * 0.61),
      fontSize: 22,
      fontFamily: 'Cinzel-Bold',
      color: '#0f172a',
      align: 'center',
    },
    {
      id: 'date-field',
      field: 'IssueDate',
      x: canvasW / 2,
      y: Math.round(canvasH * 0.72),
      fontSize: 14,
      fontFamily: 'Montserrat',
      color: '#64748b',
      align: 'center',
    },
    {
      id: 'certid-field',
      field: 'CertificateID',
      x: canvasW - 80,
      y: 60,
      fontSize: 12,
      fontFamily: 'Courier',
      color: '#94a3b8',
      align: 'right',
    },
  ];
}
