import { randomUUID } from 'node:crypto';
import { CreateProjectUseCase } from './create-project.use-case';
import { ProjectRepository, CreateProjectData } from '../domain/project-repository.port';
import { Project } from '../domain/project.entity';

class InMemoryProjectRepository implements ProjectRepository {
  projects: Project[] = [];
  async create(data: CreateProjectData) {
    const project: Project = { id: randomUUID(), createdAt: new Date(), ...data };
    this.projects.push(project);
    return project;
  }
  async findById(id: string) {
    return this.projects.find((p) => p.id === id) ?? null;
  }
  async findByDsnKey(dsnKey: string) {
    return this.projects.find((p) => p.dsnKey === dsnKey) ?? null;
  }
  async findBySlugInOrganization(organizationId: string, slug: string) {
    return this.projects.find((p) => p.organizationId === organizationId && p.slug === slug) ?? null;
  }
  async listForOrganization(organizationId: string) {
    return this.projects.filter((p) => p.organizationId === organizationId);
  }
  async updateDsnKey(id: string, dsnKey: string) {
    const project = this.projects.find((p) => p.id === id)!;
    project.dsnKey = dsnKey;
    return project;
  }
}

describe('CreateProjectUseCase', () => {
  it('creates a project with a unique slug and a DSN key', async () => {
    const repo = new InMemoryProjectRepository();
    const useCase = new CreateProjectUseCase(repo);
    const orgId = randomUUID();

    const project = await useCase.execute({ organizationId: orgId, name: 'My API' });

    expect(project.slug).toBe('my-api');
    expect(project.dsnKey).toMatch(/^nm_[a-f0-9]{32}$/);
  });

  it('disambiguates slugs that collide within the same organization', async () => {
    const repo = new InMemoryProjectRepository();
    const useCase = new CreateProjectUseCase(repo);
    const orgId = randomUUID();

    await useCase.execute({ organizationId: orgId, name: 'My API' });
    const second = await useCase.execute({ organizationId: orgId, name: 'My API' });

    expect(second.slug).toBe('my-api-1');
  });
});
