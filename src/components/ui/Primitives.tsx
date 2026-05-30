import React from 'react';

export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="7" fill="#0c4a47" />
      <path
        d="M16 6l2.6 5.3 5.9.9-4.3 4.1 1 5.8L16 25.3l-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z"
        fill="#5eead4"
      />
    </svg>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="row gap-12" style={{ alignItems: 'center' }}>
      <Logo />
      {!compact && (
        <div style={{ lineHeight: 1.1 }}>
          <div className="display" style={{ fontSize: 16, color: 'var(--ink)' }}>District Health</div>
          <div className="eyebrow" style={{ fontSize: 9.5 }}>Monitoring System</div>
        </div>
      )}
    </div>
  );
}

export function Spinner({ large = false }: { large?: boolean }) {
  return <span className={`spinner${large ? ' spinner-lg' : ''}`} role="status" aria-label="loading" />;
}

export function FullPageLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <div className="row gap-12" style={{ flexDirection: 'column' }}>
        <Spinner large />
        <span className="muted" style={{ fontSize: 13 }}>{label}…</span>
      </div>
    </div>
  );
}

export function EmptyState({ title, hint, icon }: { title: string; hint?: string; icon?: React.ReactNode }) {
  return (
    <div className="tcenter" style={{ padding: '46px 20px', color: 'var(--ink-3)' }}>
      {icon && <div style={{ marginBottom: 12, opacity: 0.7 }}>{icon}</div>}
      <div style={{ fontWeight: 600, color: 'var(--ink-2)', marginBottom: 6 }}>{title}</div>
      {hint && <div style={{ fontSize: 13, maxWidth: 420, margin: '0 auto' }}>{hint}</div>}
    </div>
  );
}
