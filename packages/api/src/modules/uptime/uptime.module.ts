import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { UptimeController } from './uptime.controller';
import { CreateUptimeMonitorUseCase } from './application/create-uptime-monitor.use-case';
import { DeleteUptimeMonitorUseCase } from './application/delete-uptime-monitor.use-case';
import { ListMonitorsWithStatusUseCase } from './application/list-monitors-with-status.use-case';
import { RunUptimeCheckUseCase } from './application/run-uptime-check.use-case';
import { UPTIME_MONITOR_REPOSITORY } from './domain/uptime-monitor-repository.port';
import { UPTIME_CHECK_STORE } from './domain/uptime-check-store.port';
import { UPTIME_SCHEDULER } from './domain/uptime-scheduler.port';
import { TypeOrmUptimeMonitorRepository } from './infrastructure/persistence/typeorm-uptime-monitor.repository';
import { ClickHouseUptimeCheckStore } from './infrastructure/persistence/clickhouse-uptime-check-store';
import { UptimeMonitorOrmEntity } from './infrastructure/persistence/uptime-monitor.orm-entity';
import { NestUptimeScheduler } from './infrastructure/nest-uptime-scheduler';
import { ClickHouseModule } from '../../infrastructure/clickhouse/clickhouse.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { ProjectsModule } from '../projects/projects.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UptimeMonitorOrmEntity]),
    ScheduleModule.forRoot(),
    ClickHouseModule,
    OrganizationsModule,
    ProjectsModule,
    AlertsModule,
  ],
  controllers: [UptimeController],
  providers: [
    CreateUptimeMonitorUseCase,
    DeleteUptimeMonitorUseCase,
    ListMonitorsWithStatusUseCase,
    RunUptimeCheckUseCase,
    { provide: UPTIME_MONITOR_REPOSITORY, useClass: TypeOrmUptimeMonitorRepository },
    { provide: UPTIME_CHECK_STORE, useClass: ClickHouseUptimeCheckStore },
    { provide: UPTIME_SCHEDULER, useClass: NestUptimeScheduler },
  ],
})
export class UptimeModule {}
