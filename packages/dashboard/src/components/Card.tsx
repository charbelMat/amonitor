import type { PropsWithChildren, ReactNode } from 'react';

export function Card({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={`bg-surface border border-border rounded-lg ${className}`}>{children}</div>
  );
}

/** Card with a titled header strip — the standard container for detail sections. */
export function Panel({
  title,
  actions,
  children,
  bodyClassName = 'p-4',
}: PropsWithChildren<{ title: ReactNode; actions?: ReactNode; bodyClassName?: string }>) {
  return (
    <Card>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</h2>
        {actions}
      </div>
      <div className={bodyClassName}>{children}</div>
    </Card>
  );
}
