import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ORGANIZATION_MEMBER_REPOSITORY,
  OrganizationMemberRepository,
} from '../domain/organization-member-repository.port';
import { OrganizationMember, OrganizationRole } from '../domain/organization.entity';
import { USER_REPOSITORY, UserRepository } from '../../users/domain/user-repository.port';

export interface AddMemberInput {
  organizationId: string;
  requestingUserId: string;
  targetEmail: string;
  role: OrganizationRole;
}

const ROLES_ALLOWED_TO_INVITE: OrganizationRole[] = ['owner', 'admin'];

@Injectable()
export class AddMemberUseCase {
  constructor(
    @Inject(ORGANIZATION_MEMBER_REPOSITORY)
    private readonly members: OrganizationMemberRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute({
    organizationId,
    requestingUserId,
    targetEmail,
    role,
  }: AddMemberInput): Promise<OrganizationMember> {
    const requestingMembership = await this.members.findMembership(
      organizationId,
      requestingUserId,
    );
    if (!requestingMembership || !ROLES_ALLOWED_TO_INVITE.includes(requestingMembership.role)) {
      throw new ForbiddenException('Only owners or admins can add members');
    }

    const targetUser = await this.users.findByEmail(targetEmail);
    if (!targetUser) {
      throw new NotFoundException(
        `No user with email ${targetEmail} exists yet — they need to sign up first`,
      );
    }

    const existing = await this.members.findMembership(organizationId, targetUser.id);
    if (existing) {
      throw new ConflictException('User is already a member of this organization');
    }

    return this.members.addMember({ organizationId, userId: targetUser.id, role });
  }
}
