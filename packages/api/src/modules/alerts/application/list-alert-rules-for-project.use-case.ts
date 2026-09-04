import { Inject, Injectable } from '@nestjs/common';
import { ALERT_RULE_REPOSITORY, AlertRuleRepository } from '../domain/alert-rule-repository.port';
import { AlertRule } from '../domain/alert-rule.entity';

@Injectable()
export class ListAlertRulesForProjectUseCase {
  constructor(@Inject(ALERT_RULE_REPOSITORY) private readonly rules: AlertRuleRepository) {}

  execute(projectId: string): Promise<AlertRule[]> {
    return this.rules.listForProject(projectId);
  }
}
