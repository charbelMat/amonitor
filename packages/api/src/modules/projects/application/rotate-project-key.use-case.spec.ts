import { randomUUID } from 'node:crypto';
import { NotFoundException } from '@nestjs/common';
import { RotateProjectKeyUseCase } from './rotate-project-key.use-case';
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

describe('RotateProjectKeyUseCase', () => {
  it('replaces the DSN key with a newly generated one', async () => {
    const repo = new InMemoryProjectRepository();
    const project = await repo.create({
      organizationId: randomUUID(),
      name: 'My project',
      slug: 'my-project',
      dsnKey: 'am_original',
    });
    const useCase = new RotateProjectKeyUseCase(repo);

    const updated = await useCase.execute(project.id);

    expect(updated.dsnKey).not.toBe('am_original');
    expect(updated.dsnKey).toMatch(/^am_[a-f0-9]{32}$/);
  });

  it('throws NotFoundException for an unknown project id', async () => {
    const useCase = new RotateProjectKeyUseCase(new InMemoryProjectRepository());
    await expect(useCase.execute(randomUUID())).rejects.toThrow(NotFoundException);
  });
});
