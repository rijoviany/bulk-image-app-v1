'use client';

import { useState, useCallback } from 'react';
import { parseCsv } from '../lib/csv-parser';
import { useTemplateStore } from '../hooks/useTemplateStore';
import { SAMPLE_RECORDS, SAMPLE_HEADERS } from '../lib/demo-data';

export function CsvUploader() {
  const { setCsvData, headers, records } = useTemplateStore();
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      try {
        const { headers: h, records: r } = await parseCsv(file);
        if (r.length === 0) {
          setError('CSV file has no data rows.');
          return;
        }
        setCsvData(h, r);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse CSV. Ensure valid headers and UTF-8 encoding.');
      }
    },
    [setCsvData],
  );

  const handleLoadDemo = () => {
    setError(null);
    setCsvData(SAMPLE_HEADERS, SAMPLE_RECORDS);
  };

  const handleDownloadSampleCsv = () => {
    const csvContent = 'data:text/csv;charset=utf-8,' +
      'FullName,Course,IssueDate,Grade,CertificateID\n' +
      'Sarah Connor,Full-Stack Cloud Architecture,October 24 2026,Distinction,CERT-2026-9041\n' +
      'Alexander Vance,Quantum Computing & Edge AI,October 24 2026,High Honors,CERT-2026-9042\n' +
      'Elena Rostova,Distributed Systems & SRE,October 24 2026,Distinction,CERT-2026-9043';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'sample_recipients.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <div className="space-y-4 rounded-xl border border-neutral-200/80 bg-white p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">2. Recipient Data (CSV)</h2>
          <p className="text-xs text-neutral-500">
            Upload CSV with columns corresponding to names, dates, IDs, courses, etc.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <button
            type="button"
            onClick={handleDownloadSampleCsv}
            className="text-xs text-neutral-600 hover:text-neutral-900 font-medium px-2.5 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            Download Sample CSV
          </button>
          <button
            type="button"
            onClick={handleLoadDemo}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50/80 hover:bg-blue-100/70 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Load Demo CSV
          </button>
        </div>
      </div>

      <label className="flex cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-neutral-300 bg-neutral-50/50 hover:bg-neutral-50 px-4 py-6 text-sm font-medium text-neutral-700 transition-colors">
        <svg className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
        <span>Upload your .csv spreadsheet</span>
        <input type="file" accept=".csv" onChange={onInputChange} className="sr-only" />
      </label>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {records.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-neutral-800">
              {records.length} records found · Columns:
            </span>
            <span className="text-neutral-500">First 5 records previewed</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {headers.map((h) => (
              <span
                key={h}
                className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-200"
              >
                {`{${h}}`}
              </span>
            ))}
          </div>

          <div className="overflow-x-auto rounded-lg border border-neutral-200/80 shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100/70 border-b border-neutral-200">
                <tr>
                  <th className="px-3 py-2 font-semibold text-neutral-600">#</th>
                  {headers.map((h) => (
                    <th key={h} className="px-3 py-2 font-semibold text-neutral-600">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {records.slice(0, 5).map((row, i) => (
                  <tr key={i} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="px-3 py-2 font-mono text-neutral-400">{i + 1}</td>
                    {headers.map((h) => (
                      <td key={h} className="px-3 py-2 text-neutral-800 whitespace-nowrap">
                        {row[h] || <span className="text-neutral-300 italic">empty</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
