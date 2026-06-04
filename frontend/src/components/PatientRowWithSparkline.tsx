import { Avatar, Badge, BiRads, Icon } from '@/components/ui';
import { BiRadsTrendSparkline, type BiRadsDataPoint } from '@/components/analytics';
import type { PatientRow } from '@/types/clinical';

interface PatientRowWithSparklineProps {
  patient: PatientRow;
  trendData?: BiRadsDataPoint[];
  onClick?: () => void;
}

/**
 * Patient table row with integrated BI-RADS trend sparkline.
 * Shows longitudinal trend data for quick visual assessment of patient progression.
 * Can be used in any patient listing that needs historical trend visualization.
 */
export function PatientRowWithSparkline({
  patient,
  trendData,
  onClick,
}: PatientRowWithSparklineProps) {
  // Mock trend data if not provided - in real usage, this would come from reports
  const sparklineData: BiRadsDataPoint[] = trendData || [
    { date: '2026-03-15', value: 2, label: 'Mar 15' },
    { date: '2026-04-10', value: 3, label: 'Apr 10' },
    { date: '2026-05-05', value: 3.5, label: 'May 5' },
    { date: '2026-05-21', value: patient.birads === '4B' ? 4.2 : 3, label: 'May 21' },
  ];

  return (
    <tr onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <Avatar initials={patient.initials} size={34} />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--fg-1)', fontSize: 14 }}>
              {patient.name}
            </div>
            <div className="mono" style={{ fontSize: 11.5, color: 'var(--fg-4)' }}>
              {patient.id} · {patient.age}{patient.sex}
            </div>
          </div>
        </div>
      </td>
      <td className="mono">{patient.accession}</td>
      <td>{patient.modality}</td>
      <td>
        <BiRads value={patient.birads} />
      </td>
      <td>
        <Badge status={patient.status} />
      </td>
      <td className="mono">{patient.date}</td>
      <td style={{ width: 120, padding: '8px 12px' }}>
        <BiRadsTrendSparkline data={sparklineData} size="sm" />
      </td>
      <td style={{ textAlign: 'right' }}>
        <Icon name="chevron-right" size={18} color="var(--fg-4)" />
      </td>
    </tr>
  );
}
