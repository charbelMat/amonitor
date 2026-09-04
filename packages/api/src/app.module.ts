import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './modules/health/health.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { IssuesModule } from './modules/issues/issues.module';
import { PerformanceModule } from './modules/performance/performance.module';
import { UptimeModule } from './modules/uptime/uptime.module';
import { NodesModule } from './modules/nodes/nodes.module';
import { IngestModule } from './modules/ingest/ingest.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    QueueModule,
    HealthModule,
    UsersModule,
    AuthModule,
    AdminModule,
    OrganizationsModule,
    ProjectsModule,
    AlertsModule,
    IssuesModule,
    PerformanceModule,
    UptimeModule,
    NodesModule,
    IngestModule,
  ],
})
export class AppModule {}
