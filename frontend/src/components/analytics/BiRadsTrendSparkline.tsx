/**
 * Compact Recharts line sparkline showing BI-RADS value progression over time.
 * Props: data (BiRadsDataPoint[]), size? ('sm' | 'md') — controls height (32 vs 60 px).
 * Sorts data chronologically, clamps Y-axis domain around the value range,
 * and shows a rose-colored tooltip. Exports BiRadsDataPoint { date, value, label }.
 * Renders a "No data" placeholder when data is empty.
 */
import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export interface BiRadsDataPoint {
  date: string;
  value: number;
  label: string;
}

interface BiRadsTrendSparklineProps {
  data: BiRadsDataPoint[];
  size?: 'sm' | 'md';
}

export function BiRadsTrendSparkline({ data, size = 'sm' }: BiRadsTrendSparklineProps) {
  const height = size === 'md' ? 60 : 32;
  const margin = size === 'md' ? { top: 2, right: 2, bottom: 2, left: -20 } : { top: 2, right: 2, bottom: 2, left: -25 };

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data]);

  if (!sortedData.length) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-3)' }}>
        <span style={{ fontSize: 11 }}>No data</span>
      </div>
    );
  }

  const minVal = Math.min(...sortedData.map(d => d.value));
  const maxVal = Math.max(...sortedData.map(d => d.value));
  const domain = [Math.max(0, minVal - 0.5), Math.min(5, maxVal + 0.5)];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={sortedData} margin={margin}>
        <XAxis dataKey="date" hide />
        <YAxis domain={domain} hide />
        <Tooltip
          contentStyle={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-2)',
            borderRadius: 'var(--r-sm)',
            padding: '6px 10px',
            fontSize: '12px',
          }}
          formatter={(value: number) => [`BI-RADS ${value.toFixed(1)}`, 'Value']}
          labelFormatter={(label: string) => `Date: ${label}`}
          cursor={{ stroke: 'var(--rose-400)', strokeWidth: 1 }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="var(--rose-600)"
          dot={false}
          strokeWidth={2}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
