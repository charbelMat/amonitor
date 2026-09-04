import { Body, Controller, Delete, Get, NotFoundException, Param, Post, UseGuards, Inject } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateAlertRuleUseCase } from './application/create-alert-rule.use-case';
import { ListAlertRulesForProjectUseCase } from './application/list-alert-rules-for-project.use-case';
import { DeleteAlertRuleUseCase } from './application/delete-alert-rule.use-case';
import { CreateAlertRuleDto } from './dto/create-alert-rule.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrganizationMembershipGuard } from '../organizations/infrastructure/organization-membership.guard';
import { PROJECT_REPOSITORY, ProjectRepository } from '../projects/domain/project-repository.port';

@ApiTags('alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, OrganizationMembershipGuard)
@Controller('organizations/:organizationId/projects/:projectId/alert-rules')
export class AlertsController {
  constructor(
    private readonly createAlertRule: CreateAlertRuleUseCase,
    private readonly listAlertRules: ListAlertRulesForProjectUseCase,
    private readonly deleteAlertRule: DeleteAlertRuleUseCase,
    @Inject(PROJECT_REPOSITORY) private readonly projects: ProjectRepository,
  ) {}

  @Get()
  async list(@Param('organizationId') organizationId: string, @Param('projectId') projectId: string) {
    await this.assertProjectInOrganization(organizationId, projectId);
    return this.listAlertRules.execute(projectId);
  }

  @Post()
  async create(
    @Param('organizationId') organizationId: string,
    @Param('projectId') projectId: string,
    @Body() dto: CreateAlertRuleDto,
  ) {
    await this.assertProjectInOrganization(organizationId, projectId);
    return this.createAlertRule.execute({ projectId, ...dto });
  }

  @Delete(':ruleId')
  async delete(
    @Param('organizationId') organizationId: string,
    @Param('projectId') projectId: string,
    @Param('ruleId') ruleId: string,
  ) {
    await this.assertProjectInOrganization(organizationId, projectId);
    await this.deleteAlertRule.execute(ruleId);
    return { deleted: true };
  }

  private async assertProjectInOrganization(organizationId: string, projectId: string) {
    const project = await this.projects.findById(projectId);
    if (!project || project.organizationId !== organizationId) {
      throw new NotFoundException('Project not found');
    }
  }
}
