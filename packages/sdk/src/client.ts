import { Breadcrumb, BreadcrumbStore } from './breadcrumbs';
import { Transport } from './transport';
import { Transaction } from './tracing';

export interface NodeMonitorOptions {
  /** The project's DSN key, shown in the node-monitor dashboard's project settings. */
  dsn: string;
  /** Base URL of the node-monitor API, e.g. http://localhost:3001 */
  apiUrl: string;
  environment?: string;
  tags?: Record<string, string>;
  maxBreadcrumbs?: number;
  /** Install process.on('uncaughtException'/'unhandledRejection') handlers. Default true. */
  autoCaptureExceptions?: boolean;
}

const DEFAULT_MAX_BREADCRUMBS = 20;

export class NodeMonitorClient {
  private readonly transport: Transport;
  private readonly breadcrumbs: BreadcrumbStore;
  private readonly environment: string;
  private readonly tags: Record<string, string>;
  private handlersInstalled = false;

  constructor(private readonly options: NodeMonitorOptions) {
    if (!options.dsn) throw new Error('node-monitor: `dsn` is required');
    if (!options.apiUrl) throw new Error('node-monitor: `apiUrl` is required');

    this.transport = new Transport(options.apiUrl, options.dsn);
    this.breadcrumbs = new BreadcrumbStore(options.maxBreadcrumbs ?? DEFAULT_MAX_BREADCRUMBS);
    this.environment = options.environment ?? process.env.NODE_ENV ?? 'development';
    this.tags = options.tags ?? {};

    if (options.autoCaptureExceptions !== false) {
      this.installGlobalHandlers();
    }
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
        console.error('node-monitor: failed to report exception', err);
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
        console.error('node-monitor: failed to report transaction', err);
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
        console.error('node-monitor: failed to report message', err);
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
