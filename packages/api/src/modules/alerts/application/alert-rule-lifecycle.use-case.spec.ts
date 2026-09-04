import { randomUUID } from 'node:crypto';
import { NotFoundException } from '@nestjs/common';
import { CreateAlertRuleUseCase } from './create-alert-rule.use-case';
import { DeleteAlertRuleUseCase } from './delete-alert-rule.use-case';
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

describe('CreateAlertRuleUseCase', () => {
  it('creates an alert rule for a project', async () => {
    const repo = new InMemoryAlertRuleRepository();
    const useCase = new CreateAlertRuleUseCase(repo);

    const rule = await useCase.execute({
      projectId: randomUUID(),
      name: 'notify me',
      trigger: 'issue_created',
      channel: 'email',
      target: 'me@example.com',
    });

    expect(repo.rules).toHaveLength(1);
    expect(rule.channel).toBe('email');
  });
});

describe('DeleteAlertRuleUseCase', () => {
  it('deletes an existing rule', async () => {
    const repo = new InMemoryAlertRuleRepository();
    const rule = await repo.create({
      projectId: randomUUID(),
      name: 'notify me',
      trigger: 'issue_created',
      channel: 'email',
      target: 'me@example.com',
    });
    const useCase = new DeleteAlertRuleUseCase(repo);

    await useCase.execute(rule.id);

    expect(repo.rules).toHaveLength(0);
  });

  it('throws NotFoundException for an unknown rule id', async () => {
    const useCase = new DeleteAlertRuleUseCase(new InMemoryAlertRuleRepository());
    await expect(useCase.execute(randomUUID())).rejects.toThrow(NotFoundException);
  });
});
