import { Icon } from './Icon';

interface MetricCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaDir?: 'up' | 'down';
  icon: string;
}

export function MetricCard({ label, value, delta, deltaDir = 'up', icon }: MetricCardProps) {
  const pos = deltaDir === 'up';
  return (
    <div className="card card-pad fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="t-overline">{label}</span>
        <div style={{
          width: 34, height: 34, borderRadius: 9, background: 'var(--bg-rose-tint)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--rose-600)',
        }}>
          <Icon name={icon} size={18} />
        </div>
      </div>
      <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--fg-1)', lineHeight: 1.05 }}>
        {value}
      </div>
      {delta && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600,
          color: pos ? 'var(--success-700)' : 'var(--danger-700)',
        }}>
          <Icon name="trending-up" size={14} style={{ transform: pos ? 'none' : 'scaleY(-1)' }} />
          {delta}
        </div>
      )}
    </div>
  );
}
