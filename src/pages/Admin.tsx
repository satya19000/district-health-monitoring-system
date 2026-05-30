import { useEffect, useState } from 'react';
import { Users, ShieldCheck, RefreshCw, Search } from 'lucide-react';
import AppLayout, { PageHeader } from '../components/AppLayout';
import { Spinner, EmptyState } from '../components/ui/Primitives';
import { listProfiles, updateProfileRole } from '../services/databaseService';
import { ROLE_LIST, normalizeRole } from '../lib/roles';
import { useAuth } from '../context/AuthContext';
import type { Profile } from '../types';

export default function Admin() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [notice, setNotice] = useState('');

  async function refresh() {
    setLoading(true);
    const data = await listProfiles();
    setRows(data);
    setLoading(false);
  }

  useEffect(() => { void refresh(); }, []);

  async function changeRole(p: Profile, role: string) {
    if (!p.user_id) return;
    setSavingId(p.user_id);
    setNotice('');
    const { error } = await updateProfileRole(p.user_id, role);
    if (error) {
      setNotice(`Could not update role: ${error.message}`);
    } else {
      setRows((prev) => prev.map((r) => (r.user_id === p.user_id ? { ...r, role } : r)));
      setNotice(`Role updated for ${p.full_name || p.user_id}.`);
    }
    setSavingId(null);
  }

  const filtered = rows.filter((r) => {
    if (!q.trim()) return true;
    const hay = `${r.full_name ?? ''} ${r.role ?? ''} ${r.user_id ?? ''}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Administration"
        title="Users & Roles"
        actions={
          <button className="btn btn-ghost btn-sm" onClick={() => void refresh()}>
            <RefreshCw size={15} /> Refresh
          </button>
        }
      />

      <div className="panel panel-pad" style={{ marginBottom: 16 }}>
        <div className="row gap-8" style={{ color: 'var(--teal)', marginBottom: 8 }}>
          <ShieldCheck size={18} />
          <span className="eyebrow" style={{ color: 'var(--ink-2)' }}>Role assignment</span>
        </div>
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>
          Assign each user one of the six system roles. Role levels control which dashboards and
          actions a user can access across the platform.
        </p>
      </div>

      {notice && <div className="alert alert-info" style={{ marginBottom: 14 }}>{notice}</div>}

      <div className="panel panel-pad">
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
          <div className="row gap-8" style={{ color: 'var(--ink-2)' }}>
            <Users size={18} />
            <span className="eyebrow">{filtered.length} user{filtered.length === 1 ? '' : 's'}</span>
          </div>
          <div className="row gap-8" style={{ maxWidth: 280, flex: 1, alignItems: 'center' }}>
            <Search size={15} className="muted" />
            <input
              className="input"
              placeholder="Search users…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 28, display: 'flex', justifyContent: 'center' }}><Spinner large /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Users size={26} />} title="No users found" hint="Try a different search term." />
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>User ID</th>
                <th>Current role</th>
                <th>Assign role</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const current = normalizeRole(p.role);
                const isSelf = p.user_id === user?.id;
                return (
                  <tr key={p.user_id ?? p.id}>
                    <td>
                      {p.full_name || <span className="muted">Unnamed</span>}
                      {isSelf && <span className="badge" style={{ marginLeft: 8 }}>You</span>}
                    </td>
                    <td className="mono muted" style={{ fontSize: 12 }}>{p.user_id ?? '—'}</td>
                    <td><span className="badge badge-good">{ROLE_LIST.find((r) => r.key === current)?.label ?? current}</span></td>
                    <td>
                      <select
                        className="input"
                        style={{ maxWidth: 200 }}
                        value={current}
                        disabled={savingId === p.user_id}
                        onChange={(e) => void changeRole(p, e.target.value)}
                      >
                        {ROLE_LIST.map((r) => (
                          <option key={r.key} value={r.key}>{r.label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </AppLayout>
  );
}
