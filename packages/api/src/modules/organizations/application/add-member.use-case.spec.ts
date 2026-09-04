import { randomUUID } from 'node:crypto';
import { AddMemberUseCase } from './add-member.use-case';
import { OrganizationMemberRepository } from '../domain/organization-member-repository.port';
import { OrganizationMember } from '../domain/organization.entity';
import { InMemoryUserRepository, makeUser } from '../../users/test/in-memory-user-repository';

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

describe('AddMemberUseCase', () => {
  const orgId = randomUUID();
  const owner = makeUser({ email: 'owner@x.com', name: 'Owner' });
  const invitee = makeUser({ email: 'invitee@x.com', name: 'Invitee' });

  function setup() {
    const members = new InMemoryOrganizationMemberRepository();
    members.members.push({ id: randomUUID(), organizationId: orgId, userId: owner.id, role: 'owner', createdAt: new Date() });
    const users = new InMemoryUserRepository([owner, invitee]);
    return { members, users, useCase: new AddMemberUseCase(members, users) };
  }

  it('allows an owner to add a registered user as a member', async () => {
    const { useCase, members } = setup();
    const membership = await useCase.execute({
      organizationId: orgId,
      requestingUserId: owner.id,
      targetEmail: invitee.email,
      role: 'member',
    });
    expect(membership.userId).toBe(invitee.id);
    expect(members.members).toHaveLength(2);
  });

  it('rejects a non-member trying to add someone', async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({
        organizationId: orgId,
        requestingUserId: randomUUID(),
        targetEmail: invitee.email,
        role: 'member',
      }),
    ).rejects.toThrow('Only owners or admins can add members');
  });

  it('rejects inviting an email with no account', async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({
        organizationId: orgId,
        requestingUserId: owner.id,
        targetEmail: 'nobody@x.com',
        role: 'member',
      }),
    ).rejects.toThrow(/no user with email/i);
  });
});
