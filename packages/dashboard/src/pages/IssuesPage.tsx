import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useListIssuesQuery,
  useUpdateIssueStatusMutation,
  Issue,
  IssueStatus,
} from '../features/issues/issuesApi';
import { useProjectScope, useWorkspace } from '../app/useWorkspace';
import { PageHeader, FilterBar } from '../components/PageHeader';
import { ProjectSelector } from '../layout/ProjectSelector';
import { SegmentedControl } from '../components/SegmentedControl';
import { EmptyState, LoadingRow } from '../components/EmptyState';
import { Badge, BadgeTone, Dot } from '../components/Badge';
import { Button } from '../components/Button';
import { NoProjectNotice } from './NoProjectNotice';
import { timeAgo, formatDateTime } from '../lib/time';

const LEVEL_TONE: Record<string, BadgeTone> = { error: 'bad', warning: 'warn', info: 'info' };
type StatusFilter = IssueStatus | 'all';

export function IssuesPage() {
  const scope = useProjectScope();
  const { project, hasNoProjects, hasNoOrganizations } = useWorkspace();
  const { data: issues, isLoading } = useListIssuesQuery(scope as any, { skip: !scope });
  const [updateStatus] = useUpdateIssueStatusMutation();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('unresolved');
  const [selected, setSelected] = useState<string[]>([]);

  const counts = useMemo(() => {
    const all = issues ?? [];
    return {
      unresolved: all.filter((i) => i.status === 'unresolved').length,
      resolved: all.filter((i) => i.status === 'resolved').length,
      ignored: all.filter((i) => i.status === 'ignored').length,
      all: all.length,
    };
  }, [issues]);

  const visible = useMemo(() => {
    const all = issues ?? [];
    const filtered = statusFilter === 'all' ? all : all.filter((i) => i.status === statusFilter);
    return [...filtered].sort(
      (a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime(),
    );
  }, [issues, statusFilter]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function applyToSelected(status: IssueStatus) {
    if (!scope) return;
    await Promise.all(
      selected.map((issueId) => updateStatus({ ...scope, issueId, status }).unwrap()),
    );
    setSelected([]);
  }

  if (hasNoOrganizations || hasNoProjects) return <NoProjectNotice />;

  const allVisibleSelected = visible.length > 0 && selected.length === visible.length;

  return (
    <div>
      <PageHeader
        title="Issues"
        description={project ? `Errors reported by ${project.name}` : undefined}
      />

      <FilterBar>
        <SegmentedControl
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value);
            setSelected([]);
          }}
          segments={[
            { value: 'unresolved', label: 'Unresolved', count: counts.unresolved },
            { value: 'resolved', label: 'Resolved', count: counts.resolved },
            { value: 'ignored', label: 'Ignored', count: counts.ignored },
            { value: 'all', label: 'All', count: counts.all },
          ]}
        />
        <div className="ml-auto">
          <ProjectSelector />
        </div>
      </FilterBar>

      {selected.length > 0 && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-accent/10 border border-accent/30 rounded-md">
          <span className="text-xs text-accentSoft font-medium">
            {selected.length} selected
          </span>
          <div className="ml-auto flex gap-2">
            <Button onClick={() => applyToSelected('resolved')}>Resolve</Button>
            <Button onClick={() => applyToSelected('ignored')}>Ignore</Button>
            <Button variant="ghost" onClick={() => setSelected([])}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {isLoading && <LoadingRow label="Loading issues…" />}

      {!isLoading && visible.length === 0 && (
        <EmptyState
          title={statusFilter === 'unresolved' ? 'No unresolved issues' : 'Nothing here'}
          description={
            counts.all === 0
              ? "Errors reported through the SDK with this project's DSN key will show up here, grouped by where they came from."
              : 'Try a different status filter.'
          }
        />
      )}

      {visible.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden bg-surface">
          <div className="flex items-center gap-3 px-4 py-2 bg-raised border-b border-border text-2xs font-semibold uppercase tracking-wide text-faint">
            <label className="p-2 -m-2 cursor-pointer flex items-center">
              <input
                type="checkbox"
                className="accent-accent w-3.5 h-3.5 cursor-pointer"
                checked={allVisibleSelected}
                onChange={(e) => setSelected(e.target.checked ? visible.map((i) => i.id) : [])}
                aria-label="Select all issues"
              />
            </label>
            <span className="flex-1">Issue</span>
            <span className="w-20 text-right">Events</span>
            <span className="w-24 text-right">Last seen</span>
          </div>

          {visible.map((issue) => (
            <IssueRow
              key={issue.id}
              issue={issue}
              selected={selected.includes(issue.id)}
              onToggle={() => toggle(issue.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function IssueRow({
  issue,
  selected,
  onToggle,
}: {
  issue: Issue;
  selected: boolean;
  onToggle: () => void;
}) {
  const [type, ...rest] = issue.title.split(': ');
  const message = rest.join(': ');

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 transition-colors ${
        selected ? 'bg-accent/5' : 'hover:bg-raised/60'
      }`}
    >
      <label className="p-2 -m-2 cursor-pointer flex items-center shrink-0">
        <input
          type="checkbox"
          className="accent-accent w-3.5 h-3.5 cursor-pointer"
          checked={selected}
          onChange={onToggle}
          aria-label={`Select ${issue.title}`}
        />
      </label>

      <div className="flex-1 min-w-0">
        <Link to={`/issues/${issue.id}`} className="group block">
          <div className="flex items-center gap-2 min-w-0">
            <Dot tone={LEVEL_TONE[issue.level] ?? 'neutral'} title={issue.level} />
            <span className="text-sm font-semibold text-ink group-hover:text-accentSoft truncate">
              {type}
            </span>
            {message && <span className="text-sm text-muted truncate">{message}</span>}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-faint">
            <span className="font-mono">#{issue.fingerprint.slice(0, 7)}</span>
            {issue.status !== 'unresolved' && (
              <Badge tone={issue.status === 'resolved' ? 'good' : 'neutral'}>{issue.status}</Badge>
            )}
            <span>first seen {timeAgo(issue.firstSeen)}</span>
          </div>
        </Link>
      </div>

      <div className="w-20 text-right text-sm font-medium text-ink tabular-nums">
        {issue.eventCount}
      </div>
      <div
        className="w-24 text-right text-xs text-muted tabular-nums"
        title={formatDateTime(issue.lastSeen)}
      >
        {timeAgo(issue.lastSeen)}
      </div>
    </div>
  );
}
