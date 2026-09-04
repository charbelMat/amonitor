import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';
import { useWorkspace } from '../app/useWorkspace';

/**
 * Shown on project-scoped pages when there's nothing to scope to yet —
 * points at the settings page where orgs and projects get created.
 */
export function NoProjectNotice() {
  const navigate = useNavigate();
  const { hasNoOrganizations } = useWorkspace();

  return (
    <EmptyState
      title={hasNoOrganizations ? 'No organization yet' : 'No project yet'}
      description={
        hasNoOrganizations
          ? 'Create an organization to start collecting errors, traces and uptime checks.'
          : 'Create a project to get a DSN key, then point the SDK at it.'
      }
      action={
        <Button size="md" variant="primary" onClick={() => navigate('/settings/projects')}>
          Go to project settings
        </Button>
      }
    />
  );
}
