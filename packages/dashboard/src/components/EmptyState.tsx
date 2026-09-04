import type { ReactNode } from 'react';

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="border border-dashed border-border rounded-lg py-14 px-6 text-center">
      <p className="text-sm font-medium text-ink">{title}</p>
      {description && (
        <p className="text-sm text-muted mt-2 max-w-md mx-auto leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function LoadingRow({ label = 'Loading…' }: { label?: string }) {
  return <p className="text-sm text-faint py-8 text-center">{label}</p>;
}
