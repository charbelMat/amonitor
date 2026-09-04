import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateOrganizationUseCase } from './application/create-organization.use-case';
import { ListOrganizationsForUserUseCase } from './application/list-organizations-for-user.use-case';
import { AddMemberUseCase } from './application/add-member.use-case';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../auth/infrastructure/jwt.strategy';
import { OrganizationMembershipGuard } from './infrastructure/organization-membership.guard';

@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(
    private readonly createOrganization: CreateOrganizationUseCase,
    private readonly listOrganizations: ListOrganizationsForUserUseCase,
    private readonly addMember: AddMemberUseCase,
  ) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.listOrganizations.execute(user.id);
  }

  @Post()
  create(@Body() dto: CreateOrganizationDto, @CurrentUser() user: RequestUser) {
    return this.createOrganization.execute({ name: dto.name, ownerUserId: user.id });
  }

  @Post(':organizationId/members')
  @UseGuards(OrganizationMembershipGuard)
  addMemberHandler(
    @Param('organizationId') organizationId: string,
    @Body() dto: AddMemberDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.addMember.execute({
      organizationId,
      requestingUserId: user.id,
      targetEmail: dto.email,
      role: dto.role,
    });
  }
}
