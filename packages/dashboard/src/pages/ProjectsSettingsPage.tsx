import { FormEvent, useState } from 'react';
import {
  useListProjectsQuery,
  useCreateProjectMutation,
  useRotateProjectKeyMutation,
  Project,
} from '../features/projects/projectsApi';
import { useCreateOrganizationMutation } from '../features/organizations/organizationsApi';
import { useWorkspace } from '../app/useWorkspace';
import { useAppDispatch } from '../app/hooks';
import { setCurrentOrganization } from '../features/organizations/currentOrganizationSlice';
import { setCurrentProject } from '../features/projects/currentProjectSlice';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { EmptyState, LoadingRow } from '../components/EmptyState';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PlusIcon } from '../components/icons';
import { formatDateTime } from '../lib/time';

export function ProjectsSettingsPage() {
  const dispatch = useAppDispatch();
  const { organization, organizationId, hasNoOrganizations } = useWorkspace();
  const { data: projects, isLoading } = useListProjectsQuery(organizationId as string, {
    skip: !organizationId,
  });
  const [createProject, { isLoading: isCreatingProject }] = useCreateProjectMutation();
  const [createOrganization, { isLoading: isCreatingOrg }] = useCreateOrganizationMutation();
  const [rotateKey] = useRotateProjectKeyMutation();

  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [rotateTarget, setRotateTarget] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState('');
  const [orgName, setOrgName] = useState('');

  async function onCreateProject(e: FormEvent) {
    e.preventDefault();
    if (!organizationId) return;
    const project = await createProject({ organizationId, name: projectName }).unwrap();
    dispatch(setCurrentProject(project.id));
    setProjectName('');
    setShowCreateProject(false);
  }

  async function onCreateOrg(e: FormEvent) {
    e.preventDefault();
    const org = await createOrganization({ name: orgName }).unwrap();
    dispatch(setCurrentOrganization(org.id));
    setOrgName('');
    setShowCreateOrg(false);
  }

  return (
    <div>
      <PageHeader
        title="Projects"
        description={
          organization
            ? `Projects in ${organization.name}. Each has its own DSN key for the SDK.`
            : 'Create an organization to get started.'
        }
        actions={
          <>
            <Button onClick={() => setShowCreateOrg(true)}>New organization</Button>
            {organizationId && (
              <Button variant="primary" onClick={() => setShowCreateProject(true)}>
                <PlusIcon width={14} height={14} />
                New project
              </Button>
            )}
          </>
        }
      />

      {hasNoOrganizations && (
        <EmptyState
          title="No organization yet"
          description="Organizations hold your projects and their team members."
          action={
            <Button size="md" variant="primary" onClick={() => setShowCreateOrg(true)}>
              Create an organization
            </Button>
          }
        />
      )}

      {organizationId && isLoading && <LoadingRow label="Loading projects…" />}

      {organizationId && !isLoading && projects?.length === 0 && (
        <EmptyState
          title="No projects yet"
          description="A project gives you a DSN key — point the SDK at it and errors, traces and uptime checks start flowing in."
          action={
            <Button size="md" variant="primary" onClick={() => setShowCreateProject(true)}>
              Create your first project
            </Button>
          }
        />
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {projects?.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onRotate={() => setRotateTarget(project)}
          />
        ))}
      </div>

      {showCreateProject && (
        <Modal title="Create project" onClose={() => setShowCreateProject(false)}>
          <form className="flex flex-col gap-4" onSubmit={onCreateProject}>
            <Input
              label="Project name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
              autoFocus
            />
            <Button size="md" variant="primary" type="submit" disabled={isCreatingProject}>
              {isCreatingProject ? 'Creating…' : 'Create project'}
            </Button>
          </form>
        </Modal>
      )}

      {showCreateOrg && (
        <Modal title="Create organization" onClose={() => setShowCreateOrg(false)}>
          <form className="flex flex-col gap-4" onSubmit={onCreateOrg}>
            <Input
              label="Organization name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
              autoFocus
            />
            <Button size="md" variant="primary" type="submit" disabled={isCreatingOrg}>
              {isCreatingOrg ? 'Creating…' : 'Create organization'}
            </Button>
          </form>
        </Modal>
      )}

      {rotateTarget && (
        <ConfirmDialog
          title="Rotate DSN key?"
          message={`Any app still using ${rotateTarget.name}'s current key will stop reporting until you update it.`}
          confirmLabel="Rotate key"
          confirmVariant="danger"
          onConfirm={() => {
            if (organizationId) rotateKey({ organizationId, projectId: rotateTarget.id });
            setRotateTarget(null);
          }}
          onCancel={() => setRotateTarget(null)}
        />
      )}
    </div>
  );
}

function ProjectCard({ project, onRotate }: { project: Project; onRotate: () => void }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyKey() {
    try {
      await navigator.clipboard.writeText(project.dsnKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked; revealing the key is the fallback.
      setRevealed(true);
    }
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-ink truncate">{project.name}</div>
          <div className="text-xs text-faint mt-0.5">
            created {formatDateTime(project.createdAt)}
          </div>
        </div>
        <Badge tone="neutral">{project.slug}</Badge>
      </div>

      <div className="text-2xs font-semibold uppercase tracking-wide text-faint mb-1.5">
        DSN key
      </div>
      <code className="text-xs font-mono block bg-bg border border-border rounded px-2.5 py-2 mb-3 break-all text-muted">
        {revealed ? project.dsnKey : '•'.repeat(36)}
      </code>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setRevealed((v) => !v)}>{revealed ? 'Hide' : 'Reveal'}</Button>
        <Button onClick={copyKey}>{copied ? 'Copied' : 'Copy'}</Button>
        <Button variant="ghost" onClick={onRotate} className="hover:text-danger">
          Rotate
        </Button>
      </div>
    </Card>
  );
}
