import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Activity, Hospital, Stethoscope,
  UploadCloud, BrainCircuit, FileBarChart, Users, LogOut, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLES, canAccessDashboard, can } from '../lib/roles';
import { Brand } from './ui/Primitives';

interface NavItem {
  to: string; label: string; icon: React.ReactNode;
  show: (role: ReturnType<typeof useAuth>['user']) => boolean;
}

const NAV: NavItem[] = [
  { to: '/dashboard/state', label: 'State Overview', icon: <LayoutDashboard size={18} />, show: (u) => !!u && canAccessDashboard(u.role, 'state') },
  { to: '/dashboard/district', label: 'District', icon: <Building2 size={18} />, show: (u) => !!u && canAccessDashboard(u.role, 'district') },
  { to: '/dashboard/programme', label: 'Programme', icon: <Activity size={18} />, show: (u) => !!u && canAccessDashboard(u.role, 'programme') },
  { to: '/dashboard/facility', label: 'Facility', icon: <Hospital size={18} />, show: (u) => !!u && canAccessDashboard(u.role, 'facility') },
  { to: '/dashboard/anm', label: 'ANM / Field', icon: <Stethoscope size={18} />, show: (u) => !!u && canAccessDashboard(u.role, 'anm') },
  { to: '/uploads', label: 'Uploads', icon: <UploadCloud size={18} />, show: (u) => !!u && can(u.role, 'upload_files') },
  { to: '/analysis', label: 'AI Analysis', icon: <BrainCircuit size={18} />, show: (u) => !!u && can(u.role, 'run_ai_analysis') },
  { to: '/reports', label: 'Reports', icon: <FileBarChart size={18} />, show: (u) => !!u && can(u.role, 'export_reports') },
  { to: '/admin', label: 'Users & Roles', icon: <Users size={18} />, show: (u) => !!u && can(u.role, 'manage_users') },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  const roleDef = ROLES[user.role];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '258px 1fr', minHeight: '100vh' }}>
      <aside
        style={{
          borderRight: '1px solid var(--line-soft)',
          background: 'linear-gradient(180deg, var(--bg-2), var(--bg))',
          padding: '20px 16px', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh',
        }}
      >
        <div style={{ padding: '4px 8px 18px' }}><Brand /></div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, overflowY: 'auto' }}>
          {NAV.filter((n) => n.show(user)).map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className="navlink"
              style={({ isActive }) => navStyle(isActive)}
            >
              <span className="row gap-12" style={{ alignItems: 'center' }}>
                {n.icon}
                <span style={{ fontSize: 13.5, fontWeight: 500 }}>{n.label}</span>
              </span>
              <ChevronRight size={14} style={{ opacity: 0.4 }} />
            </NavLink>
          ))}
        </nav>

        <div className="panel" style={{ padding: 12, marginTop: 14 }}>
          <div className="row between" style={{ alignItems: 'center' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name}
              </div>
              <div className="badge badge-teal" style={{ marginTop: 4 }}>{roleDef?.label ?? user.role}</div>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              title="Sign out"
              onClick={async () => { await signOut(); navigate('/login'); }}
              style={{ padding: 8 }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main style={{ padding: '26px 30px 60px', maxWidth: 1280, width: '100%' }}>{children}</main>
    </div>
  );
}

function navStyle(isActive: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '9px 12px', borderRadius: 10, color: isActive ? 'var(--ink)' : 'var(--ink-2)',
    background: isActive ? 'var(--teal-glow)' : 'transparent',
    border: `1px solid ${isActive ? 'rgba(45,212,191,0.3)' : 'transparent'}`,
    transition: 'background 0.15s ease, color 0.15s ease',
  };
}

export function PageHeader({ eyebrow, title, actions }: { eyebrow?: string; title: string; actions?: React.ReactNode }) {
  return (
    <div className="row between wrap gap-16" style={{ alignItems: 'flex-end', marginBottom: 22 }}>
      <div>
        {eyebrow && <div className="eyebrow" style={{ marginBottom: 6 }}>{eyebrow}</div>}
        <h1 className="display" style={{ fontSize: 30, color: 'var(--ink)' }}>{title}</h1>
      </div>
      {actions && <div className="row gap-8 wrap">{actions}</div>}
    </div>
  );
}
