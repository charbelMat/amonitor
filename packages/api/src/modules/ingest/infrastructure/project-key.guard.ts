import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PROJECT_REPOSITORY, ProjectRepository } from '../../projects/domain/project-repository.port';

/**
 * Authenticates ingest requests via the project's DSN key in the URL
 * (`:projectKey`), rather than a user JWT — this is the endpoint SDKs hit
 * directly, with no logged-in user involved.
 */
@Injectable()
export class ProjectKeyGuard implements CanActivate {
  constructor(@Inject(PROJECT_REPOSITORY) private readonly projects: ProjectRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const projectKey = request.params?.projectKey;

    const project = projectKey ? await this.projects.findByDsnKey(projectKey) : null;
    if (!project) {
      throw new UnauthorizedException('Invalid project DSN key');
    }

    request.project = project;
    return true;
  }
}
