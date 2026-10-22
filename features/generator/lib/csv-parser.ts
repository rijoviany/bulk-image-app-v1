import Papa from 'papaparse';
import type { CsvRecord } from './types';

export function parseCsv(file: File): Promise<{ headers: string[]; records: CsvRecord[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse<CsvRecord>(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const headers = results.meta.fields ?? [];
        if (headers.length === 0) {
          reject(new Error('CSV has no headers'));
          return;
        }
        resolve({ headers, records: results.data });
      },
      error(err) {
        reject(err);
      },
    });
  });
}
