import React from 'react';

const STAGE_STYLE: Record<string, string> = {
  'Stage I': 's-success',
  'Stage II': 's-warning',
  'Stage III': 's-warning',
  'Stage IV': 's-danger',
  'Unknown': 's-neutral',
};

interface StageBadgeProps {
  stage: string | null;
}

export function StageBadge({ stage }: StageBadgeProps) {
  if (!stage) return null;
  const cls = STAGE_STYLE[stage] ?? 's-neutral';
  return (
    <span className={`badge ${cls}`}>
      <span className="bdot" />
      {stage}
    </span>
  );
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}

interface PatientAvatarProps {
  name: string;
  size?: number;
}

export function PatientAvatar({ name, size = 42 }: PatientAvatarProps) {
  return (
    <div
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {getInitials(name)}
    </div>
  );
}
