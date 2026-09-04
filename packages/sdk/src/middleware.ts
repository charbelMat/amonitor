import { AMonitorClient } from './client';
import { Transaction } from './tracing';

export interface RequestLike {
  method: string;
  url: string;
  path?: string;
  route?: { path: string };
  amonitorTransaction?: Transaction;
}

export interface ResponseLike {
  on(event: 'finish', listener: () => void): void;
}

/**
 * Express/Connect-style middleware: wraps each request in a transaction
 * (finished when the response finishes) and exposes it as
 * `req.amonitorTransaction` so route handlers can add child spans, e.g.
 * `req.amonitorTransaction.startChild('db.query', 'SELECT * FROM orders')`.
 */
export function createTracingMiddleware(client: AMonitorClient) {
  return function amonitorTracingMiddleware(
    req: RequestLike,
    res: ResponseLike,
    next: () => void,
  ): void {
    const name = `${req.method} ${req.route?.path || req.path || req.url}`;
    const transaction = client.startTransaction(name, 'http.server');
    req.amonitorTransaction = transaction;
    res.on('finish', () => transaction.finish());
    next();
  };
}
