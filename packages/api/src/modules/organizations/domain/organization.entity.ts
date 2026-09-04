export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
}

export type OrganizationRole = 'owner' | 'admin' | 'member';

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  createdAt: Date;
}
