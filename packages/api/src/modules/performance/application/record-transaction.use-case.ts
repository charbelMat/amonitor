import { Inject, Injectable } from '@nestjs/common';
import { SPAN_STORE, SpanStore } from '../domain/span-store.port';
import { Span } from '../domain/span.entity';

export interface RecordTransactionInput {
  projectId: string;
  traceId: string;
  id: string;
  name: string;
  op: string;
  startTime: number;
  endTime: number;
  spans: Array<{
    id: string;
    parentSpanId: string;
    op: string;
    description: string;
    startTime: number;
    endTime: number;
  }>;
}

@Injectable()
export class RecordTransactionUseCase {
  constructor(@Inject(SPAN_STORE) private readonly spans: SpanStore) {}

  async execute(input: RecordTransactionInput): Promise<void> {
    const rows: Span[] = [
      {
        id: input.id,
        traceId: input.traceId,
        parentSpanId: '',
        projectId: input.projectId,
        transactionName: input.name,
        op: input.op,
        description: input.name,
        startTime: new Date(input.startTime),
        endTime: new Date(input.endTime),
        durationMs: input.endTime - input.startTime,
        isTransaction: true,
      },
      ...input.spans.map((span) => ({
        id: span.id,
        traceId: input.traceId,
        parentSpanId: span.parentSpanId,
        projectId: input.projectId,
        transactionName: input.name,
        op: span.op,
        description: span.description,
        startTime: new Date(span.startTime),
        endTime: new Date(span.endTime),
        durationMs: span.endTime - span.startTime,
        isTransaction: false,
      })),
    ];

    await this.spans.insertMany(rows);
  }
}
