import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SpanDto {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty()
  @IsString()
  parentSpanId!: string;

  @ApiProperty()
  @IsString()
  op!: string;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiProperty()
  @IsNumber()
  startTime!: number;

  @ApiProperty()
  @IsNumber()
  endTime!: number;
}

export class IngestTransactionDto {
  @ApiProperty()
  @IsString()
  traceId!: string;

  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  op!: string;

  @ApiProperty()
  @IsNumber()
  startTime!: number;

  @ApiProperty()
  @IsNumber()
  endTime!: number;

  @ApiProperty({ type: [SpanDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpanDto)
  spans!: SpanDto[];
}
