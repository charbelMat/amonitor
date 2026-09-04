import { Body, Controller, Param, Post, Get, Inject, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateProjectUseCase } from './application/create-project.use-case';
import { ListProjectsForOrganizationUseCase } from './application/list-projects-for-organization.use-case';
import { RotateProjectKeyUseCase } from './application/rotate-project-key.use-case';
import { CreateProjectDto } from './dto/create-project.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrganizationMembershipGuard } from '../organizations/infrastructure/organization-membership.guard';
import { PROJECT_REPOSITORY, ProjectRepository } from './domain/project-repository.port';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, OrganizationMembershipGuard)
@Controller('organizations/:organizationId/projects')
export class ProjectsController {
  constructor(
    private readonly createProject: CreateProjectUseCase,
    private readonly listProjects: ListProjectsForOrganizationUseCase,
    private readonly rotateProjectKey: RotateProjectKeyUseCase,
    @Inject(PROJECT_REPOSITORY) private readonly projects: ProjectRepository,
  ) {}

  @Get()
  list(@Param('organizationId') organizationId: string) {
    return this.listProjects.execute(organizationId);
  }

  @Post()
  create(@Param('organizationId') organizationId: string, @Body() dto: CreateProjectDto) {
    return this.createProject.execute({ organizationId, name: dto.name });
  }

  @Post(':projectId/rotate-key')
  async rotateKey(@Param('organizationId') organizationId: string, @Param('projectId') projectId: string) {
    const project = await this.projects.findById(projectId);
    if (!project || project.organizationId !== organizationId) {
      throw new NotFoundException('Project not found');
    }
    return this.rotateProjectKey.execute(projectId);
  }
}
