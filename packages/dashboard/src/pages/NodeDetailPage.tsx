import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGetNodeHistoryQuery, useListNodesQuery } from '../features/nodes/nodesApi';
import { useProjectScope } from '../app/useWorkspace';
import { Panel } from '../components/Card';
import { Badge, BadgeTone } from '../components/Badge';
import { StatTile } from '../components/StatTile';
import { LoadingRow, EmptyState } from '../components/EmptyState';
import { SegmentedControl } from '../components/SegmentedControl';
import { TimeSeriesChart, ChartLegend } from '../components/TimeSeriesChart';
import { ArrowLeftIcon } from '../components/icons';
import { formatBytes, formatBytesPerSec, formatUptime, timeAgo, formatDateTime } from '../lib/time';

const STATUS_TONE: Record<string, BadgeTone> = { online: 'good', stale: 'warn', offline: 'bad' };
const WINDOWS = [
  { value: '15', label: '15m' },
  { value: '60', label: '1h' },
  { value: '360', label: '6h' },
  { value: '1440', label: '24h' },
] as const;

export function NodeDetailPage() {
  const { instanceId } = useParams<{ instanceId: string }>();
  const navigate = useNavigate();
  const scope = useProjectScope();
  const [minutes, setMinutes] = useState<string>('60');

  const { data: overview } = useListNodesQuery(scope as any, { skip: !scope });
  const { data: history, isLoading } = useGetNodeHistoryQuery(
    scope && instanceId ? { ...scope, instanceId, minutes: Number(minutes) } : (undefined as any),
    { skip: !scope || !instanceId, pollingInterval: 15000 },
  );

  const node = overview?.nodes.find((n) => n.instanceId === instanceId);

  if (isLoading && !history) return <LoadingRow />;

  const samples = history ?? [];
  const latest = node?.latest ?? samples[samples.length - 1];

  return (
    <div>
      <button
        onClick={() => navigate('/nodes')}
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink mb-4 transition-colors"
      >
        <ArrowLeftIcon width={14} height={14} />
        Back to nodes
      </button>

      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            {node && <Badge tone={STATUS_TONE[node.status]}>{node.status}</Badge>}
            {latest && <span className="text-2xs font-mono text-faint">pid {latest.pid}</span>}
          </div>
          <h1 className="text-xl font-semibold text-ink">{node?.hostname ?? instanceId}</h1>
          <p className="text-xs font-mono text-faint mt-1 break-all">{instanceId}</p>
        </div>
        <SegmentedControl
          value={minutes}
          onChange={setMinutes}
          segments={WINDOWS.map((w) => ({ value: w.value, label: w.label }))}
        />
      </div>

      {latest && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <StatTile label="CPU" value={`${latest.cpuPercent.toFixed(1)}%`} hint={`${latest.cpuCount} cores · load ${latest.loadAvg1.toFixed(2)}`} />
          <StatTile label="Memory (RSS)" value={formatBytes(latest.memRssBytes)} hint={`heap ${formatBytes(latest.memHeapUsedBytes)} / ${formatBytes(latest.memHeapTotalBytes)}`} />
          <StatTile label="Uptime" value={formatUptime(latest.uptimeSec)} hint={node ? `seen ${timeAgo(node.lastSeen)}` : undefined} />
          <StatTile label="Event loop lag" value={`${latest.eventLoopLagMs.toFixed(1)}ms`} hint="mean since last sample" />
        </div>
      )}

      {samples.length === 0 ? (
        <EmptyState title="No samples in this window" description="Try a longer time range, or check that the process is still reporting." />
      ) : (
        <div className="flex flex-col gap-4">
          {/* One metric per chart — never a shared axis across different units. */}
          <Panel title="CPU" actions={<span className="text-2xs text-faint">% of machine capacity</span>}>
            <TimeSeriesChart
              series={[{ label: 'CPU', points: samples.map((s) => ({ t: new Date(s.timestamp).getTime(), v: s.cpuPercent })) }]}
              format={(v) => `${v.toFixed(0)}%`}
              yMax={100}
            />
          </Panel>

          <Panel title="Memory" actions={<span className="text-2xs text-faint">resident set size</span>}>
            <TimeSeriesChart
              series={[{ label: 'RSS', points: samples.map((s) => ({ t: new Date(s.timestamp).getTime(), v: s.memRssBytes })) }]}
              format={formatBytes}
            />
          </Panel>

          <Panel
            title="Network"
            actions={
              latest?.networkSupported ? (
                <ChartLegend labels={['In', 'Out']} />
              ) : (
                <span className="text-2xs text-faint">host counters unavailable on this platform</span>
              )
            }
          >
            {latest?.networkSupported ? (
              <TimeSeriesChart
                series={[
                  { label: 'In', points: samples.map((s) => ({ t: new Date(s.timestamp).getTime(), v: s.netRxBytesPerSec })) },
                  { label: 'Out', points: samples.map((s) => ({ t: new Date(s.timestamp).getTime(), v: s.netTxBytesPerSec })) },
                ]}
                format={formatBytesPerSec}
              />
            ) : (
              <p className="text-xs text-faint py-6 text-center">
                Network throughput is read from /proc/net/dev, which exists on Linux only.
              </p>
            )}
          </Panel>

          {latest && (
            <Panel title="Host">
              <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <dt className="text-faint mb-1">Host memory</dt>
                  <dd className="text-ink">
                    {formatBytes(latest.systemMemTotalBytes - latest.systemMemFreeBytes)} / {formatBytes(latest.systemMemTotalBytes)}
                  </dd>
                </div>
                <div>
                  <dt className="text-faint mb-1">CPU cores</dt>
                  <dd className="text-ink">{latest.cpuCount}</dd>
                </div>
                <div>
                  <dt className="text-faint mb-1">Load (1m)</dt>
                  <dd className="text-ink">{latest.loadAvg1.toFixed(2)}</dd>
                </div>
                <div>
                  <dt className="text-faint mb-1">Last sample</dt>
                  <dd className="text-ink">{formatDateTime(latest.timestamp)}</dd>
                </div>
              </dl>
            </Panel>
          )}
        </div>
      )}
    </div>
  );
}
