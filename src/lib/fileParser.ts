import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

export type FileCategory = 'excel' | 'csv' | 'pdf' | 'docx' | 'image' | 'zip' | 'other';

const EXT_CATEGORY: Record<string, FileCategory> = {
  xlsx: 'excel', xls: 'excel', xlsm: 'excel',
  csv: 'csv', tsv: 'csv',
  pdf: 'pdf',
  doc: 'docx', docx: 'docx',
  png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image', bmp: 'image',
  zip: 'zip',
};

/** Map a file category to the InsForge storage bucket it should live in. */
export const BUCKET_FOR_CATEGORY: Record<FileCategory, string> = {
  excel: 'excel-files',
  csv: 'excel-files',
  pdf: 'pdf-files',
  docx: 'documents',
  image: 'images',
  zip: 'uploads',
  other: 'uploads',
};

export function extOf(name: string): string {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : '';
}

export function categorize(file: File): FileCategory {
  return EXT_CATEGORY[extOf(file.name)] ?? 'other';
}

export const ACCEPTED_EXTENSIONS =
  '.xlsx,.xls,.xlsm,.csv,.tsv,.pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp,.zip';

/**
 * Extract a plain-text representation of a file's content where possible.
 * - Excel / CSV: flattened to CSV text per sheet (capped for prompt size).
 * - DOCX: raw text via mammoth.
 * - PDF / images: returned as null — these are sent to the AI gateway by URL
 *   so its native file/vision parser handles them server-side.
 */
export async function extractText(file: File, category: FileCategory): Promise<string | null> {
  try {
    if (category === 'excel' || category === 'csv') {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const parts: string[] = [];
      for (const sheetName of wb.SheetNames.slice(0, 8)) {
        const sheet = wb.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
        parts.push(`# Sheet: ${sheetName}\n${csv}`);
      }
      return clip(parts.join('\n\n'), 24000);
    }
    if (category === 'docx') {
      const buf = await file.arrayBuffer();
      const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
      return clip(value, 24000);
    }
    return null;
  } catch (err) {
    console.error('extractText failed', err);
    return null;
  }
}

function clip(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max) + '\n\n…[truncated for analysis]';
}
