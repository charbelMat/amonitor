import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNumber, IsString, Max, MaxLength, Min } from 'class-validator';

export class IngestMetricsDto {
  @ApiProperty()
  @IsNumber()
  timestamp!: number;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  instanceId!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  hostname!: string;

  @ApiProperty()
  @IsInt()
  pid!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  uptimeSec!: number;

  @ApiProperty({ description: 'Percentage of total machine CPU capacity (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  cpuPercent!: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  cpuCount!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  loadAvg1!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  memRssBytes!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  memHeapUsedBytes!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  memHeapTotalBytes!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  systemMemTotalBytes!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  systemMemFreeBytes!: number;

  @ApiProperty()
  @IsBoolean()
  networkSupported!: boolean;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  netRxBytesPerSec!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  netTxBytesPerSec!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  eventLoopLagMs!: number;
}
