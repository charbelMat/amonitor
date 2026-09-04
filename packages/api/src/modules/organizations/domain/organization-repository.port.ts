import { Organization } from './organization.entity';

export const ORGANIZATION_REPOSITORY = 'ORGANIZATION_REPOSITORY';

export interface OrganizationRepository {
  create(data: { name: string; slug: string }): Promise<Organization>;
  findById(id: string): Promise<Organization | null>;
  findBySlug(slug: string): Promise<Organization | null>;
  findAllForUser(userId: string): Promise<Organization[]>;
}
