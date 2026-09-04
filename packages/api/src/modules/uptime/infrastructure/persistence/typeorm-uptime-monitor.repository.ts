import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateUptimeMonitorData,
  UptimeMonitorRepository,
} from '../../domain/uptime-monitor-repository.port';
import { UptimeMonitor } from '../../domain/uptime-monitor.entity';
import { UptimeMonitorOrmEntity } from './uptime-monitor.orm-entity';

@Injectable()
export class TypeOrmUptimeMonitorRepository implements UptimeMonitorRepository {
  constructor(
    @InjectRepository(UptimeMonitorOrmEntity)
    private readonly repo: Repository<UptimeMonitorOrmEntity>,
  ) {}

  async create(data: CreateUptimeMonitorData): Promise<UptimeMonitor> {
    const entity = this.repo.create(data);
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<UptimeMonitor | null> {
    const entity = await this.repo.findOneBy({ id });
    return entity ? this.toDomain(entity) : null;
  }

  async listForProject(projectId: string): Promise<UptimeMonitor[]> {
    const entities = await this.repo.find({ where: { projectId }, order: { createdAt: 'DESC' } });
    return entities.map((e) => this.toDomain(e));
  }

  async listAll(): Promise<UptimeMonitor[]> {
    const entities = await this.repo.find();
    return entities.map((e) => this.toDomain(e));
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete({ id });
  }

  private toDomain(entity: UptimeMonitorOrmEntity): UptimeMonitor {
    return {
      id: entity.id,
      projectId: entity.projectId,
      name: entity.name,
      url: entity.url,
      intervalSeconds: entity.intervalSeconds,
      expectedStatus: entity.expectedStatus,
      createdAt: entity.createdAt,
    };
  }
}
