import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PROJECT_REPOSITORY, ProjectRepository } from '../domain/project-repository.port';
import { Project } from '../domain/project.entity';
import { generateDsnKey } from './generate-dsn-key';

@Injectable()
export class RotateProjectKeyUseCase {
  constructor(@Inject(PROJECT_REPOSITORY) private readonly projects: ProjectRepository) {}

  async execute(projectId: string): Promise<Project> {
    const project = await this.projects.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return this.projects.updateDsnKey(projectId, generateDsnKey());
  }
}
