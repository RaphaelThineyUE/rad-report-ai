import { ReportCard } from './ReportCard';
import { Skeleton } from '../ui/skeleton';
import type { Report } from '../../types/domain';

export const ReportsList = ({
  reports,
  isLoading,
  onSelect,
}: {
  reports: Report[];
  isLoading: boolean;
  onSelect: (report: Report) => void;
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton />
        <Skeleton />
      </div>
    );
  }

  if (!reports.length) {
    return <div className="rounded-xl border border-dashed border-border/50 p-6 text-sm text-foreground/60">No reports yet.</div>;
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <ReportCard key={report.id} report={report} onClick={() => onSelect(report)} />
      ))}
    </div>
  );
};
