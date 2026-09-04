import { NodeMonitorClient, NodeMonitorOptions } from './client';
import { createTracingMiddleware } from './middleware';

export { NodeMonitorClient, NodeMonitorOptions };
export { Breadcrumb, BreadcrumbLevel } from './breadcrumbs';
export { Span, Transaction } from './tracing';
export { createTracingMiddleware };

let currentClient: NodeMonitorClient | null = null;

function requireClient(): NodeMonitorClient {
  if (!currentClient) {
    throw new Error('node-monitor: call NodeMonitor.init(options) before using it');
  }
  return currentClient;
}

/**
 * singleton API: `NodeMonitor.init(...)` once at process
 * startup, then `captureException` / `addBreadcrumb` anywhere in the app.
 * For multiple independent clients in one process, use `NodeMonitorClient`
 * directly instead.
 */
export const NodeMonitor = {
  init(options: NodeMonitorOptions): NodeMonitorClient {
    currentClient = new NodeMonitorClient(options);
    return currentClient;
  },
  captureException(error: unknown, extra?: { tags?: Record<string, string> }) {
    return requireClient().captureException(error, extra);
  },
  captureMessage(message: string, level?: 'error' | 'warning' | 'info') {
    return requireClient().captureMessage(message, level);
  },
  addBreadcrumb(breadcrumb: Parameters<NodeMonitorClient['addBreadcrumb']>[0]) {
    return requireClient().addBreadcrumb(breadcrumb);
  },
  startTransaction(name: string, op?: string) {
    return requireClient().startTransaction(name, op);
  },
  /** Express/Connect middleware that wraps each request in a transaction. */
  tracingMiddleware() {
    return createTracingMiddleware(requireClient());
  },
};
