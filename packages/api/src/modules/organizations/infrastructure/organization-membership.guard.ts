import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import {
  ORGANIZATION_MEMBER_REPOSITORY,
  OrganizationMemberRepository,
} from '../domain/organization-member-repository.port';

/**
 * Requires the authenticated user to be a member of the organization named
 * by the `:organizationId` route param. Attaches the membership to the
 * request so handlers can check `req.membership.role` without a second query.
 */
@Injectable()
export class OrganizationMembershipGuard implements CanActivate {
  constructor(
    @Inject(ORGANIZATION_MEMBER_REPOSITORY)
    private readonly members: OrganizationMemberRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const organizationId = request.params?.organizationId;
    const userId = request.user?.id;

    if (!organizationId || !userId) {
      throw new ForbiddenException('Not a member of this organization');
    }

    const membership = await this.members.findMembership(organizationId, userId);
    if (!membership) {
      throw new ForbiddenException('Not a member of this organization');
    }

    request.membership = membership;
    return true;
  }
}
