import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ALERT_RULE_REPOSITORY, AlertRuleRepository } from '../domain/alert-rule-repository.port';

@Injectable()
export class DeleteAlertRuleUseCase {
  constructor(@Inject(ALERT_RULE_REPOSITORY) private readonly rules: AlertRuleRepository) {}

  async execute(id: string): Promise<void> {
    const rule = await this.rules.findById(id);
    if (!rule) {
      throw new NotFoundException('Alert rule not found');
    }
    await this.rules.delete(id);
  }
}
