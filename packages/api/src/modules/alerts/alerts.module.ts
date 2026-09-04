import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { AlertsController } from './alerts.controller';
import { CreateAlertRuleUseCase } from './application/create-alert-rule.use-case';
import { ListAlertRulesForProjectUseCase } from './application/list-alert-rules-for-project.use-case';
import { DeleteAlertRuleUseCase } from './application/delete-alert-rule.use-case';
import { EvaluateAlertsUseCase } from './application/evaluate-alerts.use-case';
import { ALERT_RULE_REPOSITORY } from './domain/alert-rule-repository.port';
import { ALERT_SENDER } from './domain/alert-sender.port';
import { TypeOrmAlertRuleRepository } from './infrastructure/persistence/typeorm-alert-rule.repository';
import { AlertRuleOrmEntity } from './infrastructure/persistence/alert-rule.orm-entity';
import { CompositeAlertSender } from './infrastructure/composite-alert-sender';
import { AlertDispatchProcessor, ALERT_DISPATCH_QUEUE } from './infrastructure/alert-dispatch.processor';
import { OrganizationsModule } from '../organizations/organizations.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AlertRuleOrmEntity]),
    BullModule.registerQueue({ name: ALERT_DISPATCH_QUEUE }),
    OrganizationsModule,
    ProjectsModule,
  ],
  controllers: [AlertsController],
  providers: [
    CreateAlertRuleUseCase,
    ListAlertRulesForProjectUseCase,
    DeleteAlertRuleUseCase,
    EvaluateAlertsUseCase,
    AlertDispatchProcessor,
    { provide: ALERT_RULE_REPOSITORY, useClass: TypeOrmAlertRuleRepository },
    { provide: ALERT_SENDER, useClass: CompositeAlertSender },
  ],
  exports: [BullModule, EvaluateAlertsUseCase],
})
export class AlertsModule {}
