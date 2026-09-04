import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SPAN_STORE, SpanStore } from '../domain/span-store.port';
import { Span } from '../domain/span.entity';

@Injectable()
export class GetTraceUseCase {
  constructor(@Inject(SPAN_STORE) private readonly spans: SpanStore) {}

  async execute(projectId: string, traceId: string): Promise<Span[]> {
    const spans = await this.spans.listSpansForTrace(projectId, traceId);
    if (spans.length === 0) {
      throw new NotFoundException('Trace not found');
    }
    return spans;
  }
}
