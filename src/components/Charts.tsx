import React from 'react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid, Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { classify, type IndicatorDef, type Performance } from '../lib/indicators';

const PERF_COLOR: Record<Performance, string> = {
  good: 'var(--green)', warn: 'var(--amber)', bad: 'var(--rose)', unknown: 'var(--ink-3)',
};
const PERF_HEX: Record<Performance, string> = {
  good: '#5ee6a8', warn: '#f5b54a', bad: '#f87171', unknown: '#6f968f',
};

export function IndicatorCard({ def, value, period }: { def: IndicatorDef; value: number | null; period?: string }) {
  const perf = classify(def, value);
  const color = PERF_COLOR[perf];
  return (
    <div className="panel panel-pad rise" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(120px 60px at 100% 0%, ${color}22, transparent 70%)`, pointerEvents: 'none' }} />
      <div className="row between" style={{ alignItems: 'flex-start' }}>
        <div>
          <div className="eyebrow">{def.label}</div>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{def.full}</div>
        </div>
        <span className="badge" style={{ color, borderColor: `${color}55` }}>
          {perf === 'good' ? <TrendingUp size={12} /> : perf === 'bad' ? <TrendingDown size={12} /> : <Minus size={12} />}
          {perf === 'unknown' ? 'no data' : perf}
        </span>
      </div>
      <div className="row" style={{ alignItems: 'baseline', gap: 6, marginTop: 14 }}>
        <span className="mono" style={{ fontSize: 30, fontWeight: 600, color: 'var(--ink)' }}>
          {value == null ? '—' : value.toLocaleString()}
        </span>
        <span className="muted" style={{ fontSize: 12 }}>{def.unit}</span>
      </div>
      <div className="row between" style={{ marginTop: 8, fontSize: 11.5 }}>
        <span className="muted">Target {def.direction === 'lower' ? '≤' : '≥'} {def.target}{def.unit === '%' ? '%' : ''}</span>
        <span className="muted">{period ?? ''}</span>
      </div>
    </div>
  );
}

interface ChartDatum { name: string; value: number; perf?: Performance; }

export function MetricBarChart({ data, title }: { data: ChartDatum[]; title?: string }) {
  return (
    <div className="panel panel-pad">
      {title && <div className="eyebrow" style={{ marginBottom: 14 }}>{title}</div>}
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 6, right: 8, left: -16, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#163b37" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: '#9fc4bd', fontSize: 11 }} axisLine={{ stroke: '#1d4541' }} tickLine={false} />
          <YAxis tick={{ fill: '#6f968f', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: 'rgba(45,212,191,0.06)' }}
            contentStyle={{ background: '#102725', border: '1px solid #1d4541', borderRadius: 10, color: '#e8f4f1', fontSize: 12 }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((d, i) => <Cell key={i} fill={PERF_HEX[d.perf ?? 'unknown']} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TrendLineChart({ data, title }: { data: { name: string; value: number }[]; title?: string }) {
  return (
    <div className="panel panel-pad">
      {title && <div className="eyebrow" style={{ marginBottom: 14 }}>{title}</div>}
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 6, right: 8, left: -16, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#163b37" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: '#9fc4bd', fontSize: 11 }} axisLine={{ stroke: '#1d4541' }} tickLine={false} />
          <YAxis tick={{ fill: '#6f968f', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: '#102725', border: '1px solid #1d4541', borderRadius: 10, color: '#e8f4f1', fontSize: 12 }} />
          <Line type="monotone" dataKey="value" stroke="#2dd4bf" strokeWidth={2.5} dot={{ r: 3, fill: '#2dd4bf' }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
