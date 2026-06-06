/**
 * Reusable Recharts chart for comparing multiple data series over time.
 * Props: data (ComparisonDataPoint[]), series ({ key, label, color }[]),
 *   type? ('bar' | 'line'), title?, height? (default 300).
 * Sorts data chronologically. Supports bar and line chart types via a single
 * component. Used by ConsolidatedView for BI-RADS trend visualization.
 * Exports ComparisonDataPoint interface.
 */
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export interface ComparisonDataPoint {
  date: string;
  label: string;
  [key: string]: string | number;
}

interface ComparisonChartProps {
  data: ComparisonDataPoint[];
  series: { key: string; label: string; color: string }[];
  type?: 'bar' | 'line';
  title?: string;
  height?: number;
}

export function ComparisonChart({
  data,
  series,
  type = 'bar',
  title,
  height = 300,
}: ComparisonChartProps) {
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => new Date(a.date as string).getTime() - new Date(b.date as string).getTime());
  }, [data]);

  if (!sortedData.length) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-3)' }}>
        <span>No data available</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {title && <span className="t-overline">{title}</span>}
      <ResponsiveContainer width="100%" height={height}>
        {type === 'bar' ? (
          <BarChart data={sortedData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" />
            <XAxis dataKey="label" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-2)',
                borderRadius: 'var(--r-sm)',
                padding: '8px 12px',
                fontSize: '12px',
              }}
              cursor={{ fill: 'var(--rose-50)' }}
            />
            <Legend />
            {series.map(s => (
              <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} />
            ))}
          </BarChart>
        ) : (
          <LineChart data={sortedData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" />
            <XAxis dataKey="label" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-2)',
                borderRadius: 'var(--r-sm)',
                padding: '8px 12px',
                fontSize: '12px',
              }}
              cursor={{ stroke: 'var(--rose-200)' }}
            />
            <Legend />
            {series.map(s => (
              <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
