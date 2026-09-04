import { useAppDispatch } from '../app/hooks';
import { useWorkspace } from '../app/useWorkspace';
import { setCurrentProject } from '../features/projects/currentProjectSlice';

/**
 * Project acts as a filter on the feature pages (Issues, Performance, …)
 * rather than as a level of the URL hierarchy.
 */
export function ProjectSelector() {
  const dispatch = useAppDispatch();
  const { projects, projectId } = useWorkspace();

  if (projects.length === 0) return null;

  return (
    <label className="inline-flex items-center gap-2 text-xs text-muted">
      <span className="font-medium">Project</span>
      <select
        className="bg-surface border border-border rounded-md px-2 py-1.5 text-xs text-ink focus:outline-none focus:border-accent"
        value={projectId ?? ''}
        onChange={(e) => dispatch(setCurrentProject(e.target.value))}
      >
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
    </label>
  );
}
