import { randomUUID } from 'node:crypto';
import { NotFoundException } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { CreateProjectData, ProjectRepository } from './domain/project-repository.port';
import { Project } from './domain/project.entity';
import { RotateProjectKeyUseCase } from './application/rotate-project-key.use-case';

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

describe('ProjectsController.rotateKey', () => {
  it('rejects rotating a project that belongs to a different organization than the URL', async () => {
    const repo = new InMemoryProjectRepository();
    const victimOrgId = randomUUID();
    const attackerOrgId = randomUUID();
    const victimProject = await repo.create({
      organizationId: victimOrgId,
      name: 'Victim project',
      slug: 'victim',
      dsnKey: 'nm_original',
    });

    const rotateProjectKey = new RotateProjectKeyUseCase(repo);
    const controller = new ProjectsController(
      undefined as any,
      undefined as any,
      rotateProjectKey,
      repo,
    );

    await expect(controller.rotateKey(attackerOrgId, victimProject.id)).rejects.toThrow(
      NotFoundException,
    );
    // The key must be untouched — the rejection has to happen before rotation.
    expect((await repo.findById(victimProject.id))!.dsnKey).toBe('nm_original');
  });

  it('allows rotating a project that does belong to the organization in the URL', async () => {
    const repo = new InMemoryProjectRepository();
    const orgId = randomUUID();
    const project = await repo.create({
      organizationId: orgId,
      name: 'My project',
      slug: 'my-project',
      dsnKey: 'nm_original',
    });

    const rotateProjectKey = new RotateProjectKeyUseCase(repo);
    const controller = new ProjectsController(
      undefined as any,
      undefined as any,
      rotateProjectKey,
      repo,
    );

    const result = await controller.rotateKey(orgId, project.id);
    expect(result.dsnKey).not.toBe('nm_original');
  });
});
