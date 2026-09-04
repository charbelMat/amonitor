import { Link } from 'react-router-dom';
import { useListNodesQuery, NodeInstance, NodeStatus } from '../features/nodes/nodesApi';
import { useProjectScope, useWorkspace } from '../app/useWorkspace';
import { PageHeader, FilterBar } from '../components/PageHeader';
import { ProjectSelector } from '../layout/ProjectSelector';
import { EmptyState, LoadingRow } from '../components/EmptyState';
import { Badge, BadgeTone, Dot } from '../components/Badge';
import { StatTile } from '../components/StatTile';
import { NoProjectNotice } from './NoProjectNotice';
import { formatBytes, formatBytesPerSec, formatUptime, timeAgo, formatDateTime } from '../lib/time';

// Status tones are the reserved status palette — never used for chart series.
const STATUS_TONE: Record<NodeStatus, BadgeTone> = {
  online: 'good',
  stale: 'warn',
  offline: 'bad',
};

/** A thin meter for a 0-100 value — magnitude against a known capacity. */
function Meter({ percent, tone }: { percent: number; tone: 'ok' | 'warn' | 'bad' }) {
  const color = tone === 'bad' ? 'bg-danger' : tone === 'warn' ? 'bg-warning' : 'bg-success';
  return (
    <div className="h-1.5 w-full bg-bg rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(2, percent))}%` }} />
    </div>
  );
}

function loadTone(percent: number): 'ok' | 'warn' | 'bad' {
  if (percent >= 90) return 'bad';
  if (percent >= 70) return 'warn';
  return 'ok';
}

export function NodesPage() {
  const scope = useProjectScope();
  const { project, hasNoProjects, hasNoOrganizations } = useWorkspace();
  // Nodes report every ~15s, so refresh on a similar cadence.
  const { data, isLoading } = useListNodesQuery(scope as any, {
    skip: !scope,
    pollingInterval: 15000,
  });

  if (hasNoOrganizations || hasNoProjects) return <NoProjectNotice />;

  const summary = data?.summary;

  return (
    <div>
      <PageHeader
        title="Nodes"
        description={project ? `Instances reporting for ${project.name}` : undefined}
      />

      <FilterBar>
        {summary && (
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Dot tone="good" /> {summary.online} online
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Dot tone="warn" /> {summary.stale} stale
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Dot tone="bad" /> {summary.offline} offline
            </span>
          </div>
        )}
        <div className="ml-auto">
          <ProjectSelector />
        </div>
      </FilterBar>

      {isLoading && <LoadingRow label="Loading nodes…" />}

      {!isLoading && data && data.nodes.length === 0 && (
        <EmptyState
          title="No nodes reporting"
          description="Every process running the SDK reports itself here with its CPU, memory and network usage. Make sure the SDK is initialised — health reporting is on by default."
        />
      )}

      {data && data.nodes.length > 0 && summary && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <StatTile label="Nodes" value={summary.total} hint={`${summary.online} online`} />
            <StatTile label="Avg CPU" value={`${summary.avgCpuPercent.toFixed(1)}%`} hint="across live nodes" />
            <StatTile label="Total memory" value={formatBytes(summary.totalMemRssBytes)} hint="resident set size" />
            <StatTile
              label="Network"
              value={formatBytesPerSec(summary.totalNetRxBytesPerSec + summary.totalNetTxBytesPerSec)}
              hint={`↓ ${formatBytesPerSec(summary.totalNetRxBytesPerSec)} · ↑ ${formatBytesPerSec(summary.totalNetTxBytesPerSec)}`}
            />
          </div>

          <div className="border border-border rounded-lg overflow-hidden bg-surface">
            <div className="flex items-center gap-3 px-4 py-2 bg-raised border-b border-border text-2xs font-semibold uppercase tracking-wide text-faint">
              <span className="flex-1">Node</span>
              <span className="w-36">CPU</span>
              <span className="w-36">Memory</span>
              <span className="w-28 text-right">Network</span>
              <span className="w-20 text-right">Seen</span>
            </div>
            {data.nodes.map((node) => (
              <NodeRow key={node.instanceId} node={node} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function NodeRow({ node }: { node: NodeInstance }) {
  const s = node.latest;
  const memUsedPercent =
    s.systemMemTotalBytes > 0
      ? ((s.systemMemTotalBytes - s.systemMemFreeBytes) / s.systemMemTotalBytes) * 100
      : 0;

  return (
    <Link
      to={`/nodes/${encodeURIComponent(node.instanceId)}`}
      className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 hover:bg-raised/60 transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Badge tone={STATUS_TONE[node.status]}>{node.status}</Badge>
          <span className="text-sm font-medium text-ink group-hover:text-accentSoft truncate">
            {node.hostname}
          </span>
          <span className="text-2xs font-mono text-faint">pid {s.pid}</span>
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-faint">
          <span className="font-mono truncate">{node.instanceId}</span>
          <span>· up {formatUptime(s.uptimeSec)}</span>
          <span>· {s.cpuCount} cores</span>
        </div>
      </div>

      <div className="w-36">
        <div className="flex justify-between text-2xs text-muted mb-1 tabular-nums">
          <span>{s.cpuPercent.toFixed(1)}%</span>
          <span className="text-faint">load {s.loadAvg1.toFixed(2)}</span>
        </div>
        <Meter percent={s.cpuPercent} tone={loadTone(s.cpuPercent)} />
      </div>

      <div className="w-36">
        <div className="flex justify-between text-2xs text-muted mb-1 tabular-nums">
          <span>{formatBytes(s.memRssBytes)}</span>
          <span className="text-faint">{memUsedPercent.toFixed(0)}% host</span>
        </div>
        <Meter percent={memUsedPercent} tone={loadTone(memUsedPercent)} />
      </div>

      <div className="w-28 text-right text-2xs tabular-nums">
        {s.networkSupported ? (
          <>
            <div className="text-muted">↓ {formatBytesPerSec(s.netRxBytesPerSec)}</div>
            <div className="text-faint">↑ {formatBytesPerSec(s.netTxBytesPerSec)}</div>
          </>
        ) : (
          <span className="text-faint" title="Host network counters need /proc (Linux)">
            n/a
          </span>
        )}
      </div>

      <div className="w-20 text-right text-xs text-muted" title={formatDateTime(node.lastSeen)}>
        {timeAgo(node.lastSeen)}
      </div>
    </Link>
  );
}
