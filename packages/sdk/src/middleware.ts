import { NodeMonitorClient } from './client';
import { Transaction } from './tracing';

export interface RequestLike {
  method: string;
  url: string;
  path?: string;
  route?: { path: string };
  nodeMonitorTransaction?: Transaction;
}

export interface ResponseLike {
  on(event: 'finish', listener: () => void): void;
}

/**
 * Express/Connect-style middleware: wraps each request in a transaction
 * (finished when the response finishes) and exposes it as
 * `req.nodeMonitorTransaction` so route handlers can add child spans, e.g.
 * `req.nodeMonitorTransaction.startChild('db.query', 'SELECT * FROM orders')`.
 */
export function createTracingMiddleware(client: NodeMonitorClient) {
  return function nodeMonitorTracingMiddleware(
    req: RequestLike,
    res: ResponseLike,
    next: () => void,
  ): void {
    const name = `${req.method} ${req.route?.path || req.path || req.url}`;
    const transaction = client.startTransaction(name, 'http.server');
    req.nodeMonitorTransaction = transaction;
    res.on('finish', () => transaction.finish());
    next();
  };
}
