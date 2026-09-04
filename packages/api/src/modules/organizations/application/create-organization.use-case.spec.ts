import { randomUUID } from 'node:crypto';
import { CreateOrganizationUseCase } from './create-organization.use-case';
import { OrganizationRepository } from '../domain/organization-repository.port';
import { OrganizationMemberRepository } from '../domain/organization-member-repository.port';
import { Organization, OrganizationMember } from '../domain/organization.entity';

class InMemoryOrganizationRepository implements OrganizationRepository {
  organizations: Organization[] = [];
  async create(data: { name: string; slug: string }) {
    const org: Organization = { id: randomUUID(), createdAt: new Date(), ...data };
    this.organizations.push(org);
    return org;
  }
  async findById(id: string) {
    return this.organizations.find((o) => o.id === id) ?? null;
  }
  async findBySlug(slug: string) {
    return this.organizations.find((o) => o.slug === slug) ?? null;
  }
  async findAllForUser() {
    return this.organizations;
  }
}

class InMemoryOrganizationMemberRepository implements OrganizationMemberRepository {
  members: OrganizationMember[] = [];
  async addMember(data: { organizationId: string; userId: string; role: 'owner' | 'admin' | 'member' }) {
    const member: OrganizationMember = { id: randomUUID(), createdAt: new Date(), ...data };
    this.members.push(member);
    return member;
  }
  async findMembership(organizationId: string, userId: string) {
    return (
      this.members.find((m) => m.organizationId === organizationId && m.userId === userId) ?? null
    );
  }
  async listMembers(organizationId: string) {
    return this.members.filter((m) => m.organizationId === organizationId);
  }
}

describe('CreateOrganizationUseCase', () => {
  it('creates an organization and makes the creator its owner', async () => {
    const organizations = new InMemoryOrganizationRepository();
    const members = new InMemoryOrganizationMemberRepository();
    const useCase = new CreateOrganizationUseCase(organizations, members);
    const ownerUserId = randomUUID();

    const org = await useCase.execute({ name: 'Acme Inc', ownerUserId });

    expect(org.slug).toBe('acme-inc');
    expect(members.members[0]).toMatchObject({ organizationId: org.id, userId: ownerUserId, role: 'owner' });
  });

  it('disambiguates the slug when it collides with an existing organization', async () => {
    const organizations = new InMemoryOrganizationRepository();
    const members = new InMemoryOrganizationMemberRepository();
    const useCase = new CreateOrganizationUseCase(organizations, members);

    const first = await useCase.execute({ name: 'Acme Inc', ownerUserId: randomUUID() });
    const second = await useCase.execute({ name: 'Acme Inc', ownerUserId: randomUUID() });

    expect(first.slug).toBe('acme-inc');
    expect(second.slug).toBe('acme-inc-1');
  });
});
