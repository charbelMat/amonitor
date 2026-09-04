import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './hooks';
import { useListOrganizationsQuery } from '../features/organizations/organizationsApi';
import { useListProjectsQuery } from '../features/projects/projectsApi';
import { setCurrentOrganization } from '../features/organizations/currentOrganizationSlice';
import { setCurrentProject } from '../features/projects/currentProjectSlice';

/**
 * The active org + project every project-scoped page reads from. Navigation
 * is feature-first (Issues, Performance, …) with the project acting as a
 * filter, so selection lives here rather than in the URL. Falls back to the
 * first available org/project when nothing valid is selected yet.
 */
export function useWorkspace() {
  const dispatch = useAppDispatch();
  const organizationId = useAppSelector((s) => s.currentOrganization.organizationId);
  const projectId = useAppSelector((s) => s.currentProject.projectId);

  const { data: organizations, isLoading: orgsLoading } = useListOrganizationsQuery();
  const { data: projects, isLoading: projectsLoading } = useListProjectsQuery(
    organizationId as string,
    { skip: !organizationId },
  );

  // Keep the selected org valid (it may be stale from localStorage).
  useEffect(() => {
    if (!organizations || organizations.length === 0) return;
    const stillExists = organizations.some((org) => org.id === organizationId);
    if (!stillExists) {
      dispatch(setCurrentOrganization(organizations[0].id));
    }
  }, [organizations, organizationId, dispatch]);

  // Same for the project, scoped to whichever org is active.
  useEffect(() => {
    if (!projects) return;
    if (projects.length === 0) return;
    const stillExists = projects.some((project) => project.id === projectId);
    if (!stillExists) {
      dispatch(setCurrentProject(projects[0].id));
    }
  }, [projects, projectId, dispatch]);

  const organization = organizations?.find((org) => org.id === organizationId) ?? null;
  const project = projects?.find((p) => p.id === projectId) ?? null;

  return {
    organizations: organizations ?? [],
    projects: projects ?? [],
    organization,
    project,
    organizationId: organization?.id ?? null,
    projectId: project?.id ?? null,
    isLoading: orgsLoading || projectsLoading,
    hasNoOrganizations: !orgsLoading && (organizations?.length ?? 0) === 0,
    hasNoProjects: !projectsLoading && !!organizationId && (projects?.length ?? 0) === 0,
  };
}

/** Scope object accepted by the project-scoped RTK Query endpoints. */
export function useProjectScope() {
  const { organizationId, projectId } = useWorkspace();
  return organizationId && projectId ? { organizationId, projectId } : null;
}
