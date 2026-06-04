import { Card } from '../ui/card';
import { formatDate } from '../../lib/utils';
import type { Report, Treatment } from '../../types/domain';

export const PatientTimeline = ({ reports, treatments }: { reports: Report[]; treatments: Treatment[] }) => {
  const events = [
    ...reports.map((report) => ({ id: report.id, title: report.filename, date: report.created_at, type: 'Report' })),
    ...treatments.map((treatment) => ({ id: treatment.id, title: treatment.treatment_type, date: treatment.treatment_start_date, type: 'Treatment' })),
  ].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());

  return (
    <Card>
      <p className="font-semibold">Patient timeline</p>
      <div className="mt-4 space-y-4">
        {events.length ? events.map((event) => (
          <div key={event.id} className="flex gap-4">
            <div className="mt-1 h-3 w-3 rounded-full bg-primary" />
            <div>
              <p className="font-medium">{event.title}</p>
              <p className="text-sm text-foreground/60">{event.type} · {formatDate(event.date)}</p>
            </div>
          </div>
        )) : <p className="text-sm text-foreground/60">Timeline events will appear once reports or treatments are added.</p>}
      </div>
    </Card>
  );
};
