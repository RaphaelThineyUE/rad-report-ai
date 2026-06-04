type StatusKey = 'reviewed' | 'processing' | 'followup' | 'urgent' | 'draft';

const STATUS: Record<StatusKey, { cls: string; label: string }> = {
  reviewed:   { cls: 's-success', label: 'Reviewed' },
  processing: { cls: 's-info',    label: 'Processing' },
  followup:   { cls: 's-warning', label: 'Follow-up' },
  urgent:     { cls: 's-danger',  label: 'Urgent' },
  draft:      { cls: 's-neutral', label: 'Draft' },
};

interface BadgeProps {
  status: StatusKey | string;
}

export function Badge({ status }: BadgeProps) {
  const s = STATUS[status as StatusKey] ?? STATUS.draft;
  return (
    <span className={`badge ${s.cls}`}>
      <span className="bdot" />
      {s.label}
    </span>
  );
}
