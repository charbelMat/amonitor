import { FormEvent, useState } from 'react';
import {
  useListAlertRulesQuery,
  useCreateAlertRuleMutation,
  useDeleteAlertRuleMutation,
  AlertChannel,
  AlertRule,
  AlertTrigger,
} from '../features/alerts/alertsApi';
import { useProjectScope, useWorkspace } from '../app/useWorkspace';
import { PageHeader, FilterBar } from '../components/PageHeader';
import { ProjectSelector } from '../layout/ProjectSelector';
import { EmptyState, LoadingRow } from '../components/EmptyState';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input, SelectField } from '../components/Input';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PlusIcon } from '../components/icons';
import { NoProjectNotice } from './NoProjectNotice';
import { timeAgo } from '../lib/time';

const TRIGGER_LABELS: Record<AlertTrigger, string> = {
  issue_created: 'New issue',
  uptime_down: 'Uptime down',
};

export function AlertsPage() {
  const scope = useProjectScope();
  const { project, hasNoProjects, hasNoOrganizations } = useWorkspace();
  const { data: rules, isLoading } = useListAlertRulesQuery(scope as any, { skip: !scope });
  const [createRule, { isLoading: isCreating, error }] = useCreateAlertRuleMutation();
  const [deleteRule] = useDeleteAlertRuleMutation();

  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AlertRule | null>(null);
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState<AlertTrigger>('issue_created');
  const [channel, setChannel] = useState<AlertChannel>('email');
  const [target, setTarget] = useState('');

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!scope) return;
    await createRule({ ...scope, name, trigger, channel, target }).unwrap();
    setName('');
    setTarget('');
    setShowCreate(false);
  }

  if (hasNoOrganizations || hasNoProjects) return <NoProjectNotice />;

  return (
    <div>
      <PageHeader
        title="Alerts"
        description={project ? `Notification rules for ${project.name}` : undefined}
        actions={
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            <PlusIcon width={14} height={14} />
            New rule
          </Button>
        }
      />

      <FilterBar>
        <div className="ml-auto">
          <ProjectSelector />
        </div>
      </FilterBar>

      {isLoading && <LoadingRow label="Loading alert rules…" />}

      {!isLoading && rules?.length === 0 && (
        <EmptyState
          title="No alert rules yet"
          description="Get notified by email or webhook the moment a new issue appears or a monitor goes down."
          action={
            <Button size="md" variant="primary" onClick={() => setShowCreate(true)}>
              Create your first rule
            </Button>
          }
        />
      )}

      {rules && rules.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden bg-surface">
          <div className="flex items-center gap-3 px-4 py-2 bg-raised border-b border-border text-2xs font-semibold uppercase tracking-wide text-faint">
            <span className="w-32">Trigger</span>
            <span className="flex-1">Rule</span>
            <span className="w-24 text-right">Created</span>
            <span className="w-16" />
          </div>

          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 hover:bg-raised/40 transition-colors"
            >
              <div className="w-32">
                <Badge tone={rule.trigger === 'uptime_down' ? 'warn' : 'bad'}>
                  {TRIGGER_LABELS[rule.trigger]}
                </Badge>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ink truncate">{rule.name}</div>
                <div className="flex items-center gap-2 mt-1 text-xs text-faint">
                  <Badge tone="accent">{rule.channel}</Badge>
                  <span className="font-mono truncate">{rule.target}</span>
                </div>
              </div>
              <div className="w-24 text-right text-xs text-muted">{timeAgo(rule.createdAt)}</div>
              <div className="w-16 flex justify-end">
                <Button
                  variant="ghost"
                  onClick={() => setDeleteTarget(rule)}
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
        <Modal title="Create alert rule" onClose={() => setShowCreate(false)}>
          <form className="flex flex-col gap-4" onSubmit={onCreate}>
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />

            <SelectField
              label="Trigger"
              value={trigger}
              onChange={(e) => setTrigger(e.target.value as AlertTrigger)}
            >
              <option value="issue_created">New issue</option>
              <option value="uptime_down">Uptime down</option>
            </SelectField>

            <SelectField
              label="Channel"
              value={channel}
              onChange={(e) => setChannel(e.target.value as AlertChannel)}
            >
              <option value="email">Email</option>
              <option value="webhook">Webhook</option>
            </SelectField>

            <Input
              label={channel === 'email' ? 'Email address' : 'Webhook URL'}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder={channel === 'email' ? 'you@example.com' : 'https://example.com/hook'}
              required
            />

            {error && <p className="text-sm text-danger">Could not create alert rule</p>}
            <Button size="md" variant="primary" type="submit" disabled={isCreating}>
              {isCreating ? 'Creating…' : 'Create rule'}
            </Button>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete alert rule?"
          message={`"${deleteTarget.name}" will stop sending notifications.`}
          confirmLabel="Delete"
          confirmVariant="danger"
          onConfirm={() => {
            if (scope) deleteRule({ ...scope, ruleId: deleteTarget.id });
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
