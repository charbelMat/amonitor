import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { OrganizationRepository } from '../../domain/organization-repository.port';
import { Organization } from '../../domain/organization.entity';
import { OrganizationOrmEntity } from './organization.orm-entity';
import { OrganizationMemberOrmEntity } from './organization-member.orm-entity';

@Injectable()
export class TypeOrmOrganizationRepository implements OrganizationRepository {
  constructor(
    @InjectRepository(OrganizationOrmEntity)
    private readonly repo: Repository<OrganizationOrmEntity>,
    @InjectRepository(OrganizationMemberOrmEntity)
    private readonly memberRepo: Repository<OrganizationMemberOrmEntity>,
  ) {}

  async create(data: { name: string; slug: string }): Promise<Organization> {
    const entity = this.repo.create(data);
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Organization | null> {
    const entity = await this.repo.findOneBy({ id });
    return entity ? this.toDomain(entity) : null;
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    const entity = await this.repo.findOneBy({ slug });
    return entity ? this.toDomain(entity) : null;
  }

  async findAllForUser(userId: string): Promise<Organization[]> {
    const memberships = await this.memberRepo.find({ where: { userId } });
    if (memberships.length === 0) return [];
    const orgIds = memberships.map((m) => m.organizationId);
    const entities = await this.repo.find({ where: { id: In(orgIds) } });
    return entities.map((e) => this.toDomain(e));
  }

  private toDomain(entity: OrganizationOrmEntity): Organization {
    return { id: entity.id, name: entity.name, slug: entity.slug, createdAt: entity.createdAt };
  }
}
