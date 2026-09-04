import { Inject, Injectable } from '@nestjs/common';
import { ALERT_RULE_REPOSITORY, AlertRuleRepository } from '../domain/alert-rule-repository.port';
import { AlertRule, AlertChannel, AlertTrigger } from '../domain/alert-rule.entity';

export interface CreateAlertRuleInput {
  projectId: string;
  name: string;
  trigger: AlertTrigger;
  channel: AlertChannel;
  target: string;
}

@Injectable()
export class CreateAlertRuleUseCase {
  constructor(@Inject(ALERT_RULE_REPOSITORY) private readonly rules: AlertRuleRepository) {}

  execute(input: CreateAlertRuleInput): Promise<AlertRule> {
    return this.rules.create(input);
  }
}
