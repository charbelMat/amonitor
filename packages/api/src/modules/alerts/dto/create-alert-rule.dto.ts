import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsString, IsUrl, MinLength, ValidateIf } from 'class-validator';
import { AlertChannel, AlertTrigger } from '../domain/alert-rule.entity';

export class CreateAlertRuleDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ enum: ['issue_created', 'uptime_down'] })
  @IsIn(['issue_created', 'uptime_down'])
  trigger!: AlertTrigger;

  @ApiProperty({ enum: ['email', 'webhook'] })
  @IsIn(['email', 'webhook'])
  channel!: AlertChannel;

  @ApiProperty({ description: 'Email address (channel=email) or URL (channel=webhook)' })
  @ValidateIf((o) => o.channel === 'email')
  @IsEmail()
  @ValidateIf((o) => o.channel === 'webhook')
  @IsUrl({ require_tld: false })
  target!: string;
}
