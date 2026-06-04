import { Download } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import type { Report } from '../../types/domain';

export const ConsolidatedView = ({ reports, summary, onClose }: { reports: Report[]; summary: string; onClose: () => void }) => {
  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ summary, reports }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'consolidated-report.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
      <Card className="max-h-[90vh] w-full max-w-3xl overflow-y-auto p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-foreground/60">Consolidated analysis</p>
            <h2 className="text-2xl font-semibold">{reports.length} report overview</h2>
          </div>
          <Button className="bg-transparent text-foreground" onClick={onClose}>Close</Button>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card><p className="text-sm text-foreground/60">Reports</p><p className="mt-2 text-3xl font-semibold">{reports.length}</p></Card>
          <Card><p className="text-sm text-foreground/60">Completed</p><p className="mt-2 text-3xl font-semibold">{reports.filter((report) => report.status === 'completed').length}</p></Card>
          <Card><p className="text-sm text-foreground/60">Red flags</p><p className="mt-2 text-3xl font-semibold">{reports.reduce((total, report) => total + (report.red_flags?.length ?? 0), 0)}</p></Card>
        </div>
        <Card className="mt-6">
          <p className="font-semibold">AI summary</p>
          <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/70">{summary}</p>
        </Card>
        <Card className="mt-6">
          <p className="font-semibold">Report index</p>
          <div className="mt-3 space-y-3 text-sm">
            {reports.map((report) => (
              <div key={report.id} className="rounded-lg border border-border/50 p-3">
                <p className="font-medium">{report.filename}</p>
                <p className="text-foreground/60">Status: {report.status} · BI-RADS {report.birads_value ?? '—'}</p>
              </div>
            ))}
          </div>
        </Card>
        <Button className="mt-6" onClick={exportJson}><Download className="mr-2 h-4 w-4" /> Export JSON</Button>
      </Card>
    </div>
  );
};
