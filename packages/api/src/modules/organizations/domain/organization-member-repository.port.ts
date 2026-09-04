import { OrganizationMember, OrganizationRole } from './organization.entity';

export const ORGANIZATION_MEMBER_REPOSITORY = 'ORGANIZATION_MEMBER_REPOSITORY';

export interface OrganizationMemberRepository {
  addMember(data: {
    organizationId: string;
    userId: string;
    role: OrganizationRole;
  }): Promise<OrganizationMember>;
  findMembership(organizationId: string, userId: string): Promise<OrganizationMember | null>;
  listMembers(organizationId: string): Promise<OrganizationMember[]>;
}
