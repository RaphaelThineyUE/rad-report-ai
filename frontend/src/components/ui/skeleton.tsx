export const Skeleton = ({ className = 'h-20 w-full' }: { className?: string }) => (
  <div className={`animate-pulse rounded-xl bg-muted ${className}`} />
);
