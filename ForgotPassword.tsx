import React, { useRef, useState } from 'react';
import {
  BrainCircuit, FileUp, Sparkles, AlertTriangle, TrendingDown, TrendingUp,
  ListChecks, ClipboardList, Save, FileDown,
} from 'lucide-react';
import AppLayout, { PageHeader } from '../components/AppLayout';
import { Spinner, EmptyState } from '../components/ui/Primitives';
import { AI_MODEL } from '../lib/insforge';
import { categorize, extractText, ACCEPTED_EXTENSIONS } from '../lib/fileParser';
import { uploadFile } from '../services/storageService';
import { analyzeFile } from '../services/aiService';
import { recordUpload, saveReport } from '../services/databaseService';
import { exportPDF, exportWord, exportExcel } from '../lib/reports';
import { useAuth } from '../context/AuthContext';
import type { AnalysisResult, UploadedFile } from '../types';

type Stage = 'idle' | 'uploading' | 'analyzing' | 'done' | 'error';

export default function Analysis() {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [raw, setRaw] = useState('');
  const [record, setRecord] = useState<UploadedFile | null>(null);
  const [saved, setSaved] = useState(false);

  async function run(f: File) {
    setFile(f); setError(''); setResult(null); setSaved(false); setRecord(null);
    const category = categorize(f);
    try {
      // 1) store the file so we have a stable URL (also needed for PDF/image analysis)
      setStage('uploading');
      const stored = await uploadFile(f, user?.id);

      const rec: UploadedFile = {
        name: stored.name, bucket: stored.bucket, object_key: stored.objectKey, url: stored.url,
        size: stored.size, mime_type: stored.mimeType,
        category: stored.category, uploaded_by: user?.id, status: 'analyzing',
      };
      const savedRec = (await recordUpload(rec)) ?? rec;
      setRecord(savedRec);

      // 2) extract text where possible, else hand the URL to the gateway
      setStage('analyzing');
      const text = await extractText(f, category);
      const { result, raw } = await analyzeFile({ fileName: f.name, category, text, fileUrl: stored.url });
      setResult(result); setRaw(raw); setStage('done');
    } catch (e: any) {
      setError(e.message || 'Analysis failed'); setStage('error');
    }
  }

  async function persist() {
    if (!result) return;
    await saveReport({
      file_id: (record as any)?.id, file_name: file?.name, model: AI_MODEL,
      ...result, raw, created_by: user?.id,
    });
    setSaved(true);
  }

  const payload = result ? { title: `AI Analysis — ${file?.name ?? ''}`, subtitle: `Model: ${AI_MODEL}`, analysis: result } : null;

  return (
    <AppLayout>
      <PageHeader eyebrow="Intelligence" title="AI Analysis"
        actions={result && (
          <>
            <button className="btn btn-sm" onClick={() => payload && exportPDF(payload)}><FileDown size={15} /> PDF</button>
            <button className="btn btn-sm" onClick={() => payload && exportExcel(payload)}><FileDown size={15} /> Excel</button>
            <button className="btn btn-sm" onClick={() => payload && exportWord(payload)}><FileDown size={15} /> Word</button>
            <button className="btn btn-primary btn-sm" disabled={saved} onClick={persist}>
              <Save size={15} /> {saved ? 'Saved' : 'Save Report'}
            </button>
          </>
        )}
      />

      <div
        className="panel"
        onClick={() => stage === 'idle' || stage === 'done' || stage === 'error' ? inputRef.current?.click() : undefined}
        style={{ padding: '30px 24px', textAlign: 'center', cursor: 'pointer', borderStyle: 'dashed', marginBottom: 20 }}
      >
        <BrainCircuit size={34} color="#2dd4bf" style={{ marginBottom: 10 }} />
        <div style={{ fontWeight: 600 }}>{file ? file.name : 'Select a data file to analyze'}</div>
        <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>
          Excel, CSV and DOCX are parsed locally; PDF and images are read by the AI gateway. Model: <span className="mono">{AI_MODEL}</span>
        </div>
        <input ref={inputRef} type="file" accept={ACCEPTED_EXTENSIONS} style={{ display: 'none' }}
          onChange={(e) => e.target.files?.[0] && run(e.target.files[0])} />
      </div>

      {(stage === 'uploading' || stage === 'analyzing') && (
        <div className="panel panel-pad row gap-12" style={{ alignItems: 'center' }}>
          <Spinner />
          <span>{stage === 'uploading' ? 'Uploading to secure storage…' : 'Analyzing with AI gateway…'}</span>
        </div>
      )}
      {stage === 'error' && <div className="alert alert-error">{error}</div>}

      {result && stage === 'done' && (
        <div className="card-grid rise" style={{ gap: 16 }}>
          <Section icon={<Sparkles size={16} />} title="Executive Summary">
            <p style={{ fontSize: 14.5, lineHeight: 1.6 }}>{result.summary || 'No summary returned.'}</p>
          </Section>

          <div className="card-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <IndicatorList tone="bad" icon={<TrendingDown size={16} />} title="Underperforming" items={result.poor_indicators} />
            <IndicatorList tone="good" icon={<TrendingUp size={16} />} title="Best Performing" items={result.best_indicators} />
          </div>

          <Section icon={<ListChecks size={16} />} title="Key Findings">
            <Bullets items={result.findings} empty="No findings returned." />
          </Section>
          <Section icon={<ClipboardList size={16} />} title="Recommendations">
            <Bullets items={result.recommendations} empty="No recommendations returned." />
          </Section>

          <Section icon={<ClipboardList size={16} />} title="Action Plan">
            {result.action_plan.length ? (
              <table className="data">
                <thead><tr><th>Action</th><th>Owner</th><th>Timeframe</th></tr></thead>
                <tbody>
                  {result.action_plan.map((a, i) => (
                    <tr key={i}><td>{a.action}</td><td className="muted">{a.owner ?? '—'}</td><td className="muted">{a.timeframe ?? '—'}</td></tr>
                  ))}
                </tbody>
              </table>
            ) : <EmptyState title="No action plan returned" />}
          </Section>
        </div>
      )}
    </AppLayout>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="panel panel-pad">
      <div className="row gap-8" style={{ color: 'var(--teal)', marginBottom: 12 }}>
        {icon}<span className="eyebrow" style={{ color: 'var(--ink-2)' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}
function Bullets({ items, empty }: { items: string[]; empty: string }) {
  if (!items.length) return <EmptyState title={empty} />;
  return (
    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
      {items.map((t, i) => (
        <li key={i} className="row gap-12" style={{ alignItems: 'flex-start', fontSize: 14, lineHeight: 1.5 }}>
          <span style={{ color: 'var(--teal)', marginTop: 2 }}>▹</span><span>{t}</span>
        </li>
      ))}
    </ul>
  );
}
function IndicatorList({ tone, icon, title, items }: {
  tone: 'good' | 'bad'; icon: React.ReactNode; title: string;
  items: { indicator: string; value?: string; note: string }[];
}) {
  return (
    <div className="panel panel-pad">
      <div className={`row gap-8`} style={{ color: tone === 'good' ? 'var(--green)' : 'var(--rose)', marginBottom: 12 }}>
        {icon}<span className="eyebrow" style={{ color: 'var(--ink-2)' }}>{title}</span>
      </div>
      {items.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
      ) : <EmptyState title="None identified" />}
    </div>
  );
}
