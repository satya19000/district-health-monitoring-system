import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
  Document, Packer, Paragraph, HeadingLevel, TextRun,
  Table, TableRow, TableCell, WidthType, AlignmentType,
} from 'docx';
import type { AnalysisResult, MetricRow } from '../types';

const TEAL = '#0c4a47';

export interface ReportPayload {
  title: string;
  subtitle?: string;
  metrics?: MetricRow[];
  analysis?: AnalysisResult | null;
  generatedFor?: string;
}

function stamp(): string {
  return new Date().toLocaleString();
}

/* ----------------------------- PDF ----------------------------- */
export function exportPDF(payload: ReportPayload) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 56;

  doc.setFillColor(TEAL);
  doc.rect(0, 0, pageW, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(20, 40, 38);
  doc.text(payload.title, 40, y);
  y += 20;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(110, 120, 118);
  if (payload.subtitle) { doc.text(payload.subtitle, 40, y); y += 14; }
  doc.text(`Generated: ${stamp()}`, 40, y);
  y += 22;

  if (payload.metrics && payload.metrics.length) {
    autoTable(doc, {
      startY: y,
      head: [['Indicator', 'Value', 'Period', 'Scope']],
      body: payload.metrics.map((m) => [m.indicator, String(m.value), m.period ?? '—', m.scope ?? '—']),
      headStyles: { fillColor: [12, 74, 71] },
      styles: { fontSize: 9 },
      margin: { left: 40, right: 40 },
    });
    // @ts-expect-error lastAutoTable is attached at runtime by the plugin
    y = (doc.lastAutoTable?.finalY ?? y) + 24;
  }

  const a = payload.analysis;
  if (a) {
    y = section(doc, 'Executive Summary', y);
    y = paragraph(doc, a.summary || '—', y);
    y = bulletSection(doc, 'Key Findings', a.findings, y);
    y = bulletSection(doc, 'Underperforming Indicators', a.poor_indicators.map(fmtInd), y);
    y = bulletSection(doc, 'Best Performing Indicators', a.best_indicators.map(fmtInd), y);
    y = bulletSection(doc, 'Recommendations', a.recommendations, y);
    y = bulletSection(doc, 'Action Plan', a.action_plan.map((p) =>
      `${p.action}${p.owner ? ` — Owner: ${p.owner}` : ''}${p.timeframe ? ` (${p.timeframe})` : ''}`), y);
  }

  doc.save(filename(payload.title, 'pdf'));
}

function fmtInd(i: { indicator: string; value?: string; note: string }): string {
  return `${i.indicator}${i.value ? ` (${i.value})` : ''}: ${i.note}`;
}
function section(doc: jsPDF, title: string, y: number): number {
  y = ensure(doc, y, 60);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(12, 74, 71);
  doc.text(title, 40, y); return y + 16;
}
function paragraph(doc: jsPDF, text: string, y: number): number {
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(40, 50, 48);
  const lines = doc.splitTextToSize(text, doc.internal.pageSize.getWidth() - 80);
  for (const line of lines) { y = ensure(doc, y, 16); doc.text(line, 40, y); y += 14; }
  return y + 8;
}
function bulletSection(doc: jsPDF, title: string, items: string[], y: number): number {
  if (!items || !items.length) return y;
  y = section(doc, title, y);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(40, 50, 48);
  for (const item of items) {
    const lines = doc.splitTextToSize(`•  ${item}`, doc.internal.pageSize.getWidth() - 90);
    for (let i = 0; i < lines.length; i++) { y = ensure(doc, y, 16); doc.text(lines[i], i === 0 ? 46 : 54, y); y += 14; }
  }
  return y + 8;
}
function ensure(doc: jsPDF, y: number, need: number): number {
  if (y + need > doc.internal.pageSize.getHeight() - 50) { doc.addPage(); return 56; }
  return y;
}

/* ----------------------------- Excel ----------------------------- */
export function exportExcel(payload: ReportPayload) {
  const wb = XLSX.utils.book_new();

  if (payload.metrics && payload.metrics.length) {
    const ws = XLSX.utils.json_to_sheet(
      payload.metrics.map((m) => ({
        Indicator: m.indicator, Value: m.value, Period: m.period ?? '',
        Scope: m.scope ?? '', District: m.district_id ?? '', Facility: m.facility_id ?? '',
      }))
    );
    XLSX.utils.book_append_sheet(wb, ws, 'Metrics');
  }

  const a = payload.analysis;
  if (a) {
    const rows: Record<string, string>[] = [];
    rows.push({ Section: 'Summary', Detail: a.summary });
    a.findings.forEach((f) => rows.push({ Section: 'Finding', Detail: f }));
    a.poor_indicators.forEach((i) => rows.push({ Section: 'Poor Indicator', Detail: fmtInd(i) }));
    a.best_indicators.forEach((i) => rows.push({ Section: 'Best Indicator', Detail: fmtInd(i) }));
    a.recommendations.forEach((r) => rows.push({ Section: 'Recommendation', Detail: r }));
    a.action_plan.forEach((p) => rows.push({
      Section: 'Action', Detail: `${p.action}${p.owner ? ` | Owner: ${p.owner}` : ''}${p.timeframe ? ` | ${p.timeframe}` : ''}`,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'AI Analysis');
  }

  if (!wb.SheetNames.length) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['No data']]), 'Report');
  }
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([out], { type: 'application/octet-stream' }), filename(payload.title, 'xlsx'));
}

/* ----------------------------- Word ----------------------------- */
export async function exportWord(payload: ReportPayload) {
  const children: Paragraph[] = [];
  children.push(new Paragraph({ text: payload.title, heading: HeadingLevel.TITLE }));
  if (payload.subtitle) children.push(new Paragraph({ children: [new TextRun({ text: payload.subtitle, italics: true, color: '6f968f' })] }));
  children.push(new Paragraph({ children: [new TextRun({ text: `Generated: ${stamp()}`, color: '6f968f', size: 18 })] }));
  children.push(new Paragraph({ text: '' }));

  const a = payload.analysis;
  if (a) {
    children.push(new Paragraph({ text: 'Executive Summary', heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ text: a.summary || '—' }));
    addList(children, 'Key Findings', a.findings);
    addList(children, 'Underperforming Indicators', a.poor_indicators.map(fmtInd));
    addList(children, 'Best Performing Indicators', a.best_indicators.map(fmtInd));
    addList(children, 'Recommendations', a.recommendations);
    addList(children, 'Action Plan', a.action_plan.map((p) =>
      `${p.action}${p.owner ? ` — Owner: ${p.owner}` : ''}${p.timeframe ? ` (${p.timeframe})` : ''}`));
  }

  const sections: any = { children };
  if (payload.metrics && payload.metrics.length) {
    const header = new TableRow({
      children: ['Indicator', 'Value', 'Period', 'Scope'].map((t) =>
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, color: 'FFFFFF' })] })], shading: { fill: '0c4a47' } as any })),
    });
    const body = payload.metrics.map((m) => new TableRow({
      children: [m.indicator, String(m.value), m.period ?? '—', m.scope ?? '—'].map((t) =>
        new TableCell({ children: [new Paragraph(String(t))] })),
    }));
    children.push(new Paragraph({ text: 'Metrics', heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ text: '' }));
    (children as any).push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [header, ...body], alignment: AlignmentType.CENTER }));
  }

  const doc = new Document({ sections: [sections] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename(payload.title, 'docx'));
}

function addList(children: Paragraph[], title: string, items: string[]) {
  if (!items || !items.length) return;
  children.push(new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }));
  for (const item of items) children.push(new Paragraph({ text: item, bullet: { level: 0 } }));
}

function filename(title: string, ext: string): string {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const date = new Date().toISOString().slice(0, 10);
  return `${slug || 'report'}-${date}.${ext}`;
}
