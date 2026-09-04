import os from 'node:os';
import { Breadcrumb, BreadcrumbStore } from './breadcrumbs';
import { Transport } from './transport';
import { Transaction } from './tracing';
import { MetricsCollector } from './metrics';

export interface AMonitorOptions {
  /** The project's DSN key, shown in the amonitor dashboard's project settings. */
  dsn: string;
  /** Base URL of the amonitor API, e.g. http://localhost:3001 */
  apiUrl: string;
  environment?: string;
  tags?: Record<string, string>;
  maxBreadcrumbs?: number;
  /** Install process.on('uncaughtException'/'unhandledRejection') handlers. Default true. */
  autoCaptureExceptions?: boolean;
  /**
   * Report this process as a node (CPU/memory/network health) to the Nodes
   * dashboard. Default true.
   */
  reportMetrics?: boolean;
  /** How often to send a health sample, in ms. Default 15000, minimum 5000. */
  metricsIntervalMs?: number;
  /**
   * Stable identity for this process in the Nodes dashboard. Defaults to
   * `hostname-pid`; set it to a pod/container name so restarts of the same
   * instance stay one node instead of appearing as new ones each time.
   */
  instanceId?: string;
}

const DEFAULT_MAX_BREADCRUMBS = 20;
const DEFAULT_METRICS_INTERVAL_MS = 15000;
const MIN_METRICS_INTERVAL_MS = 5000;

export class AMonitorClient {
  private readonly transport: Transport;
  private readonly breadcrumbs: BreadcrumbStore;
  private readonly environment: string;
  private readonly tags: Record<string, string>;
  private readonly metrics: MetricsCollector | null = null;
  private handlersInstalled = false;

  constructor(private readonly options: AMonitorOptions) {
    if (!options.dsn) throw new Error('amonitor: `dsn` is required');
    if (!options.apiUrl) throw new Error('amonitor: `apiUrl` is required');

    this.transport = new Transport(options.apiUrl, options.dsn);
    this.breadcrumbs = new BreadcrumbStore(options.maxBreadcrumbs ?? DEFAULT_MAX_BREADCRUMBS);
    this.environment = options.environment ?? process.env.NODE_ENV ?? 'development';
    this.tags = options.tags ?? {};

    if (options.autoCaptureExceptions !== false) {
      this.installGlobalHandlers();
    }

    if (options.reportMetrics !== false) {
      const instanceId = options.instanceId ?? `${os.hostname()}-${process.pid}`;
      const interval = Math.max(
        MIN_METRICS_INTERVAL_MS,
        options.metricsIntervalMs ?? DEFAULT_METRICS_INTERVAL_MS,
      );
      this.metrics = new MetricsCollector(instanceId, interval, (payload) => {
        // Wrapped rather than chained directly: reporting must never be able
        // to throw into the host application's startup path.
        Promise.resolve(this.transport.sendMetrics(payload)).catch((err) => {
          // eslint-disable-next-line no-console
          console.error('amonitor: failed to report metrics', err);
        });
      });
      this.metrics.start();
      // Send one immediately so a node shows up without waiting a full interval.
      this.metrics.collect();
    }
  }

  /** Stops the background health reporting started by `reportMetrics`. */
  stopMetrics(): void {
    this.metrics?.stop();
  }

  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'> & { timestamp?: number }): void {
    this.breadcrumbs.add(breadcrumb);
  }

  captureException(error: unknown, extra?: { tags?: Record<string, string> }): Promise<void> {
    const { message, exceptionType, stack } = normalizeError(error);

    return this.transport
      .sendException({
        timestamp: Date.now(),
        message,
        exceptionType,
        stack,
        level: 'error',
        environment: this.environment,
        tags: { ...this.tags, ...extra?.tags },
        breadcrumbs: this.breadcrumbs.snapshot(),
      })
      .catch((err) => {
        // Never let a reporting failure crash the host app.
        // eslint-disable-next-line no-console
        console.error('amonitor: failed to report exception', err);
      });
  }

  /**
   * Starts a traced unit of work (typically one HTTP request). Reported
   * automatically to the API when `.finish()` is called on it, along with
   * any child spans started via `.startChild(...)`.
   */
  startTransaction(name: string, op = 'transaction'): Transaction {
    return new Transaction(name, op, (payload) => {
      this.transport.sendTransaction(payload).catch((err) => {
        // eslint-disable-next-line no-console
        console.error('amonitor: failed to report transaction', err);
      });
    });
  }

  captureMessage(message: string, level: 'error' | 'warning' | 'info' = 'info'): Promise<void> {
    return this.transport
      .sendException({
        timestamp: Date.now(),
        message,
        exceptionType: 'Message',
        stack: '',
        level,
        environment: this.environment,
        tags: this.tags,
        breadcrumbs: this.breadcrumbs.snapshot(),
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('amonitor: failed to report message', err);
      });
  }

  private installGlobalHandlers(): void {
    if (this.handlersInstalled) return;
    this.handlersInstalled = true;

    process.on('uncaughtException', (error) => {
      this.captureException(error).finally(() => {
        // eslint-disable-next-line no-console
        console.error(error);
        process.exit(1);
      });
    });

    process.on('unhandledRejection', (reason) => {
      this.captureException(reason);
    });
  }
}

function normalizeError(error: unknown): {
  message: string;
  exceptionType: string;
  stack: string;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      exceptionType: error.name || 'Error',
      stack: error.stack ?? '',
    };
  }
  return {
    message: typeof error === 'string' ? error : JSON.stringify(error),
    exceptionType: 'NonError',
    stack: '',
  };
}
