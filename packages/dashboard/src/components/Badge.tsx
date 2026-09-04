import type { PropsWithChildren } from 'react';

export type BadgeTone = 'neutral' | 'good' | 'warn' | 'bad' | 'accent' | 'info';

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'text-muted border-border bg-raised',
  good: 'text-success border-success/40 bg-success/10',
  warn: 'text-warning border-warning/40 bg-warning/10',
  bad: 'text-danger border-danger/40 bg-danger/10',
  accent: 'text-accentSoft border-accent/40 bg-accent/10',
  info: 'text-info border-info/40 bg-info/10',
};

export function Badge({
  tone = 'neutral',
  className = '',
  children,
}: PropsWithChildren<{ tone?: BadgeTone; className?: string }>) {
  return (
    <span
      className={`inline-flex items-center text-2xs font-medium uppercase tracking-wide px-1.5 py-0.5 rounded border ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

const DOT_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-faint',
  good: 'bg-success',
  warn: 'bg-warning',
  bad: 'bg-danger',
  accent: 'bg-accent',
  info: 'bg-info',
};

/** Compact status indicator for dense list rows. */
export function Dot({ tone = 'neutral', title }: { tone?: BadgeTone; title?: string }) {
  return (
    <span
      title={title}
      className={`inline-block w-2 h-2 rounded-full shrink-0 ${DOT_CLASSES[tone]}`}
    />
  );
}
