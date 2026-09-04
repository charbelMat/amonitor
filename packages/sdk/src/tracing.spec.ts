import { Transaction, TransactionPayload } from './tracing';

describe('Transaction', () => {
  it('reports itself and its child spans on finish', () => {
    let reported: TransactionPayload | undefined;
    const txn = new Transaction('GET /orders', 'http.server', (payload) => {
      reported = payload;
    });

    const span = txn.startChild('db.query', 'SELECT * FROM orders');
    span.finish();
    txn.finish();

    expect(reported).toBeDefined();
    expect(reported!.name).toBe('GET /orders');
    expect(reported!.spans).toHaveLength(1);
    expect(reported!.spans[0].op).toBe('db.query');
    expect(reported!.spans[0].parentSpanId).toBe(reported!.id);
  });

  it('only reports once even if finish is called twice', () => {
    let callCount = 0;
    const txn = new Transaction('GET /', 'http.server', () => {
      callCount += 1;
    });

    txn.finish();
    txn.finish();

    expect(callCount).toBe(1);
  });
});
