import { Controller, Get, Inject, NotFoundException, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ListNodesUseCase } from './application/list-nodes.use-case';
import { GetNodeHistoryUseCase } from './application/get-node-history.use-case';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrganizationMembershipGuard } from '../organizations/infrastructure/organization-membership.guard';
import { PROJECT_REPOSITORY, ProjectRepository } from '../projects/domain/project-repository.port';

@ApiTags('nodes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, OrganizationMembershipGuard)
@Controller('organizations/:organizationId/projects/:projectId/nodes')
export class NodesController {
  constructor(
    private readonly listNodes: ListNodesUseCase,
    private readonly getNodeHistory: GetNodeHistoryUseCase,
    @Inject(PROJECT_REPOSITORY) private readonly projects: ProjectRepository,
  ) {}

  @Get()
  async list(@Param('organizationId') organizationId: string, @Param('projectId') projectId: string) {
    await this.assertProjectInOrganization(organizationId, projectId);
    return this.listNodes.execute(projectId);
  }

  @Get(':instanceId/history')
  async history(
    @Param('organizationId') organizationId: string,
    @Param('projectId') projectId: string,
    @Param('instanceId') instanceId: string,
    @Query('minutes', new ParseIntPipe({ optional: true })) minutes?: number,
  ) {
    await this.assertProjectInOrganization(organizationId, projectId);
    const window = Math.min(Math.max(minutes ?? 60, 5), 1440);
    return this.getNodeHistory.execute(projectId, instanceId, window);
  }

  private async assertProjectInOrganization(organizationId: string, projectId: string) {
    const project = await this.projects.findById(projectId);
    if (!project || project.organizationId !== organizationId) {
      throw new NotFoundException('Project not found');
    }
  }
}
