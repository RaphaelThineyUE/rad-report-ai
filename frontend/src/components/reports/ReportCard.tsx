import { AlertTriangle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { formatDate } from '../../lib/utils';
import type { Report } from '../../types/domain';

const statusColor: Record<Report['status'], string> = {
  pending: 'bg-amber-500',
  processing: 'bg-sky-500',
  completed: 'bg-emerald-500',
  failed: 'bg-rose-500',
};

export const ReportCard = ({ report, onClick }: { report: Report; onClick: () => void }) => (
  <Card className="cursor-pointer transition hover:-translate-y-0.5" onClick={onClick}>
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-semibold text-foreground">{report.filename}</p>
        <p className="text-sm text-foreground/60">{formatDate(report.created_at)}</p>
      </div>
      <span className="flex items-center gap-2 text-xs text-foreground/60">
        <span className={`h-2.5 w-2.5 rounded-full ${statusColor[report.status]}`} />
        {report.status}
      </span>
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <Badge>BI-RADS {report.birads_value ?? '—'}</Badge>
      <Badge>{report.exam_type ?? 'Pending review'}</Badge>
      <Badge className="gap-1 text-danger">
        <AlertTriangle className="h-3 w-3" /> {report.red_flags?.length ?? 0} red flags
      </Badge>
    </div>
  </Card>
);
