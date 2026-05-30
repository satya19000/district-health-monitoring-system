import React, { useRef, useState } from 'react';
import { UploadCloud, File as FileIcon, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { categorize, BUCKET_FOR_CATEGORY, ACCEPTED_EXTENSIONS, type FileCategory } from '../lib/fileParser';
import { uploadFile } from '../services/storageService';
import { recordUpload } from '../services/databaseService';
import { useAuth } from '../context/AuthContext';
import type { UploadedFile } from '../types';

interface UploadItem {
  file: File;
  category: FileCategory;
  status: 'pending' | 'uploading' | 'done' | 'error';
  message?: string;
  record?: UploadedFile;
}

export default function FileUpload({ onUploaded }: { onUploaded?: (f: UploadedFile) => void }) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const next = Array.from(fileList).map<UploadItem>((file) => ({ file, category: categorize(file), status: 'pending' }));
    setItems((prev) => [...prev, ...next]);
    void uploadAll(next);
  }

  async function uploadAll(toUpload: UploadItem[]) {
    for (const item of toUpload) {
      setStatus(item.file, 'uploading');
      try {
        const stored = await uploadFile(item.file, user?.id);

        const record: UploadedFile = {
          name: stored.name,
          bucket: stored.bucket,
          object_key: stored.objectKey,
          url: stored.url,
          size: stored.size,
          mime_type: stored.mimeType,
          category: stored.category,
          uploaded_by: user?.id,
          district_id: (user?.profile?.district_id as string) ?? null,
          status: 'uploaded',
        };
        const saved = (await recordUpload(record)) ?? record;
        setItems((prev) => prev.map((p) => (p.file === item.file ? { ...p, status: 'done', record: saved } : p)));
        onUploaded?.(saved);
      } catch (err: any) {
        setItems((prev) => prev.map((p) => (p.file === item.file ? { ...p, status: 'error', message: err.message } : p)));
      }
    }
  }

  function setStatus(file: File, status: UploadItem['status']) {
    setItems((prev) => prev.map((p) => (p.file === file ? { ...p, status } : p)));
  }
  function remove(file: File) {
    setItems((prev) => prev.filter((p) => p.file !== file));
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        className="panel"
        style={{
          padding: '38px 24px', textAlign: 'center', cursor: 'pointer',
          borderStyle: 'dashed', borderColor: dragging ? 'var(--teal)' : 'var(--line)',
          background: dragging ? 'var(--teal-glow)' : undefined, transition: 'all 0.15s ease',
        }}
      >
        <UploadCloud size={34} color="#2dd4bf" style={{ marginBottom: 10 }} />
        <div style={{ fontWeight: 600 }}>Drop files here or click to browse</div>
        <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>
          Excel, CSV, PDF, DOCX, images and ZIP — routed automatically to the right storage bucket
        </div>
        <input
          ref={inputRef} type="file" multiple accept={ACCEPTED_EXTENSIONS}
          style={{ display: 'none' }} onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {items.length > 0 && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((item, i) => (
            <div key={i} className="panel" style={{ padding: '11px 14px' }}>
              <div className="row between gap-12">
                <div className="row gap-12" style={{ minWidth: 0 }}>
                  <FileIcon size={18} color="#9fc4bd" />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 360 }}>
                      {item.file.name}
                    </div>
                    <div className="muted" style={{ fontSize: 11.5 }}>
                      {BUCKET_FOR_CATEGORY[item.category]} · {(item.file.size / 1024).toFixed(0)} KB
                    </div>
                  </div>
                </div>
                <div className="row gap-12">
                  {item.status === 'uploading' && <span className="spinner" />}
                  {item.status === 'done' && <span className="badge badge-good"><CheckCircle2 size={12} /> stored</span>}
                  {item.status === 'error' && <span className="badge badge-bad" title={item.message}><AlertTriangle size={12} /> failed</span>}
                  <button className="btn btn-ghost btn-sm" style={{ padding: 6 }} onClick={() => remove(item.file)}><X size={14} /></button>
                </div>
              </div>
              {item.status === 'error' && item.message && (
                <div className="muted" style={{ fontSize: 11.5, marginTop: 6 }}>{item.message}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
