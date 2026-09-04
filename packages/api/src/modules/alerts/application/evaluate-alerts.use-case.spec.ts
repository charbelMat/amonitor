import { randomUUID } from 'node:crypto';
import { EvaluateAlertsUseCase } from './evaluate-alerts.use-case';
import { AlertRuleRepository, CreateAlertRuleData } from '../domain/alert-rule-repository.port';
import { AlertRule, AlertTrigger } from '../domain/alert-rule.entity';

class InMemoryAlertRuleRepository implements AlertRuleRepository {
  rules: AlertRule[] = [];
  async create(data: CreateAlertRuleData) {
    const rule: AlertRule = { id: randomUUID(), createdAt: new Date(), ...data };
    this.rules.push(rule);
    return rule;
  }
  async findById(id: string) {
    return this.rules.find((r) => r.id === id) ?? null;
  }
  async listForProject(projectId: string) {
    return this.rules.filter((r) => r.projectId === projectId);
  }
  async listForProjectAndTrigger(projectId: string, trigger: AlertTrigger) {
    return this.rules.filter((r) => r.projectId === projectId && r.trigger === trigger);
  }
  async delete(id: string) {
    this.rules = this.rules.filter((r) => r.id !== id);
  }
}

describe('EvaluateAlertsUseCase', () => {
  it('enqueues one dispatch job per matching rule and ignores non-matching triggers', async () => {
    const projectId = randomUUID();
    const rules = new InMemoryAlertRuleRepository();
    await rules.create({ projectId, name: 'email me', trigger: 'issue_created', channel: 'email', target: 'a@b.com' });
    await rules.create({ projectId, name: 'webhook me', trigger: 'issue_created', channel: 'webhook', target: 'https://x.com/hook' });
    await rules.create({ projectId, name: 'uptime rule', trigger: 'uptime_down', channel: 'email', target: 'a@b.com' });

    const queue = { add: jest.fn() };
    const useCase = new EvaluateAlertsUseCase(rules, queue as any);

    await useCase.execute({ projectId, trigger: 'issue_created', subject: 'subj', message: 'msg' });

    expect(queue.add).toHaveBeenCalledTimes(2);
    expect(queue.add).toHaveBeenCalledWith(
      'dispatch-alert',
      expect.objectContaining({ channel: 'email', target: 'a@b.com', subject: 'subj' }),
    );
    expect(queue.add).toHaveBeenCalledWith(
      'dispatch-alert',
      expect.objectContaining({ channel: 'webhook', target: 'https://x.com/hook' }),
    );
  });
});
