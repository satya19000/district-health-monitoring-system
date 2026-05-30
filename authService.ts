import React from 'react';
import { Brand } from '../../components/ui/Primitives';
import { INDICATORS } from '../../lib/indicators';

export default function AuthShell({ children, heading, sub }: { children: React.ReactNode; heading: string; sub: string }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.1fr)' }}>
      {/* Left: form */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px clamp(24px, 6vw, 88px)' }}>
        <div style={{ width: '100%', maxWidth: 400, margin: '0 auto' }} className="rise">
          <Brand />
          <h1 className="display" style={{ fontSize: 30, marginTop: 30 }}>{heading}</h1>
          <p className="muted" style={{ marginTop: 8, marginBottom: 28, fontSize: 14 }}>{sub}</p>
          {children}
        </div>
      </div>

      {/* Right: atmospheric panel */}
      <div
        style={{
          position: 'relative', overflow: 'hidden',
          background: 'radial-gradient(900px 700px at 70% 20%, rgba(45,212,191,0.16), transparent 60%), linear-gradient(160deg, #0c2421, #071513)',
          borderLeft: '1px solid var(--line-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48,
        }}
      >
        <div style={{ position: 'absolute', inset: 0, opacity: 0.5, backgroundImage: 'linear-gradient(#10302c 1px, transparent 1px), linear-gradient(90deg, #10302c 1px, transparent 1px)', backgroundSize: '46px 46px', maskImage: 'radial-gradient(circle at 60% 40%, black, transparent 75%)' }} />
        <div style={{ position: 'relative', maxWidth: 440 }}>
          <div className="eyebrow" style={{ color: 'var(--teal)' }}>Public Health Intelligence</div>
          <div className="display" style={{ fontSize: 36, lineHeight: 1.1, marginTop: 14, color: 'var(--ink)' }}>
            Every indicator, every district, in one command center.
          </div>
          <div className="card-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 34 }}>
            {INDICATORS.slice(0, 6).map((ind) => (
              <div key={ind.key} className="panel" style={{ padding: '12px 13px' }}>
                <div className="mono" style={{ color: 'var(--teal)', fontSize: 15 }}>{ind.label}</div>
                <div className="muted" style={{ fontSize: 10.5, marginTop: 3 }}>{ind.full}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
