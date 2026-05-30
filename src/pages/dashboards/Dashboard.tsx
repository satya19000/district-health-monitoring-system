import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Download } from 'lucide-react';
import AppLayout, { PageHeader } from '../../components/AppLayout';
import { IndicatorCard, MetricBarChart, TrendLineChart } from '../../components/Charts';
import { EmptyState, Spinner } from '../../components/ui/Primitives';
import { INDICATORS, INDICATOR_MAP, classify, normalizeIndicatorKey } from '../../lib/indicators';
import { fetchMetrics } from '../../services/databaseService';
import { exportPDF } from '../../lib/reports';
import { can, type DashboardScope } from '../../lib/roles';
import { useAuth } from '../../context/AuthContext';
import type { MetricRow } from '../../types';

const SCOPE_META: Record<DashboardScope, { eyebrow: string; title: string }> = {
  state: { eyebrow: 'Statewide', title: 'State Overview' },
  district: { eyebrow: 'District', title: 'District Dashboard' },
  programme: { eyebrow: 'Programme', title: 'Programme Dashboard' },
  facility: { eyebrow: 'Facility', title: 'Facility Dashboard' },
  anm: { eyebrow: 'Field / Sub-centre', title: 'ANM Field Dashboard' },
};

export default function Dashboard({ scope }: { scope: DashboardScope }) {
  const { user } = useAuth();
  const meta = SCOPE_META[scope];
  const [rows, setRows] = useState<MetricRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await fetchMetrics(scope);
    setRows(data);
    setLoading(false);
  }
  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [scope]);

  // latest value per indicator (by period string sort)
  const latestByIndicator = useMemo(() => {
    const map = new Map<string, MetricRow>();
    for (const r of rows) {
      const key = normalizeIndicatorKey(String(r.indicator ?? ''));
      const cur = map.get(key);
      if (!cur || String(r.period ?? '') > String(cur.period ?? '')) map.set(key, { ...r, indicator: key });
    }
    return map;
  }, [rows]);

  const cardData = INDICATORS.map((def) => ({
    def, row: latestByIndicator.get(def.key),
  }));

  const barData = cardData
    .filter((c) => c.row != null)
    .map((c) => ({ name: c.def.label, value: Number(c.row!.value), perf: classify(c.def, Number(c.row!.value)) }));

  // trend for a chosen indicator
  const [trendKey, setTrendKey] = useState<string>('IMMUNIZATION');
  const trendData = useMemo(() => {
    return rows
      .filter((r) => normalizeIndicatorKey(String(r.indicator)) === trendKey)
      .sort((a, b) => String(a.period ?? '').localeCompare(String(b.period ?? '')))
      .map((r) => ({ name: String(r.period ?? ''), value: Number(r.value) }));
  }, [rows, trendKey]);

  const exportable: MetricRow[] = cardData
    .filter((c) => c.row)
    .map((c) => ({ indicator: c.def.label, value: Number(c.row!.value), period: c.row!.period, scope }));

  return (
    <AppLayout>
      <PageHeader
        eyebrow={meta.eyebrow}
        title={meta.title}
        actions={
          <>
            <button className="btn btn-sm" onClick={load} disabled={loading}>
              {loading ? <Spinner /> : <RefreshCw size={15} />} Refresh
            </button>
            {can(user?.role, 'export_reports') && (
              <button
                className="btn btn-primary btn-sm"
                disabled={!exportable.length}
                onClick={() => exportPDF({ title: `${meta.title} Report`, subtitle: meta.eyebrow, metrics: exportable })}
              >
                <Download size={15} /> Export PDF
              </button>
            )}
          </>
        }
      />

      {loading ? (
        <div className="panel panel-pad tcenter"><Spinner large /></div>
      ) : (
        <>
          <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', marginBottom: 22 }}>
            {cardData.map(({ def, row }) => (
              <IndicatorCard key={def.key} def={def} value={row ? Number(row.value) : null} period={row?.period} />
            ))}
          </div>

          <div className="card-grid" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
            <div>
              {barData.length ? (
                <MetricBarChart data={barData} title="Current indicators vs targets" />
              ) : (
                <div className="panel panel-pad">
                  <EmptyState
                    title="No metrics yet for this scope"
                    hint={`Add rows to the "dashboard_metrics" table with scope = "${scope}", or upload data files and run AI analysis to populate indicators.`}
                  />
                </div>
              )}
            </div>
            <div className="panel panel-pad">
              <div className="row between" style={{ marginBottom: 14 }}>
                <div className="eyebrow">Trend</div>
                <select className="select" style={{ width: 'auto', padding: '6px 10px', fontSize: 12.5 }}
                  value={trendKey} onChange={(e) => setTrendKey(e.target.value)}>
                  {INDICATORS.map((i) => <option key={i.key} value={i.key}>{i.label}</option>)}
                </select>
              </div>
              {trendData.length ? (
                <TrendLineChart data={trendData} />
              ) : (
                <EmptyState title="No trend data" hint={`No periodic values found for ${INDICATOR_MAP[trendKey]?.full ?? trendKey}.`} />
              )}
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
