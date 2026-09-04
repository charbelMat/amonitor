import { useNavigate, useParams } from 'react-router-dom';
import { useGetTraceQuery } from '../features/performance/performanceApi';
import { useProjectScope } from '../app/useWorkspace';
import { Panel } from '../components/Card';
import { Badge } from '../components/Badge';
import { StatTile } from '../components/StatTile';
import { LoadingRow } from '../components/EmptyState';
import { ArrowLeftIcon } from '../components/icons';
import { formatDateTime, formatDuration } from '../lib/time';

export function TraceDetailPage() {
  const { traceId } = useParams<{ traceId: string }>();
  const navigate = useNavigate();
  const projectScope = useProjectScope();
  const scope = projectScope && traceId ? { ...projectScope, traceId } : null;
  const { data: spans, isLoading } = useGetTraceQuery(scope as any, { skip: !scope });

  if (isLoading || !spans) return <LoadingRow />;

  const transaction = spans.find((s) => s.isTransaction) ?? spans[0];
  const rootStart = new Date(transaction.startTime).getTime();
  const totalDuration = transaction.durationMs || 1;
  const rows = [transaction, ...spans.filter((s) => !s.isTransaction)];

  return (
    <div>
      <button
        onClick={() => navigate('/performance')}
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink mb-4 transition-colors"
      >
        <ArrowLeftIcon width={14} height={14} />
        Back to performance
      </button>

      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1.5">
          <Badge tone="accent">{transaction.op}</Badge>
          <span className="text-xs font-mono text-faint">
            trace {transaction.traceId.slice(0, 8)}
          </span>
        </div>
        <h1 className="text-xl font-semibold text-ink">{transaction.transactionName}</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
        <StatTile label="Total duration" value={formatDuration(transaction.durationMs)} />
        <StatTile label="Spans" value={rows.length} />
        <StatTile label="Started" value={formatDateTime(transaction.startTime)} />
      </div>

      <Panel title="Trace waterfall" bodyClassName="p-0">
        <div className="divide-y divide-border">
          {rows.map((span) => {
            const offsetPct = ((new Date(span.startTime).getTime() - rootStart) / totalDuration) * 100;
            const widthPct = Math.max((span.durationMs / totalDuration) * 100, 0.5);
            return (
              <div key={span.id} className="px-4 py-2.5">
                <div className="flex items-baseline justify-between gap-3 mb-1.5 text-xs">
                  <div className="flex items-baseline gap-2 min-w-0">
                    <span
                      className={`font-mono shrink-0 ${
                        span.isTransaction ? 'text-accentSoft' : 'text-muted'
                      }`}
                    >
                      {span.op}
                    </span>
                    <span className="text-faint truncate">
                      {span.description || span.transactionName}
                    </span>
                  </div>
                  <span className="text-muted tabular-nums shrink-0">
                    {formatDuration(span.durationMs)}
                  </span>
                </div>
                <div className="h-1.5 bg-bg rounded-full relative overflow-hidden">
                  <div
                    className={`absolute h-full rounded-full ${
                      span.isTransaction ? 'bg-accent' : 'bg-accent/50'
                    }`}
                    style={{ left: `${offsetPct}%`, width: `${widthPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
