import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useListTransactionsQuery, SpanRow } from '../features/performance/performanceApi';
import { useProjectScope, useWorkspace } from '../app/useWorkspace';
import { PageHeader, FilterBar } from '../components/PageHeader';
import { ProjectSelector } from '../layout/ProjectSelector';
import { EmptyState, LoadingRow } from '../components/EmptyState';
import { StatTile } from '../components/StatTile';
import { Badge } from '../components/Badge';
import { NoProjectNotice } from './NoProjectNotice';
import { formatDateTime, formatDuration, timeAgo } from '../lib/time';

/** Slow requests should read as slow at a glance, the way a duration column does in Sentry. */
function durationTone(ms: number): string {
  if (ms >= 1000) return 'text-danger';
  if (ms >= 300) return 'text-warning';
  return 'text-success';
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[index];
}

export function PerformancePage() {
  const scope = useProjectScope();
  const { project, hasNoProjects, hasNoOrganizations } = useWorkspace();
  const { data: transactions, isLoading } = useListTransactionsQuery(scope as any, { skip: !scope });

  const stats = useMemo(() => {
    const durations = (transactions ?? []).map((t) => t.durationMs);
    return {
      count: durations.length,
      p50: percentile(durations, 50),
      p95: percentile(durations, 95),
      slowest: durations.length ? Math.max(...durations) : 0,
    };
  }, [transactions]);

  if (hasNoOrganizations || hasNoProjects) return <NoProjectNotice />;

  return (
    <div>
      <PageHeader
        title="Performance"
        description={project ? `Traced transactions from ${project.name}` : undefined}
      />

      <FilterBar>
        <div className="ml-auto">
          <ProjectSelector />
        </div>
      </FilterBar>

      {isLoading && <LoadingRow label="Loading transactions…" />}

      {!isLoading && stats.count === 0 && (
        <EmptyState
          title="No transactions yet"
          description="Wrap requests with the SDK's tracing middleware, or call startTransaction() directly, to see traces here."
        />
      )}

      {stats.count > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <StatTile label="Transactions" value={stats.count} />
            <StatTile label="p50" value={formatDuration(stats.p50)} />
            <StatTile label="p95" value={formatDuration(stats.p95)} />
            <StatTile label="Slowest" value={formatDuration(stats.slowest)} />
          </div>

          <div className="border border-border rounded-lg overflow-hidden bg-surface">
            <div className="flex items-center gap-3 px-4 py-2 bg-raised border-b border-border text-2xs font-semibold uppercase tracking-wide text-faint">
              <span className="flex-1">Transaction</span>
              <span className="w-24 text-right">Duration</span>
              <span className="w-24 text-right">When</span>
            </div>
            {transactions?.map((txn) => (
              <TransactionRow key={txn.id} txn={txn} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TransactionRow({ txn }: { txn: SpanRow }) {
  return (
    <Link
      to={`/performance/traces/${txn.traceId}`}
      className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 hover:bg-raised/60 transition-colors group"
    >
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <Badge tone="accent">{txn.op}</Badge>
        <span className="text-sm font-medium text-ink group-hover:text-accentSoft truncate">
          {txn.transactionName}
        </span>
      </div>
      <div
        className={`w-24 text-right text-sm font-semibold tabular-nums ${durationTone(txn.durationMs)}`}
      >
        {formatDuration(txn.durationMs)}
      </div>
      <div
        className="w-24 text-right text-xs text-muted tabular-nums"
        title={formatDateTime(txn.startTime)}
      >
        {timeAgo(txn.startTime)}
      </div>
    </Link>
  );
}
