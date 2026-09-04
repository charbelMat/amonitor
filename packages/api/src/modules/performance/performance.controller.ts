import { Controller, Get, Inject, NotFoundException, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ListTransactionsForProjectUseCase } from './application/list-transactions-for-project.use-case';
import { GetTraceUseCase } from './application/get-trace.use-case';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrganizationMembershipGuard } from '../organizations/infrastructure/organization-membership.guard';
import { PROJECT_REPOSITORY, ProjectRepository } from '../projects/domain/project-repository.port';

@ApiTags('performance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, OrganizationMembershipGuard)
@Controller('organizations/:organizationId/projects/:projectId/performance')
export class PerformanceController {
  constructor(
    private readonly listTransactions: ListTransactionsForProjectUseCase,
    private readonly getTrace: GetTraceUseCase,
    @Inject(PROJECT_REPOSITORY) private readonly projects: ProjectRepository,
  ) {}

  @Get('transactions')
  async list(@Param('organizationId') organizationId: string, @Param('projectId') projectId: string) {
    await this.assertProjectInOrganization(organizationId, projectId);
    return this.listTransactions.execute(projectId);
  }

  @Get('traces/:traceId')
  async trace(
    @Param('organizationId') organizationId: string,
    @Param('projectId') projectId: string,
    @Param('traceId') traceId: string,
  ) {
    await this.assertProjectInOrganization(organizationId, projectId);
    return this.getTrace.execute(projectId, traceId);
  }

  private async assertProjectInOrganization(organizationId: string, projectId: string) {
    const project = await this.projects.findById(projectId);
    if (!project || project.organizationId !== organizationId) {
      throw new NotFoundException('Project not found');
    }
  }
}
