import type { ReactNode } from 'react';

export function StatTile({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="bg-surface border border-border rounded-lg px-4 py-3">
      <div className="text-2xs font-medium uppercase tracking-wide text-faint">{label}</div>
      <div className="text-lg font-semibold text-ink mt-1 tabular-nums">{value}</div>
      {hint && <div className="text-xs text-muted mt-0.5">{hint}</div>}
    </div>
  );
}
