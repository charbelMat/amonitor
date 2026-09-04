import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNumber, IsObject, IsOptional, IsString, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

class BreadcrumbDto {
  @ApiProperty()
  @IsNumber()
  timestamp!: number;

  @ApiProperty()
  @IsString()
  category!: string;

  @ApiProperty()
  @IsString()
  message!: string;

  @ApiProperty()
  @IsString()
  level!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}

export class IngestExceptionDto {
  @ApiProperty()
  @IsNumber()
  timestamp!: number;

  @ApiProperty()
  @IsString()
  message!: string;

  @ApiProperty()
  @IsString()
  exceptionType!: string;

  @ApiProperty()
  @IsString()
  stack!: string;

  @ApiProperty({ enum: ['error', 'warning', 'info'] })
  @IsIn(['error', 'warning', 'info'])
  level!: 'error' | 'warning' | 'info';

  @ApiProperty()
  @IsString()
  environment!: string;

  @ApiProperty()
  @IsObject()
  tags!: Record<string, string>;

  @ApiProperty({ type: [BreadcrumbDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BreadcrumbDto)
  breadcrumbs!: BreadcrumbDto[];
}
