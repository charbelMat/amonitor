import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsController } from './projects.controller';
import { CreateProjectUseCase } from './application/create-project.use-case';
import { ListProjectsForOrganizationUseCase } from './application/list-projects-for-organization.use-case';
import { RotateProjectKeyUseCase } from './application/rotate-project-key.use-case';
import { PROJECT_REPOSITORY } from './domain/project-repository.port';
import { TypeOrmProjectRepository } from './infrastructure/persistence/typeorm-project.repository';
import { ProjectOrmEntity } from './infrastructure/persistence/project.orm-entity';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectOrmEntity]), OrganizationsModule],
  controllers: [ProjectsController],
  providers: [
    CreateProjectUseCase,
    ListProjectsForOrganizationUseCase,
    RotateProjectKeyUseCase,
    { provide: PROJECT_REPOSITORY, useClass: TypeOrmProjectRepository },
  ],
  exports: [PROJECT_REPOSITORY],
})
export class ProjectsModule {}
