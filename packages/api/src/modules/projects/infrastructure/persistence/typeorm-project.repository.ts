import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProjectData, ProjectRepository } from '../../domain/project-repository.port';
import { Project } from '../../domain/project.entity';
import { ProjectOrmEntity } from './project.orm-entity';

@Injectable()
export class TypeOrmProjectRepository implements ProjectRepository {
  constructor(
    @InjectRepository(ProjectOrmEntity) private readonly repo: Repository<ProjectOrmEntity>,
  ) {}

  async create(data: CreateProjectData): Promise<Project> {
    const entity = this.repo.create(data);
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Project | null> {
    const entity = await this.repo.findOneBy({ id });
    return entity ? this.toDomain(entity) : null;
  }

  async findByDsnKey(dsnKey: string): Promise<Project | null> {
    const entity = await this.repo.findOneBy({ dsnKey });
    return entity ? this.toDomain(entity) : null;
  }

  async findBySlugInOrganization(organizationId: string, slug: string): Promise<Project | null> {
    const entity = await this.repo.findOneBy({ organizationId, slug });
    return entity ? this.toDomain(entity) : null;
  }

  async listForOrganization(organizationId: string): Promise<Project[]> {
    const entities = await this.repo.find({ where: { organizationId }, order: { createdAt: 'ASC' } });
    return entities.map((e) => this.toDomain(e));
  }

  async updateDsnKey(id: string, dsnKey: string): Promise<Project> {
    const entity = await this.repo.findOneBy({ id });
    if (!entity) {
      throw new NotFoundException('Project not found');
    }
    entity.dsnKey = dsnKey;
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  private toDomain(entity: ProjectOrmEntity): Project {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      name: entity.name,
      slug: entity.slug,
      dsnKey: entity.dsnKey,
      createdAt: entity.createdAt,
    };
  }
}
