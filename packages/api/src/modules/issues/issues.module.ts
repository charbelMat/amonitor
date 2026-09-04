import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { IssuesController } from './issues.controller';
import { ListIssuesForProjectUseCase } from './application/list-issues-for-project.use-case';
import { GetIssueDetailUseCase } from './application/get-issue-detail.use-case';
import { UpdateIssueStatusUseCase } from './application/update-issue-status.use-case';
import { GroupEventIntoIssueUseCase } from './application/group-event-into-issue.use-case';
import { ISSUE_REPOSITORY } from './domain/issue-repository.port';
import { EVENT_STORE } from './domain/event-store.port';
import { TypeOrmIssueRepository } from './infrastructure/persistence/typeorm-issue.repository';
import { ClickHouseEventStore } from './infrastructure/persistence/clickhouse-event-store';
import { IssueOrmEntity } from './infrastructure/persistence/issue.orm-entity';
import { IssueGroupingProcessor, ISSUE_GROUPING_QUEUE } from './infrastructure/issue-grouping.processor';
import { ClickHouseModule } from '../../infrastructure/clickhouse/clickhouse.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { ProjectsModule } from '../projects/projects.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([IssueOrmEntity]),
    BullModule.registerQueue({ name: ISSUE_GROUPING_QUEUE }),
    ClickHouseModule,
    OrganizationsModule,
    ProjectsModule,
    AlertsModule,
  ],
  controllers: [IssuesController],
  providers: [
    ListIssuesForProjectUseCase,
    GetIssueDetailUseCase,
    UpdateIssueStatusUseCase,
    GroupEventIntoIssueUseCase,
    IssueGroupingProcessor,
    { provide: ISSUE_REPOSITORY, useClass: TypeOrmIssueRepository },
    { provide: EVENT_STORE, useClass: ClickHouseEventStore },
  ],
  exports: [BullModule, ISSUE_REPOSITORY, EVENT_STORE],
})
export class IssuesModule {}
