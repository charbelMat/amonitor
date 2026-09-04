import { AMonitorClient, AMonitorOptions } from './client';
import { createTracingMiddleware } from './middleware';

export { AMonitorClient, AMonitorOptions };
export { Breadcrumb, BreadcrumbLevel } from './breadcrumbs';
export { Span, Transaction } from './tracing';
export { MetricsCollector, type MetricsPayload } from './metrics';
export { createTracingMiddleware };

let currentClient: AMonitorClient | null = null;

function requireClient(): AMonitorClient {
  if (!currentClient) {
    throw new Error('amonitor: call AMonitor.init(options) before using it');
  }
  return currentClient;
}

/**
 * singleton API: `AMonitor.init(...)` once at process
 * startup, then `captureException` / `addBreadcrumb` anywhere in the app.
 * For multiple independent clients in one process, use `AMonitorClient`
 * directly instead.
 */
export const AMonitor = {
  init(options: AMonitorOptions): AMonitorClient {
    currentClient = new AMonitorClient(options);
    return currentClient;
  },
  captureException(error: unknown, extra?: { tags?: Record<string, string> }) {
    return requireClient().captureException(error, extra);
  },
  captureMessage(message: string, level?: 'error' | 'warning' | 'info') {
    return requireClient().captureMessage(message, level);
  },
  addBreadcrumb(breadcrumb: Parameters<AMonitorClient['addBreadcrumb']>[0]) {
    return requireClient().addBreadcrumb(breadcrumb);
  },
  startTransaction(name: string, op?: string) {
    return requireClient().startTransaction(name, op);
  },
  /** Express/Connect middleware that wraps each request in a transaction. */
  tracingMiddleware() {
    return createTracingMiddleware(requireClient());
  },
  /** Stops background node health reporting for the singleton client. */
  stopMetrics() {
    return requireClient().stopMetrics();
  },
};
