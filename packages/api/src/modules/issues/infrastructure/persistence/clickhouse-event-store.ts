import { Injectable } from '@nestjs/common';
import { ClickHouseService } from '../../../../infrastructure/clickhouse/clickhouse.service';
import { EventStore } from '../../domain/event-store.port';
import { IssueEvent } from '../../domain/event.entity';

interface EventRow {
  id: string;
  project_id: string;
  issue_id: string;
  timestamp: string;
  message: string;
  exception_type: string;
  stack_trace: string;
  level: string;
  environment: string;
  tags: string;
  breadcrumbs: string;
}

@Injectable()
export class ClickHouseEventStore implements EventStore {
  constructor(private readonly clickhouse: ClickHouseService) {}

  async insert(event: IssueEvent): Promise<void> {
    await this.clickhouse.insert('events', [
      {
        id: event.id,
        project_id: event.projectId,
        issue_id: event.issueId,
        timestamp: formatClickHouseDateTime(event.timestamp),
        message: event.message,
        exception_type: event.exceptionType,
        stack_trace: event.stackTrace,
        level: event.level,
        environment: event.environment,
        tags: JSON.stringify(event.tags),
        breadcrumbs: JSON.stringify(event.breadcrumbs),
      },
    ]);
  }

  async listForIssue(issueId: string, limit = 20): Promise<IssueEvent[]> {
    const rows = await this.clickhouse.query<EventRow>(
      `SELECT * FROM events WHERE issue_id = {issueId:String} ORDER BY timestamp DESC LIMIT {limit:UInt32}`,
      { issueId, limit },
    );
    return rows.map((row) => ({
      id: row.id,
      projectId: row.project_id,
      issueId: row.issue_id,
      timestamp: new Date(row.timestamp.replace(' ', 'T') + 'Z'),
      message: row.message,
      exceptionType: row.exception_type,
      stackTrace: row.stack_trace,
      level: row.level as IssueEvent['level'],
      environment: row.environment,
      tags: JSON.parse(row.tags || '{}'),
      breadcrumbs: JSON.parse(row.breadcrumbs || '[]'),
    }));
  }
}

function formatClickHouseDateTime(date: Date): string {
  return date.toISOString().replace('T', ' ').replace('Z', '');
}
