import { FormEvent, useState } from 'react';
import {
  useListMonitorsQuery,
  useCreateMonitorMutation,
  useDeleteMonitorMutation,
  MonitorWithStatus,
} from '../features/uptime/uptimeApi';
import { useProjectScope, useWorkspace } from '../app/useWorkspace';
import { PageHeader, FilterBar } from '../components/PageHeader';
import { ProjectSelector } from '../layout/ProjectSelector';
import { EmptyState, LoadingRow } from '../components/EmptyState';
import { Badge, Dot } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PlusIcon } from '../components/icons';
import { NoProjectNotice } from './NoProjectNotice';
import { formatDateTime, formatDuration, timeAgo } from '../lib/time';

export function UptimePage() {
  const scope = useProjectScope();
  const { project, hasNoProjects, hasNoOrganizations } = useWorkspace();
  const { data: monitors, isLoading } = useListMonitorsQuery(scope as any, { skip: !scope });
  const [createMonitor, { isLoading: isCreating }] = useCreateMonitorMutation();
  const [deleteMonitor] = useDeleteMonitorMutation();

  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MonitorWithStatus | null>(null);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [intervalSeconds, setIntervalSeconds] = useState(60);
  const [expectedStatus, setExpectedStatus] = useState(200);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!scope) return;
    await createMonitor({ ...scope, name, url, intervalSeconds, expectedStatus }).unwrap();
    setName('');
    setUrl('');
    setShowCreate(false);
  }

  if (hasNoOrganizations || hasNoProjects) return <NoProjectNotice />;

  const upCount = monitors?.filter((m) => m.latestCheck?.success).length ?? 0;
  const downCount = monitors?.filter((m) => m.latestCheck && !m.latestCheck.success).length ?? 0;

  return (
    <div>
      <PageHeader
        title="Uptime"
        description={project ? `Synthetic checks for ${project.name}` : undefined}
        actions={
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            <PlusIcon width={14} height={14} />
            New monitor
          </Button>
        }
      />

      <FilterBar>
        <div className="flex items-center gap-3 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Dot tone="good" /> {upCount} up
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Dot tone="bad" /> {downCount} down
          </span>
        </div>
        <div className="ml-auto">
          <ProjectSelector />
        </div>
      </FilterBar>

      {isLoading && <LoadingRow label="Loading monitors…" />}

      {!isLoading && monitors?.length === 0 && (
        <EmptyState
          title="No monitors yet"
          description="Add a URL and node-monitor will check it on an interval, and alert you when it stops returning the status you expect."
          action={
            <Button size="md" variant="primary" onClick={() => setShowCreate(true)}>
              Add your first monitor
            </Button>
          }
        />
      )}

      {monitors && monitors.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden bg-surface">
          <div className="flex items-center gap-3 px-4 py-2 bg-raised border-b border-border text-2xs font-semibold uppercase tracking-wide text-faint">
            <span className="flex-1">Monitor</span>
            <span className="w-20 text-right">Latency</span>
            <span className="w-24 text-right">Checked</span>
            <span className="w-16" />
          </div>

          {monitors.map(({ monitor, latestCheck }) => (
            <div
              key={monitor.id}
              className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 hover:bg-raised/40 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {latestCheck === null ? (
                    <Badge tone="neutral">pending</Badge>
                  ) : latestCheck.success ? (
                    <Badge tone="good">up</Badge>
                  ) : (
                    <Badge tone="bad">down</Badge>
                  )}
                  <span className="text-sm font-medium text-ink truncate">{monitor.name}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-faint">
                  <span className="font-mono truncate">{monitor.url}</span>
                  <span>· every {monitor.intervalSeconds}s</span>
                  <span>· expects {monitor.expectedStatus}</span>
                  {latestCheck && !latestCheck.success && (
                    <span className="text-danger">· got {latestCheck.statusCode || 'no response'}</span>
                  )}
                </div>
              </div>

              <div className="w-20 text-right text-sm text-ink tabular-nums">
                {latestCheck ? formatDuration(latestCheck.latencyMs) : '—'}
              </div>
              <div
                className="w-24 text-right text-xs text-muted tabular-nums"
                title={latestCheck ? formatDateTime(latestCheck.timestamp) : undefined}
              >
                {latestCheck ? timeAgo(latestCheck.timestamp) : '—'}
              </div>
              <div className="w-16 flex justify-end">
                <Button
                  variant="ghost"
                  onClick={() => setDeleteTarget({ monitor, latestCheck })}
                  className="hover:text-danger"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <Modal title="Add uptime monitor" onClose={() => setShowCreate(false)}>
          <form className="flex flex-col gap-4" onSubmit={onCreate}>
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
            <Input
              label="URL"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/health"
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Interval (seconds)"
                type="number"
                min={30}
                max={86400}
                value={intervalSeconds}
                onChange={(e) => setIntervalSeconds(Number(e.target.value))}
                hint="Minimum 30s"
                required
              />
              <Input
                label="Expected status"
                type="number"
                min={100}
                max={599}
                value={expectedStatus}
                onChange={(e) => setExpectedStatus(Number(e.target.value))}
                required
              />
            </div>
            <Button size="md" variant="primary" type="submit" disabled={isCreating}>
              {isCreating ? 'Adding…' : 'Add monitor'}
            </Button>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete monitor?"
          message={`"${deleteTarget.monitor.name}" will stop being checked and its history will no longer be shown.`}
          confirmLabel="Delete"
          confirmVariant="danger"
          onConfirm={() => {
            if (scope) deleteMonitor({ ...scope, monitorId: deleteTarget.monitor.id });
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
