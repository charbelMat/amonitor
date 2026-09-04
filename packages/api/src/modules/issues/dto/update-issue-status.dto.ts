import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { IssueStatus } from '../domain/issue.entity';

export class UpdateIssueStatusDto {
  @ApiProperty({ enum: ['unresolved', 'resolved', 'ignored'] })
  @IsIn(['unresolved', 'resolved', 'ignored'])
  status!: IssueStatus;
}
