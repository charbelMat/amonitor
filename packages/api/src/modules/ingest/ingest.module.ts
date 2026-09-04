import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { IngestController } from './ingest.controller';
import { IngestExceptionUseCase } from './application/ingest-exception.use-case';
import { IngestTransactionUseCase } from './application/ingest-transaction.use-case';
import { ProjectKeyGuard } from './infrastructure/project-key.guard';
import { ISSUE_GROUPING_QUEUE } from '../issues/infrastructure/issue-grouping.processor';
import { ProjectsModule } from '../projects/projects.module';
import { PerformanceModule } from '../performance/performance.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: ISSUE_GROUPING_QUEUE }),
    ProjectsModule,
    PerformanceModule,
  ],
  controllers: [IngestController],
  providers: [IngestExceptionUseCase, IngestTransactionUseCase, ProjectKeyGuard],
})
export class IngestModule {}
