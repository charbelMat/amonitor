import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsUrl, Max, Min, MinLength } from 'class-validator';

export class CreateUptimeMonitorDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty()
  @IsUrl({ require_tld: false })
  url!: string;

  @ApiProperty({ minimum: 30, maximum: 86400, default: 60 })
  @IsInt()
  @Min(30)
  @Max(86400)
  intervalSeconds!: number;

  @ApiProperty({ default: 200 })
  @IsInt()
  @Min(100)
  @Max(599)
  expectedStatus!: number;
}
