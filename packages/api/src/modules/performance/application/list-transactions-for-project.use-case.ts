import { Inject, Injectable } from '@nestjs/common';
import { SPAN_STORE, SpanStore } from '../domain/span-store.port';
import { Span } from '../domain/span.entity';

@Injectable()
export class ListTransactionsForProjectUseCase {
  constructor(@Inject(SPAN_STORE) private readonly spans: SpanStore) {}

  execute(projectId: string, limit = 50): Promise<Span[]> {
    return this.spans.listTransactions(projectId, limit);
  }
}
