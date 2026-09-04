import { Module } from '@nestjs/common';
import { PerformanceController } from './performance.controller';
import { RecordTransactionUseCase } from './application/record-transaction.use-case';
import { ListTransactionsForProjectUseCase } from './application/list-transactions-for-project.use-case';
import { GetTraceUseCase } from './application/get-trace.use-case';
import { SPAN_STORE } from './domain/span-store.port';
import { ClickHouseSpanStore } from './infrastructure/persistence/clickhouse-span-store';
import { ClickHouseModule } from '../../infrastructure/clickhouse/clickhouse.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [ClickHouseModule, OrganizationsModule, ProjectsModule],
  controllers: [PerformanceController],
  providers: [
    RecordTransactionUseCase,
    ListTransactionsForProjectUseCase,
    GetTraceUseCase,
    { provide: SPAN_STORE, useClass: ClickHouseSpanStore },
  ],
  exports: [RecordTransactionUseCase],
})
export class PerformanceModule {}
