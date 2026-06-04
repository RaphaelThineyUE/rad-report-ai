interface BiRadsStyle {
  bg: string;
  fg: string;
  bd: string;
}

const BIRADS_STYLE: Record<string, BiRadsStyle> = {
  '1':  { bg: 'var(--success-50)', fg: 'var(--success-700)', bd: '#bfe8d6' },
  '2':  { bg: 'var(--success-50)', fg: 'var(--success-700)', bd: '#bfe8d6' },
  '3':  { bg: 'var(--info-50)',    fg: 'var(--info-700)',    bd: '#cfe0f7' },
  '4A': { bg: 'var(--warning-50)', fg: 'var(--warning-700)', bd: '#f6e2b3' },
  '4B': { bg: '#FFF1E8',           fg: '#B2480A',            bd: '#f5cba6' },
  '4C': { bg: '#FFF1E8',           fg: '#B2480A',            bd: '#f5cba6' },
  '5':  { bg: 'var(--danger-50)',  fg: 'var(--danger-700)',  bd: '#f3c0c5' },
};

interface BiRadsProps {
  value: string;
  size?: 'sm' | 'md' | 'lg';
}

export function BiRads({ value, size = 'md' }: BiRadsProps) {
  const st = BIRADS_STYLE[value] ?? BIRADS_STYLE['3'];
  const pad = size === 'lg' ? '5px 12px' : '3px 9px';
  const fs = size === 'lg' ? '14px' : '12px';
  return (
    <span
      className="birads"
      style={{ background: st.bg, color: st.fg, borderColor: st.bd, padding: pad, fontSize: fs }}
    >
      BI-RADS {value}
    </span>
  );
}
