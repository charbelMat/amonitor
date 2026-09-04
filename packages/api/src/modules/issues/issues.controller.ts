import { Body, Controller, Get, Inject, NotFoundException, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ListIssuesForProjectUseCase } from './application/list-issues-for-project.use-case';
import { GetIssueDetailUseCase } from './application/get-issue-detail.use-case';
import { UpdateIssueStatusUseCase } from './application/update-issue-status.use-case';
import { UpdateIssueStatusDto } from './dto/update-issue-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrganizationMembershipGuard } from '../organizations/infrastructure/organization-membership.guard';
import { PROJECT_REPOSITORY, ProjectRepository } from '../projects/domain/project-repository.port';

@ApiTags('issues')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, OrganizationMembershipGuard)
@Controller('organizations/:organizationId/projects/:projectId/issues')
export class IssuesController {
  constructor(
    private readonly listIssues: ListIssuesForProjectUseCase,
    private readonly getIssueDetail: GetIssueDetailUseCase,
    private readonly updateIssueStatus: UpdateIssueStatusUseCase,
    @Inject(PROJECT_REPOSITORY) private readonly projects: ProjectRepository,
  ) {}

  @Get()
  async list(@Param('organizationId') organizationId: string, @Param('projectId') projectId: string) {
    await this.assertProjectInOrganization(organizationId, projectId);
    return this.listIssues.execute(projectId);
  }

  @Get(':issueId')
  async detail(
    @Param('organizationId') organizationId: string,
    @Param('projectId') projectId: string,
    @Param('issueId') issueId: string,
  ) {
    await this.assertProjectInOrganization(organizationId, projectId);
    return this.getIssueDetail.execute(issueId);
  }

  @Patch(':issueId/status')
  async updateStatus(
    @Param('organizationId') organizationId: string,
    @Param('projectId') projectId: string,
    @Param('issueId') issueId: string,
    @Body() dto: UpdateIssueStatusDto,
  ) {
    await this.assertProjectInOrganization(organizationId, projectId);
    return this.updateIssueStatus.execute(issueId, dto.status);
  }

  private async assertProjectInOrganization(organizationId: string, projectId: string) {
    const project = await this.projects.findById(projectId);
    if (!project || project.organizationId !== organizationId) {
      throw new NotFoundException('Project not found');
    }
  }
}
