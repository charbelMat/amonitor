import { Injectable } from '@nestjs/common';
import { ClickHouseService } from '../../../../infrastructure/clickhouse/clickhouse.service';
import { SpanStore } from '../../domain/span-store.port';
import { Span } from '../../domain/span.entity';

interface SpanRow {
  id: string;
  trace_id: string;
  parent_span_id: string;
  project_id: string;
  transaction_name: string;
  op: string;
  description: string;
  start_time: string;
  end_time: string;
  duration_ms: number;
  is_transaction: number;
}

@Injectable()
export class ClickHouseSpanStore implements SpanStore {
  constructor(private readonly clickhouse: ClickHouseService) {}

  async insertMany(spans: Span[]): Promise<void> {
    await this.clickhouse.insert(
      'spans',
      spans.map((span) => ({
        id: span.id,
        trace_id: span.traceId,
        parent_span_id: span.parentSpanId,
        project_id: span.projectId,
        transaction_name: span.transactionName,
        op: span.op,
        description: span.description,
        start_time: formatClickHouseDateTime(span.startTime),
        end_time: formatClickHouseDateTime(span.endTime),
        duration_ms: span.durationMs,
        is_transaction: span.isTransaction ? 1 : 0,
      })),
    );
  }

  async listTransactions(projectId: string, limit = 50): Promise<Span[]> {
    const rows = await this.clickhouse.query<SpanRow>(
      `SELECT * FROM spans WHERE project_id = {projectId:String} AND is_transaction = 1
       ORDER BY start_time DESC LIMIT {limit:UInt32}`,
      { projectId, limit },
    );
    return rows.map(toDomain);
  }

  async listSpansForTrace(projectId: string, traceId: string): Promise<Span[]> {
    const rows = await this.clickhouse.query<SpanRow>(
      `SELECT * FROM spans WHERE project_id = {projectId:String} AND trace_id = {traceId:String}
       ORDER BY start_time ASC`,
      { projectId, traceId },
    );
    return rows.map(toDomain);
  }
}

function toDomain(row: SpanRow): Span {
  return {
    id: row.id,
    traceId: row.trace_id,
    parentSpanId: row.parent_span_id,
    projectId: row.project_id,
    transactionName: row.transaction_name,
    op: row.op,
    description: row.description,
    startTime: new Date(row.start_time.replace(' ', 'T') + 'Z'),
    endTime: new Date(row.end_time.replace(' ', 'T') + 'Z'),
    durationMs: row.duration_ms,
    isTransaction: row.is_transaction === 1,
  };
}

function formatClickHouseDateTime(date: Date): string {
  return date.toISOString().replace('T', ' ').replace('Z', '');
}
