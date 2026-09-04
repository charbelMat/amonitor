import { Module } from '@nestjs/common';
import { NodesController } from './nodes.controller';
import { RecordNodeSampleUseCase } from './application/record-node-sample.use-case';
import { ListNodesUseCase } from './application/list-nodes.use-case';
import { GetNodeHistoryUseCase } from './application/get-node-history.use-case';
import { NODE_STORE } from './domain/node-store.port';
import { ClickHouseNodeStore } from './infrastructure/persistence/clickhouse-node-store';
import { ClickHouseModule } from '../../infrastructure/clickhouse/clickhouse.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [ClickHouseModule, OrganizationsModule, ProjectsModule],
  controllers: [NodesController],
  providers: [
    RecordNodeSampleUseCase,
    ListNodesUseCase,
    GetNodeHistoryUseCase,
    { provide: NODE_STORE, useClass: ClickHouseNodeStore },
  ],
  exports: [RecordNodeSampleUseCase],
})
export class NodesModule {}
