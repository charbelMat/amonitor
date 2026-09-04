import { useNavigate, useParams } from 'react-router-dom';
import {
  useGetIssueQuery,
  useUpdateIssueStatusMutation,
  IssueStatus,
  Breadcrumb,
} from '../features/issues/issuesApi';
import { useProjectScope } from '../app/useWorkspace';
import { Panel } from '../components/Card';
import { Badge, BadgeTone, Dot } from '../components/Badge';
import { Button } from '../components/Button';
import { StatTile } from '../components/StatTile';
import { LoadingRow } from '../components/EmptyState';
import { ArrowLeftIcon } from '../components/icons';
import { formatDateTime, timeAgo } from '../lib/time';

const LEVEL_TONE: Record<string, BadgeTone> = { error: 'bad', warning: 'warn', info: 'info' };
const STATUS_TONE: Record<IssueStatus, BadgeTone> = {
  unresolved: 'bad',
  resolved: 'good',
  ignored: 'neutral',
};

interface StackFrame {
  fn: string;
  location: string;
  inApp: boolean;
}

/** Turns a raw V8 stack string into frames so it can be rendered like a stack trace, not a blob. */
function parseStack(stack: string): StackFrame[] {
  return stack
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('at '))
    .map((line) => {
      const withFn = line.match(/^at (.+?) \((.+)\)$/);
      const location = withFn ? withFn[2] : line.replace(/^at /, '');
      return {
        fn: withFn ? withFn[1] : '<anonymous>',
        location,
        inApp: !location.startsWith('node:') && !location.includes('node_modules'),
      };
    });
}

export function IssueDetailPage() {
  const { issueId } = useParams<{ issueId: string }>();
  const navigate = useNavigate();
  const projectScope = useProjectScope();
  const scope = projectScope && issueId ? { ...projectScope, issueId } : null;

  const { data, isLoading } = useGetIssueQuery(scope as any, { skip: !scope });
  const [updateStatus, { isLoading: isUpdating }] = useUpdateIssueStatusMutation();

  if (isLoading || !data) return <LoadingRow />;

  const { issue, events } = data;
  const latestEvent = events[0];
  const frames = latestEvent ? parseStack(latestEvent.stackTrace) : [];
  const culprit = frames.find((f) => f.inApp)?.location ?? frames[0]?.location;
  const [type, ...rest] = issue.title.split(': ');
  const message = rest.join(': ');

  function setStatus(status: IssueStatus) {
    if (scope) updateStatus({ ...scope, status });
  }

  return (
    <div>
      <button
        onClick={() => navigate('/issues')}
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink mb-4 transition-colors"
      >
        <ArrowLeftIcon width={14} height={14} />
        Back to issues
      </button>

      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Dot tone={LEVEL_TONE[issue.level] ?? 'neutral'} />
            <Badge tone={LEVEL_TONE[issue.level] ?? 'neutral'}>{issue.level}</Badge>
            <Badge tone={STATUS_TONE[issue.status]}>{issue.status}</Badge>
            <span className="text-xs font-mono text-faint">#{issue.fingerprint.slice(0, 7)}</span>
          </div>
          <h1 className="text-xl font-semibold text-ink break-words">{type}</h1>
          {message && <p className="text-sm text-muted mt-1 break-words">{message}</p>}
          {culprit && <p className="text-xs font-mono text-faint mt-2 truncate">{culprit}</p>}
        </div>

        <div className="flex gap-2 shrink-0">
          {issue.status !== 'resolved' && (
            <Button variant="primary" disabled={isUpdating} onClick={() => setStatus('resolved')}>
              Resolve
            </Button>
          )}
          {issue.status !== 'ignored' && (
            <Button disabled={isUpdating} onClick={() => setStatus('ignored')}>
              Ignore
            </Button>
          )}
          {issue.status !== 'unresolved' && (
            <Button disabled={isUpdating} onClick={() => setStatus('unresolved')}>
              Unresolve
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatTile label="Events" value={issue.eventCount} />
        <StatTile
          label="First seen"
          value={timeAgo(issue.firstSeen)}
          hint={formatDateTime(issue.firstSeen)}
        />
        <StatTile
          label="Last seen"
          value={timeAgo(issue.lastSeen)}
          hint={formatDateTime(issue.lastSeen)}
        />
        <StatTile label="Environment" value={latestEvent?.environment ?? '—'} />
      </div>

      <div className="flex flex-col gap-4">
        {latestEvent && (
          <Panel
            title="Stack trace"
            actions={<span className="text-2xs text-faint">most recent event</span>}
            bodyClassName="p-0"
          >
            {frames.length > 0 ? (
              <div className="divide-y divide-border">
                {frames.map((frame, i) => (
                  <div
                    key={i}
                    className={`flex items-baseline gap-3 px-4 py-2 font-mono text-xs ${
                      frame.inApp ? 'bg-transparent' : 'bg-bg/40'
                    }`}
                  >
                    <span className="text-faint w-6 shrink-0 tabular-nums">{i + 1}</span>
                    <span
                      className={`shrink-0 ${frame.inApp ? 'text-accentSoft' : 'text-muted'}`}
                    >
                      {frame.fn}
                    </span>
                    <span className="text-faint truncate" title={frame.location}>
                      {frame.location}
                    </span>
                    {!frame.inApp && (
                      <span className="ml-auto text-2xs text-faint shrink-0">system</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <pre className="text-xs text-muted p-4 whitespace-pre-wrap">
                {latestEvent.stackTrace || latestEvent.message}
              </pre>
            )}
          </Panel>
        )}

        {latestEvent && latestEvent.breadcrumbs.length > 0 && (
          <Panel title="Breadcrumbs" bodyClassName="p-0">
            <div className="divide-y divide-border">
              {latestEvent.breadcrumbs.map((crumb, i) => (
                <BreadcrumbRow key={i} crumb={crumb} />
              ))}
            </div>
          </Panel>
        )}

        {latestEvent && Object.keys(latestEvent.tags).length > 0 && (
          <Panel title="Tags">
            <div className="flex flex-wrap gap-2">
              {Object.entries(latestEvent.tags).map(([key, value]) => (
                <span
                  key={key}
                  className="text-xs bg-raised border border-border rounded px-2 py-1"
                >
                  <span className="text-faint">{key}</span>
                  <span className="text-muted mx-1">:</span>
                  <span className="text-ink">{String(value)}</span>
                </span>
              ))}
            </div>
          </Panel>
        )}

        {events.length > 1 && (
          <Panel title={`Recent events (${events.length})`} bodyClassName="p-0">
            <div className="divide-y divide-border">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 px-4 py-2 text-xs"
                >
                  <span className="font-mono text-faint">{event.id.slice(0, 8)}</span>
                  <span className="text-muted truncate flex-1">{event.message}</span>
                  <span className="text-faint" title={formatDateTime(event.timestamp)}>
                    {timeAgo(event.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

const CRUMB_TONE: Record<string, string> = {
  error: 'text-danger',
  warning: 'text-warning',
  info: 'text-info',
};

function BreadcrumbRow({ crumb }: { crumb: Breadcrumb }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 text-xs">
      <span className="text-faint tabular-nums w-20 shrink-0">
        {new Date(crumb.timestamp).toLocaleTimeString()}
      </span>
      <span className="text-muted bg-raised border border-border rounded px-1.5 py-0.5 shrink-0">
        {crumb.category}
      </span>
      <span className={`shrink-0 ${CRUMB_TONE[crumb.level] ?? 'text-faint'}`}>{crumb.level}</span>
      <span className="text-ink truncate">{crumb.message}</span>
    </div>
  );
}
