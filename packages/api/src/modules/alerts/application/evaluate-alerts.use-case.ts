import { Inject, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ALERT_RULE_REPOSITORY, AlertRuleRepository } from '../domain/alert-rule-repository.port';
import { AlertTrigger } from '../domain/alert-rule.entity';
import { ALERT_DISPATCH_QUEUE, AlertDispatchJob } from '../infrastructure/alert-dispatch.processor';

export interface EvaluateAlertsInput {
  projectId: string;
  trigger: AlertTrigger;
  subject: string;
  message: string;
}

/**
 * Called by other modules whenever something alert-worthy happens (a new
 * issue, an uptime check failing). Looks up matching rules for the project
 * and enqueues one delivery job per rule — kept decoupled from delivery
 * mechanics (email/webhook), which live in the BullMQ processor.
 */
@Injectable()
export class EvaluateAlertsUseCase {
  constructor(
    @Inject(ALERT_RULE_REPOSITORY) private readonly rules: AlertRuleRepository,
    @InjectQueue(ALERT_DISPATCH_QUEUE) private readonly queue: Queue<AlertDispatchJob>,
  ) {}

  async execute({ projectId, trigger, subject, message }: EvaluateAlertsInput): Promise<void> {
    const matchingRules = await this.rules.listForProjectAndTrigger(projectId, trigger);

    await Promise.all(
      matchingRules.map((rule) =>
        this.queue.add('dispatch-alert', {
          channel: rule.channel,
          target: rule.target,
          subject,
          message,
        }),
      ),
    );
  }
}
