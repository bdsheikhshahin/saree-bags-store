import type { CSSProperties, ReactNode } from 'react';

// Shared admin primitives — same dark-button design language as the storefront.
export const cardStyle: CSSProperties = {
  background: '#fff', border: '1px solid #e5e5e5', borderRadius: 10, padding: 16,
};

export const btnStyle: CSSProperties = {
  background: '#111', color: '#fff', border: '1px solid #111', borderRadius: 6,
  padding: '8px 16px', cursor: 'pointer', fontSize: 14, fontWeight: 600,
};

export const btnGhostStyle: CSSProperties = {
  background: '#fff', color: '#111', border: '1px solid #ccc', borderRadius: 6,
  padding: '8px 14px', cursor: 'pointer', fontSize: 14,
};

export const btnDangerStyle: CSSProperties = {
  background: '#fff', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: 6,
  padding: '6px 12px', cursor: 'pointer', fontSize: 13,
};

export const inputStyle: CSSProperties = { width: '100%' };

export function AdminCard({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section style={cardStyle}>
      {title ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>{title}</h2>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{label}</label>
      {children}
      {hint ? <p style={{ margin: '4px 0 0', fontSize: 12, color: '#666' }}>{hint}</p> : null}
    </div>
  );
}

export function ErrorBox({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 12px', borderRadius: 6 }}>
      {message}
    </p>
  );
}

export function Badge({ children, tone = 'grey' }: { children: ReactNode; tone?: 'grey' | 'green' | 'amber' | 'red' | 'blue' }) {
  const tones: Record<string, CSSProperties> = {
    grey: { background: '#f3f4f6', color: '#374151' },
    green: { background: '#dcfce7', color: '#166534' },
    amber: { background: '#fef3c7', color: '#92400e' },
    red: { background: '#fee2e2', color: '#991b1b' },
    blue: { background: '#dbeafe', color: '#1e40af' },
  };
  return (
    <span style={{ ...tones[tone], display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
      {children}
    </span>
  );
}
