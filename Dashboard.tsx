import { useEffect, useState } from 'react';
import { UploadCloud, FileSpreadsheet, FileText, Image as ImageIcon, FileArchive, File, RefreshCw } from 'lucide-react';
import AppLayout, { PageHeader } from '../components/AppLayout';
import FileUpload from '../components/FileUpload';
import { Spinner, EmptyState } from '../components/ui/Primitives';
import { listUploads } from '../services/databaseService';
import type { UploadedFile } from '../types';

function categoryIcon(category: string) {
  switch (category) {
    case 'excel':
    case 'csv':
      return <FileSpreadsheet size={16} />;
    case 'pdf':
    case 'docx':
      return <FileText size={16} />;
    case 'image':
      return <ImageIcon size={16} />;
    case 'zip':
      return <FileArchive size={16} />;
    default:
      return <File size={16} />;
  }
}

function fmtBytes(n: number): string {
  if (!n) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

function fmtDate(s?: string): string {
  if (!s) return '—';
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
}

const STATUS_BADGE: Record<string, string> = {
  uploaded: 'badge',
  analyzing: 'badge badge-warn',
  analyzed: 'badge badge-good',
  failed: 'badge badge-bad',
};

export default function Uploads() {
  const [rows, setRows] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const data = await listUploads(100);
    setRows(data);
    setLoading(false);
  }

  useEffect(() => { void refresh(); }, []);

  function handleUploaded(f: UploadedFile) {
    setRows((prev) => [f, ...prev]);
  }

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Data Intake"
        title="File Uploads"
        actions={
          <button className="btn btn-ghost btn-sm" onClick={() => void refresh()}>
            <RefreshCw size={15} /> Refresh
          </button>
        }
      />

      <div className="panel panel-pad" style={{ marginBottom: 20 }}>
        <div className="row gap-8" style={{ color: 'var(--teal)', marginBottom: 6 }}>
          <UploadCloud size={18} />
          <span className="eyebrow" style={{ color: 'var(--ink-2)' }}>Upload health data files</span>
        </div>
        <p className="muted" style={{ margin: '0 0 16px', fontSize: 13 }}>
          Supports Excel, CSV, PDF, Word (DOCX), images and ZIP archives. Files are routed to the
          correct InsForge storage bucket automatically and recorded in the database.
        </p>
        <FileUpload onUploaded={handleUploaded} />
      </div>

      <div className="panel panel-pad">
        <div className="row gap-8" style={{ color: 'var(--ink-2)', marginBottom: 14 }}>
          <File size={18} />
          <span className="eyebrow">Recent uploads</span>
        </div>

        {loading ? (
          <div style={{ padding: 28, display: 'flex', justifyContent: 'center' }}><Spinner large /></div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<UploadCloud size={26} />}
            title="No files uploaded yet"
            hint="Upload your first Excel, PDF or CSV file above to get started."
          />
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>File</th>
                <th>Category</th>
                <th>Size</th>
                <th>Status</th>
                <th>Uploaded</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id ?? `${r.object_key}-${i}`}>
                  <td>
                    <span className="row gap-8" style={{ alignItems: 'center' }}>
                      <span className="muted">{categoryIcon(r.category)}</span>
                      {r.name}
                    </span>
                  </td>
                  <td><span className="badge">{r.category}</span></td>
                  <td className="mono">{fmtBytes(r.size)}</td>
                  <td><span className={STATUS_BADGE[r.status ?? 'uploaded'] ?? 'badge'}>{r.status ?? 'uploaded'}</span></td>
                  <td className="muted">{fmtDate(r.created_at)}</td>
                  <td style={{ textAlign: 'right' }}>
                    {r.url ? (
                      <a className="btn btn-ghost btn-sm" href={r.url} target="_blank" rel="noreferrer">Open</a>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppLayout>
  );
}
