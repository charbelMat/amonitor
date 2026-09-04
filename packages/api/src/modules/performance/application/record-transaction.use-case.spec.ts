import { randomUUID } from 'node:crypto';
import { RecordTransactionUseCase } from './record-transaction.use-case';
import { SpanStore } from '../domain/span-store.port';
import { Span } from '../domain/span.entity';

class InMemorySpanStore implements SpanStore {
  rows: Span[] = [];
  async insertMany(spans: Span[]) {
    this.rows.push(...spans);
  }
  async listTransactions(projectId: string) {
    return this.rows.filter((s) => s.projectId === projectId && s.isTransaction);
  }
  async listSpansForTrace(projectId: string, traceId: string) {
    return this.rows.filter((s) => s.projectId === projectId && s.traceId === traceId);
  }
}

describe('RecordTransactionUseCase', () => {
  it('stores the transaction and its spans as rows, marking only the transaction row', async () => {
    const store = new InMemorySpanStore();
    const useCase = new RecordTransactionUseCase(store);
    const projectId = randomUUID();
    const traceId = randomUUID();
    const txnId = randomUUID();

    await useCase.execute({
      projectId,
      traceId,
      id: txnId,
      name: 'GET /orders',
      op: 'http.server',
      startTime: 1000,
      endTime: 1400,
      spans: [
        { id: randomUUID(), parentSpanId: txnId, op: 'db.query', description: 'SELECT *', startTime: 1050, endTime: 1350 },
      ],
    });

    expect(store.rows).toHaveLength(2);
    const [transaction, span] = store.rows;
    expect(transaction.isTransaction).toBe(true);
    expect(transaction.durationMs).toBe(400);
    expect(span.isTransaction).toBe(false);
    expect(span.durationMs).toBe(300);
    expect(span.parentSpanId).toBe(txnId);
  });
});
