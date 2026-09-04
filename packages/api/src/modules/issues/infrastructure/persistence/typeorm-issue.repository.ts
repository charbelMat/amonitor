import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateIssueData, IssueRepository } from '../../domain/issue-repository.port';
import { Issue, IssueStatus } from '../../domain/issue.entity';
import { IssueOrmEntity } from './issue.orm-entity';

@Injectable()
export class TypeOrmIssueRepository implements IssueRepository {
  constructor(
    @InjectRepository(IssueOrmEntity) private readonly repo: Repository<IssueOrmEntity>,
  ) {}

  async create(data: CreateIssueData): Promise<Issue> {
    const entity = this.repo.create({ ...data, status: 'unresolved', eventCount: 1 });
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Issue | null> {
    const entity = await this.repo.findOneBy({ id });
    return entity ? this.toDomain(entity) : null;
  }

  async findByFingerprint(projectId: string, fingerprint: string): Promise<Issue | null> {
    const entity = await this.repo.findOneBy({ projectId, fingerprint });
    return entity ? this.toDomain(entity) : null;
  }

  async recordOccurrence(id: string, timestamp: Date): Promise<Issue> {
    const entity = await this.repo.findOneBy({ id });
    if (!entity) {
      throw new NotFoundException('Issue not found');
    }
    entity.eventCount += 1;
    if (timestamp > entity.lastSeen) {
      entity.lastSeen = timestamp;
    }
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async updateStatus(id: string, status: IssueStatus): Promise<Issue> {
    const entity = await this.repo.findOneBy({ id });
    if (!entity) {
      throw new NotFoundException('Issue not found');
    }
    entity.status = status;
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async listForProject(projectId: string): Promise<Issue[]> {
    const entities = await this.repo.find({ where: { projectId }, order: { lastSeen: 'DESC' } });
    return entities.map((e) => this.toDomain(e));
  }

  private toDomain(entity: IssueOrmEntity): Issue {
    return {
      id: entity.id,
      projectId: entity.projectId,
      fingerprint: entity.fingerprint,
      title: entity.title,
      level: entity.level,
      status: entity.status,
      firstSeen: entity.firstSeen,
      lastSeen: entity.lastSeen,
      eventCount: entity.eventCount,
    };
  }
}
