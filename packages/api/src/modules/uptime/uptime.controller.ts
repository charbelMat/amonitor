import { Body, Controller, Delete, Get, Inject, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateUptimeMonitorUseCase } from './application/create-uptime-monitor.use-case';
import { DeleteUptimeMonitorUseCase } from './application/delete-uptime-monitor.use-case';
import { ListMonitorsWithStatusUseCase } from './application/list-monitors-with-status.use-case';
import { CreateUptimeMonitorDto } from './dto/create-uptime-monitor.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrganizationMembershipGuard } from '../organizations/infrastructure/organization-membership.guard';
import { PROJECT_REPOSITORY, ProjectRepository } from '../projects/domain/project-repository.port';

@ApiTags('uptime')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, OrganizationMembershipGuard)
@Controller('organizations/:organizationId/projects/:projectId/uptime-monitors')
export class UptimeController {
  constructor(
    private readonly createMonitor: CreateUptimeMonitorUseCase,
    private readonly deleteMonitor: DeleteUptimeMonitorUseCase,
    private readonly listMonitors: ListMonitorsWithStatusUseCase,
    @Inject(PROJECT_REPOSITORY) private readonly projects: ProjectRepository,
  ) {}

  @Get()
  async list(@Param('organizationId') organizationId: string, @Param('projectId') projectId: string) {
    await this.assertProjectInOrganization(organizationId, projectId);
    return this.listMonitors.execute(projectId);
  }

  @Post()
  async create(
    @Param('organizationId') organizationId: string,
    @Param('projectId') projectId: string,
    @Body() dto: CreateUptimeMonitorDto,
  ) {
    await this.assertProjectInOrganization(organizationId, projectId);
    return this.createMonitor.execute({ projectId, ...dto });
  }

  @Delete(':monitorId')
  async delete(
    @Param('organizationId') organizationId: string,
    @Param('projectId') projectId: string,
    @Param('monitorId') monitorId: string,
  ) {
    await this.assertProjectInOrganization(organizationId, projectId);
    await this.deleteMonitor.execute(monitorId);
    return { deleted: true };
  }

  private async assertProjectInOrganization(organizationId: string, projectId: string) {
    const project = await this.projects.findById(projectId);
    if (!project || project.organizationId !== organizationId) {
      throw new NotFoundException('Project not found');
    }
  }
}
