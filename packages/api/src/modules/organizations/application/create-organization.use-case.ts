import { ConflictException, Inject, Injectable } from '@nestjs/common';
import {
  ORGANIZATION_REPOSITORY,
  OrganizationRepository,
} from '../domain/organization-repository.port';
import {
  ORGANIZATION_MEMBER_REPOSITORY,
  OrganizationMemberRepository,
} from '../domain/organization-member-repository.port';
import { Organization } from '../domain/organization.entity';
import { slugify } from '../../../common/utils/slugify';

export interface CreateOrganizationInput {
  name: string;
  ownerUserId: string;
}

@Injectable()
export class CreateOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY) private readonly organizations: OrganizationRepository,
    @Inject(ORGANIZATION_MEMBER_REPOSITORY)
    private readonly members: OrganizationMemberRepository,
  ) {}

  async execute({ name, ownerUserId }: CreateOrganizationInput): Promise<Organization> {
    const baseSlug = slugify(name);
    let slug = baseSlug;
    let attempt = 0;
    while (await this.organizations.findBySlug(slug)) {
      attempt += 1;
      slug = `${baseSlug}-${attempt}`;
      if (attempt > 20) {
        throw new ConflictException('Could not generate a unique organization slug');
      }
    }

    const organization = await this.organizations.create({ name, slug });
    await this.members.addMember({
      organizationId: organization.id,
      userId: ownerUserId,
      role: 'owner',
    });
    return organization;
  }
}
