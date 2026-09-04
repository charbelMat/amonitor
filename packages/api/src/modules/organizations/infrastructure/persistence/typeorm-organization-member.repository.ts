import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationMemberRepository } from '../../domain/organization-member-repository.port';
import { OrganizationMember, OrganizationRole } from '../../domain/organization.entity';
import { OrganizationMemberOrmEntity } from './organization-member.orm-entity';

@Injectable()
export class TypeOrmOrganizationMemberRepository implements OrganizationMemberRepository {
  constructor(
    @InjectRepository(OrganizationMemberOrmEntity)
    private readonly repo: Repository<OrganizationMemberOrmEntity>,
  ) {}

  async addMember(data: {
    organizationId: string;
    userId: string;
    role: OrganizationRole;
  }): Promise<OrganizationMember> {
    const entity = this.repo.create(data);
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async findMembership(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationMember | null> {
    const entity = await this.repo.findOneBy({ organizationId, userId });
    return entity ? this.toDomain(entity) : null;
  }

  async listMembers(organizationId: string): Promise<OrganizationMember[]> {
    const entities = await this.repo.find({ where: { organizationId } });
    return entities.map((e) => this.toDomain(e));
  }

  private toDomain(entity: OrganizationMemberOrmEntity): OrganizationMember {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      userId: entity.userId,
      role: entity.role,
      createdAt: entity.createdAt,
    };
  }
}
