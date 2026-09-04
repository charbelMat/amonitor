import { Inject, Injectable } from '@nestjs/common';
import { PROJECT_REPOSITORY, ProjectRepository } from '../domain/project-repository.port';
import { Project } from '../domain/project.entity';

@Injectable()
export class ListProjectsForOrganizationUseCase {
  constructor(@Inject(PROJECT_REPOSITORY) private readonly projects: ProjectRepository) {}

  execute(organizationId: string): Promise<Project[]> {
    return this.projects.listForOrganization(organizationId);
  }
}
