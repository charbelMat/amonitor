import { Span } from './span.entity';

export const SPAN_STORE = 'SPAN_STORE';

export interface SpanStore {
  insertMany(spans: Span[]): Promise<void>;
  /** Most recent transactions (root spans) for a project, newest first. */
  listTransactions(projectId: string, limit?: number): Promise<Span[]>;
  /** Every span (including the root transaction) belonging to one trace. */
  listSpansForTrace(projectId: string, traceId: string): Promise<Span[]>;
}
