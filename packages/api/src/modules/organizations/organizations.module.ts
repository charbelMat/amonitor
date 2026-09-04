import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsController } from './organizations.controller';
import { CreateOrganizationUseCase } from './application/create-organization.use-case';
import { ListOrganizationsForUserUseCase } from './application/list-organizations-for-user.use-case';
import { AddMemberUseCase } from './application/add-member.use-case';
import { ORGANIZATION_REPOSITORY } from './domain/organization-repository.port';
import { ORGANIZATION_MEMBER_REPOSITORY } from './domain/organization-member-repository.port';
import { TypeOrmOrganizationRepository } from './infrastructure/persistence/typeorm-organization.repository';
import { TypeOrmOrganizationMemberRepository } from './infrastructure/persistence/typeorm-organization-member.repository';
import { OrganizationOrmEntity } from './infrastructure/persistence/organization.orm-entity';
import { OrganizationMemberOrmEntity } from './infrastructure/persistence/organization-member.orm-entity';
import { OrganizationMembershipGuard } from './infrastructure/organization-membership.guard';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrganizationOrmEntity, OrganizationMemberOrmEntity]),
    UsersModule,
  ],
  controllers: [OrganizationsController],
  providers: [
    CreateOrganizationUseCase,
    ListOrganizationsForUserUseCase,
    AddMemberUseCase,
    OrganizationMembershipGuard,
    { provide: ORGANIZATION_REPOSITORY, useClass: TypeOrmOrganizationRepository },
    { provide: ORGANIZATION_MEMBER_REPOSITORY, useClass: TypeOrmOrganizationMemberRepository },
  ],
  exports: [
    CreateOrganizationUseCase,
    ORGANIZATION_MEMBER_REPOSITORY,
    ORGANIZATION_REPOSITORY,
    OrganizationMembershipGuard,
  ],
})
export class OrganizationsModule {}
