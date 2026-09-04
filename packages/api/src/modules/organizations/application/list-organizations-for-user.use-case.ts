import { Inject, Injectable } from '@nestjs/common';
import {
  ORGANIZATION_REPOSITORY,
  OrganizationRepository,
} from '../domain/organization-repository.port';
import { Organization } from '../domain/organization.entity';

@Injectable()
export class ListOrganizationsForUserUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY) private readonly organizations: OrganizationRepository,
  ) {}

  execute(userId: string): Promise<Organization[]> {
    return this.organizations.findAllForUser(userId);
  }
}
