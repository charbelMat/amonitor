import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { PROJECT_REPOSITORY, ProjectRepository } from '../domain/project-repository.port';
import { Project } from '../domain/project.entity';
import { slugify } from '../../../common/utils/slugify';
import { generateDsnKey } from './generate-dsn-key';

export interface CreateProjectInput {
  organizationId: string;
  name: string;
}

@Injectable()
export class CreateProjectUseCase {
  constructor(@Inject(PROJECT_REPOSITORY) private readonly projects: ProjectRepository) {}

  async execute({ organizationId, name }: CreateProjectInput): Promise<Project> {
    const baseSlug = slugify(name);
    let slug = baseSlug;
    let attempt = 0;
    while (await this.projects.findBySlugInOrganization(organizationId, slug)) {
      attempt += 1;
      slug = `${baseSlug}-${attempt}`;
      if (attempt > 20) {
        throw new ConflictException('Could not generate a unique project slug');
      }
    }

    return this.projects.create({
      organizationId,
      name,
      slug,
      dsnKey: generateDsnKey(),
    });
  }
}
