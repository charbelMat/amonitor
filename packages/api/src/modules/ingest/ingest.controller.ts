import { Body, Controller, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { IngestExceptionUseCase } from './application/ingest-exception.use-case';
import { IngestTransactionUseCase } from './application/ingest-transaction.use-case';
import { IngestMetricsUseCase } from './application/ingest-metrics.use-case';
import { IngestExceptionDto } from './dto/ingest-exception.dto';
import { IngestTransactionDto } from './dto/ingest-transaction.dto';
import { IngestMetricsDto } from './dto/ingest-metrics.dto';
import { ProjectKeyGuard } from './infrastructure/project-key.guard';
import { Project } from '../projects/domain/project.entity';

@ApiTags('ingest')
@UseGuards(ProjectKeyGuard)
@Controller('ingest/:projectKey')
export class IngestController {
  constructor(
    private readonly ingestException: IngestExceptionUseCase,
    private readonly ingestTransaction: IngestTransactionUseCase,
    private readonly ingestMetrics: IngestMetricsUseCase,
  ) {}

  @Post('exception')
  @HttpCode(202)
  async exception(@Body() dto: IngestExceptionDto, @Req() req: Request & { project: Project }) {
    await this.ingestException.execute(req.project.id, dto);
    return { accepted: true };
  }

  @Post('transaction')
  @HttpCode(202)
  async transaction(@Body() dto: IngestTransactionDto, @Req() req: Request & { project: Project }) {
    await this.ingestTransaction.execute(req.project.id, dto);
    return { accepted: true };
  }

  @Post('metrics')
  @HttpCode(202)
  async metrics(@Body() dto: IngestMetricsDto, @Req() req: Request & { project: Project }) {
    await this.ingestMetrics.execute(req.project.id, dto);
    return { accepted: true };
  }
}
