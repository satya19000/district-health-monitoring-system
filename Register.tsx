import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { FileBarChart, FileDown, RefreshCw, ChevronRight, AlertTriangle, TrendingUp } from 'lucide-react';
import AppLayout, { PageHeader } from '../components/AppLayout';
import { Spinner, EmptyState } from '../components/ui/Primitives';
import { listReports } from '../services/databaseService';
import { exportPDF, exportExcel, exportWord } from '../lib/reports';
import type { AnalysisReport, AnalysisResult } from '../types';

function fmtDate(s?: string): string {
  if (!s) return '—';
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
}

function toResult(r: AnalysisReport): AnalysisResult {
  return {
    summary: r.summary ?? '',
    findings: r.findings ?? [],
    poor_indicators: r.poor_indicators ?? [],
    best_indicators: r.best_indicators ?? [],
    recommendations: r.recommendations ?? [],
    action_plan: r.action_plan ?? [],
  };
}

export default function Reports() {
  const [rows, setRows] = useState<AnalysisReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    const data = await listReports(100);
    setRows(data);
    if (data.length && !activeId) setActiveId(data[0].id ?? null);
    setLoading(false);
  }

  useEffect(() => { void refresh(); /* eslint-disable-next-line */ }, []);

  const active = useMemo(
    () => rows.find((r) => (r.id ?? '') === activeId) ?? null,
    [rows, activeId],
  );

  function payloadFor(r: AnalysisReport) {
    return {
      title: r.file_name ? `Analysis — ${r.file_name}` : 'AI Analysis Report',
      subtitle: r.model ? `Model: ${r.model}` : undefined,
      analysis: toResult(r),
      generatedFor: r.created_by ?? undefined,
    };
  }

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Saved Intelligence"
        title="Analysis Reports"
        actions={
          <button className="btn btn-ghost btn-sm" onClick={() => void refresh()}>
            <RefreshCw size={15} /> Refresh
          </button>
        }
      />

      {loading ? (
        <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><Spinner large /></div>
      ) : rows.length === 0 ? (
        <div className="panel panel-pad">
          <EmptyState
            icon={<FileBarChart size={26} />}
            title="No reports saved yet"
            hint="Run an AI analysis on an uploaded file and save it to see it here."
          />
        </div>
      ) : (
        <div className="card-grid" style={{ gridTemplateColumns: 'minmax(260px, 340px) 1fr', gap: 18, alignItems: 'start' }}>
          {/* list */}
          <div className="panel panel-pad" style={{ padding: 12 }}>
            {rows.map((r) => {
              const isActive = (r.id ?? '') === activeId;
              return (
                <button
                  key={r.id}
                  onClick={() => setActiveId(r.id ?? null)}
                  className="report-row"
                  style={{
                    width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                    background: isActive ? 'var(--panel-2)' : 'transparent',
                    borderRadius: 10, padding: '11px 12px', marginBottom: 4,
                    display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink)',
                  }}
                >
                  <FileBarChart size={16} style={{ color: 'var(--teal)', flexShrink: 0 }} />
                  <span style={{ flex: 1, overflow: 'hidden' }}>
                    <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {r.file_name || 'Untitled report'}
                    </span>
                    <span className="muted" style={{ fontSize: 11.5 }}>{fmtDate(r.created_at)}</span>
                  </span>
                  <ChevronRight size={15} className="muted" />
                </button>
              );
            })}
          </div>

          {/* detail */}
          <div>
            {active ? <ReportDetail report={active} payloadFor={payloadFor} /> : (
              <div className="panel panel-pad"><EmptyState title="Select a report" /></div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function ReportDetail({
  report,
  payloadFor,
}: {
  report: AnalysisReport;
  payloadFor: (r: AnalysisReport) => Parameters<typeof exportPDF>[0];
}) {
  const payload = payloadFor(report);
  return (
    <div className="card-grid" style={{ gap: 16 }}>
      <div className="panel panel-pad">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--ink-3)' }}>Report</div>
            <h3 style={{ margin: '4px 0 0', fontFamily: 'Fraunces, serif' }}>{report.file_name || 'Untitled report'}</h3>
            {report.model && <div className="mono muted" style={{ fontSize: 12, marginTop: 4 }}>{report.model}</div>}
          </div>
          <div className="row gap-8">
            <button className="btn btn-sm" onClick={() => exportPDF(payload)}><FileDown size={15} /> PDF</button>
            <button className="btn btn-sm" onClick={() => exportExcel(payload)}><FileDown size={15} /> Excel</button>
            <button className="btn btn-sm" onClick={() => void exportWord(payload)}><FileDown size={15} /> Word</button>
          </div>
        </div>
        <p style={{ margin: 0, lineHeight: 1.6, fontSize: 14 }}>{report.summary || 'No summary recorded.'}</p>
      </div>

      <div className="card-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <IndicatorPanel
          title="Underperforming"
          tone="bad"
          icon={<AlertTriangle size={16} />}
          items={report.poor_indicators ?? []}
        />
        <IndicatorPanel
          title="Best performing"
          tone="good"
          icon={<TrendingUp size={16} />}
          items={report.best_indicators ?? []}
        />
      </div>

      {(report.findings?.length ?? 0) > 0 && (
        <ListPanel title="Key findings" items={report.findings ?? []} />
      )}
      {(report.recommendations?.length ?? 0) > 0 && (
        <ListPanel title="Recommendations" items={report.recommendations ?? []} />
      )}

      {(report.action_plan?.length ?? 0) > 0 && (
        <div className="panel panel-pad">
          <div className="eyebrow" style={{ color: 'var(--ink-2)', marginBottom: 10 }}>Action plan</div>
          <table className="data">
            <thead><tr><th>Action</th><th>Owner</th><th>Timeframe</th></tr></thead>
            <tbody>
              {(report.action_plan ?? []).map((a, i) => (
                <tr key={i}><td>{a.action}</td><td className="muted">{a.owner ?? '—'}</td><td className="muted">{a.timeframe ?? '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ListPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="panel panel-pad">
      <div className="eyebrow" style={{ color: 'var(--ink-2)', marginBottom: 10 }}>{title}</div>
      <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8 }}>
        {items.map((it, i) => (
          <li key={i} style={{ fontSize: 14, lineHeight: 1.5 }}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

function IndicatorPanel({
  title, tone, icon, items,
}: {
  title: string;
  tone: 'good' | 'bad';
  icon: ReactNode;
  items: { indicator: string; value?: string; note?: string }[];
}) {
  return (
    <div className="panel panel-pad">
      <div className="row gap-8" style={{ color: tone === 'good' ? 'var(--green)' : 'var(--rose)', marginBottom: 12 }}>
        {icon}<span className="eyebrow" style={{ color: 'var(--ink-2)' }}>{title}</span>
      </div>
      {items.length === 0 ? (
        <div className="muted" style={{ fontSize: 13 }}>None identified.</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {items.map((it, i) => (
            <div key={i}>
              <div className="row gap-8" style={{ alignItems: 'center' }}>
                <span className={`badge ${tone === 'good' ? 'badge-good' : 'badge-bad'}`}>{it.indicator}</span>
                {it.value && <span className="mono muted" style={{ fontSize: 12.5 }}>{it.value}</span>}
              </div>
              {it.note && <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>{it.note}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
