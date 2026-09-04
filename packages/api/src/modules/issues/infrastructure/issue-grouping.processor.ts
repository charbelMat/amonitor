import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { GroupEventIntoIssueUseCase } from '../application/group-event-into-issue.use-case';
import { EVENT_STORE, EventStore } from '../domain/event-store.port';
import { RawBreadcrumb } from '../domain/event.entity';
import { IssueLevel } from '../domain/issue.entity';

export const ISSUE_GROUPING_QUEUE = 'issue-grouping';

export interface IngestExceptionJob {
  eventId: string;
  projectId: string;
  exceptionType: string;
  stack: string;
  message: string;
  level: IssueLevel;
  environment: string;
  tags: Record<string, string>;
  breadcrumbs: RawBreadcrumb[];
  timestamp: string;
}

@Processor(ISSUE_GROUPING_QUEUE)
export class IssueGroupingProcessor extends WorkerHost {
  constructor(
    private readonly groupEvent: GroupEventIntoIssueUseCase,
    @Inject(EVENT_STORE) private readonly events: EventStore,
  ) {
    super();
  }

  async process(job: Job<IngestExceptionJob>): Promise<void> {
    const data = job.data;
    const timestamp = new Date(data.timestamp);

    const issue = await this.groupEvent.execute({
      projectId: data.projectId,
      exceptionType: data.exceptionType,
      stack: data.stack,
      message: data.message,
      level: data.level,
      timestamp,
    });

    await this.events.insert({
      id: data.eventId,
      projectId: data.projectId,
      issueId: issue.id,
      timestamp,
      message: data.message,
      exceptionType: data.exceptionType,
      stackTrace: data.stack,
      level: data.level,
      environment: data.environment,
      tags: data.tags,
      breadcrumbs: data.breadcrumbs,
    });
  }
}
