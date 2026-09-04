import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';
import { ISSUE_GROUPING_QUEUE, IngestExceptionJob } from '../../issues/infrastructure/issue-grouping.processor';
import { IngestExceptionDto } from '../dto/ingest-exception.dto';

@Injectable()
export class IngestExceptionUseCase {
  constructor(@InjectQueue(ISSUE_GROUPING_QUEUE) private readonly queue: Queue<IngestExceptionJob>) {}

  async execute(projectId: string, dto: IngestExceptionDto): Promise<void> {
    await this.queue.add('group-event', {
      eventId: randomUUID(),
      projectId,
      exceptionType: dto.exceptionType,
      stack: dto.stack,
      message: dto.message,
      level: dto.level,
      environment: dto.environment,
      tags: dto.tags,
      breadcrumbs: dto.breadcrumbs,
      timestamp: new Date(dto.timestamp).toISOString(),
    });
  }
}
