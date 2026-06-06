/**
 * Responsive grid of metric cards, each showing a label, large value, optional
 * unit, and a colour-coded icon badge. Props: metrics (MetricItem[]).
 * MetricItem: { label, value, unit?, icon?, color? ('rose'|'success'|'warning'|'danger'|'info') }.
 * Uses auto-fit grid with 200 px minimum column width. Renders a placeholder
 * when the array is empty. Exports the MetricItem interface.
 */
import { Icon } from '@/components/ui/Icon';

export interface MetricItem {
  label: string;
  value: string | number;
  unit?: string;
  icon?: string;
  color?: 'rose' | 'success' | 'warning' | 'danger' | 'info';
}

interface MetricsGridProps {
  metrics: MetricItem[];
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  const colorMap: Record<string, { bg: string; fg: string }> = {
    rose: { bg: 'var(--bg-rose-tint)', fg: 'var(--rose-600)' },
    success: { bg: 'var(--success-50)', fg: 'var(--success-600)' },
    warning: { bg: 'var(--warning-50)', fg: 'var(--warning-600)' },
    danger: { bg: 'var(--danger-50)', fg: 'var(--danger-600)' },
    info: { bg: 'var(--info-50)', fg: 'var(--info-600)' },
  };

  if (!metrics.length) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--fg-3)' }}>
        No metrics to display
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))`, gap: 12 }}>
      {metrics.map((metric, idx) => {
        const colors = colorMap[metric.color ?? 'rose'];
        return (
          <div
            key={idx}
            className="card card-pad"
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
            }}
          >
            {metric.icon && (
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--r-md)',
                  background: colors.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.fg,
                  flexShrink: 0,
                }}
              >
                <Icon name={metric.icon} size={20} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--fg-3)', textTransform: 'uppercase', marginBottom: 4 }}>
                {metric.label}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--fg-1)', lineHeight: 1.2 }}>
                {metric.value}
                {metric.unit && <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg-3)', marginLeft: 4 }}>{metric.unit}</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
