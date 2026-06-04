import { AlertTriangle, ExternalLink, FileJson, Trash2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import type { Report } from '../../types/domain';

export const ReportDetail = ({
  report,
  onClose,
  onDelete,
  onConsolidate,
}: {
  report: Report | null;
  onClose: () => void;
  onDelete: (reportId: string) => void;
  onConsolidate: (report: Report) => void;
}) => {
  if (!report) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30">
      <div className="h-full w-full max-w-xl overflow-y-auto border-l border-border/50 bg-background p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-foreground/60">Report detail</p>
            <h2 className="text-xl font-semibold">{report.filename}</h2>
          </div>
          <Button className="bg-transparent text-foreground" onClick={onClose}>Close</Button>
        </div>
        {!!report.red_flags?.length && (
          <Card className="mt-6 border-danger/40 bg-danger/5">
            <div className="flex items-start gap-3 text-danger">
              <AlertTriangle className="mt-0.5 h-5 w-5" />
              <div>
                <p className="font-semibold">Red flag review recommended</p>
                <p className="text-sm">{report.red_flags.join(', ')}</p>
              </div>
            </div>
          </Card>
        )}
        <Card className="mt-6">
          <p className="text-sm text-foreground/60">BI-RADS</p>
          <div className="mt-2 flex items-center gap-3">
            <p className="text-4xl font-semibold">{report.birads_value ?? '—'}</p>
            <Badge>{report.birads_confidence ?? 'pending'}</Badge>
          </div>
          <p className="mt-4 text-sm text-foreground/70">{report.summary ?? 'AI summary will appear after processing.'}</p>
        </Card>
        <Card className="mt-6">
          <p className="font-semibold">Exam info</p>
          <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div><span className="text-foreground/60">Type:</span> {report.exam_type ?? '—'}</div>
            <div><span className="text-foreground/60">Laterality:</span> {report.exam_laterality ?? '—'}</div>
            <div><span className="text-foreground/60">Density:</span> {report.breast_density_value ?? '—'}</div>
            <div><span className="text-foreground/60">Status:</span> {report.status}</div>
          </div>
        </Card>
        <Card className="mt-6">
          <p className="font-semibold">Findings</p>
          <div className="mt-3 space-y-3 text-sm">
            {report.findings?.length ? report.findings.map((finding) => (
              <div key={`${finding.location}-${finding.description}`} className="rounded-lg border border-border/50 p-3">
                <p className="font-medium">{finding.location} · {finding.laterality}</p>
                <p className="mt-1 text-foreground/70">{finding.description}</p>
                <p className="mt-1 text-foreground/60">Assessment: {finding.assessment}</p>
                <p className="mt-2 text-xs italic text-foreground/50">“{finding.evidence?.[0] ?? 'No evidence quote yet.'}”</p>
              </div>
            )) : <p className="text-foreground/60">No extracted findings yet.</p>}
          </div>
        </Card>
        <Card className="mt-6">
          <p className="font-semibold">Recommendations</p>
          <div className="mt-3 space-y-3 text-sm">
            {report.recommendations?.length ? report.recommendations.map((item) => (
              <div key={`${item.action}-${item.timeframe}`} className="rounded-lg border border-border/50 p-3">
                <p className="font-medium">{item.action}</p>
                <p className="text-foreground/60">{item.timeframe}</p>
                <p className="mt-2 text-xs italic text-foreground/50">“{item.evidence?.[0] ?? 'No evidence quote yet.'}”</p>
              </div>
            )) : <p className="text-foreground/60">No recommendations yet.</p>}
          </div>
        </Card>
        <div className="mt-6 flex flex-wrap gap-3">
          {report.file_url ? (
            <Button onClick={() => window.open(report.file_url ?? undefined, '_blank', 'noopener,noreferrer')}>
              <ExternalLink className="mr-2 h-4 w-4" /> View PDF
            </Button>
          ) : null}
          <Button className="bg-accent text-foreground" onClick={() => onConsolidate(report)}>
            <FileJson className="mr-2 h-4 w-4" /> Consolidate
          </Button>
          <Button className="bg-danger" onClick={() => onDelete(report.id)}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>
    </div>
  );
};
