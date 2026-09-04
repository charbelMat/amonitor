import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn } from 'class-validator';
import { OrganizationRole } from '../domain/organization.entity';

export class AddMemberDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: ['admin', 'member'] })
  @IsIn(['admin', 'member'])
  role!: Exclude<OrganizationRole, 'owner'>;
}
