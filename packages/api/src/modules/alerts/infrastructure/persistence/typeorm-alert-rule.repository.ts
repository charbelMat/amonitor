import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AlertRuleRepository,
  CreateAlertRuleData,
} from '../../domain/alert-rule-repository.port';
import { AlertRule, AlertTrigger } from '../../domain/alert-rule.entity';
import { AlertRuleOrmEntity } from './alert-rule.orm-entity';

@Injectable()
export class TypeOrmAlertRuleRepository implements AlertRuleRepository {
  constructor(
    @InjectRepository(AlertRuleOrmEntity) private readonly repo: Repository<AlertRuleOrmEntity>,
  ) {}

  async create(data: CreateAlertRuleData): Promise<AlertRule> {
    const entity = this.repo.create(data);
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<AlertRule | null> {
    const entity = await this.repo.findOneBy({ id });
    return entity ? this.toDomain(entity) : null;
  }

  async listForProject(projectId: string): Promise<AlertRule[]> {
    const entities = await this.repo.find({ where: { projectId }, order: { createdAt: 'DESC' } });
    return entities.map((e) => this.toDomain(e));
  }

  async listForProjectAndTrigger(projectId: string, trigger: AlertTrigger): Promise<AlertRule[]> {
    const entities = await this.repo.find({ where: { projectId, trigger } });
    return entities.map((e) => this.toDomain(e));
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete({ id });
  }

  private toDomain(entity: AlertRuleOrmEntity): AlertRule {
    return {
      id: entity.id,
      projectId: entity.projectId,
      name: entity.name,
      trigger: entity.trigger,
      channel: entity.channel,
      target: entity.target,
      createdAt: entity.createdAt,
    };
  }
}
