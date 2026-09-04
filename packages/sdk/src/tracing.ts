import { randomUUID } from 'node:crypto';

export interface SpanPayload {
  id: string;
  parentSpanId: string;
  op: string;
  description: string;
  startTime: number;
  endTime: number;
}

export interface TransactionPayload {
  traceId: string;
  id: string;
  name: string;
  op: string;
  startTime: number;
  endTime: number;
  spans: SpanPayload[];
}

/**
 * A single timed operation within a transaction (e.g. a DB query). Create
 * one via `transaction.startChild(...)`, do the work, then call `finish()`.
 * Spans are one level deep in this SDK — they attach directly to the
 * transaction rather than to each other, which covers the common case
 * (a handful of notable operations per request) without requiring
 * AsyncLocalStorage-based context propagation through arbitrary async code.
 */
export class Span {
  readonly id = randomUUID();
  readonly startTime = Date.now();
  private endTime: number | null = null;

  constructor(
    readonly parentSpanId: string,
    readonly op: string,
    readonly description: string,
  ) {}

  finish(): void {
    if (this.endTime !== null) return;
    this.endTime = Date.now();
  }

  toPayload(): SpanPayload {
    return {
      id: this.id,
      parentSpanId: this.parentSpanId,
      op: this.op,
      description: this.description,
      startTime: this.startTime,
      endTime: this.endTime ?? Date.now(),
    };
  }
}

/**
 * A traced unit of work — typically one HTTP request. Reported to the API
 * as soon as `finish()` is called, along with any child spans started on it.
 */
export class Transaction {
  readonly id = randomUUID();
  readonly traceId = this.id;
  readonly startTime = Date.now();
  private endTime: number | null = null;
  private readonly spans: Span[] = [];

  constructor(
    readonly name: string,
    readonly op: string,
    private readonly onFinish: (payload: TransactionPayload) => void,
  ) {}

  startChild(op: string, description = ''): Span {
    const span = new Span(this.id, op, description);
    this.spans.push(span);
    return span;
  }

  finish(): void {
    if (this.endTime !== null) return;
    this.endTime = Date.now();
    this.onFinish({
      traceId: this.traceId,
      id: this.id,
      name: this.name,
      op: this.op,
      startTime: this.startTime,
      endTime: this.endTime,
      spans: this.spans.map((s) => s.toPayload()),
    });
  }
}
