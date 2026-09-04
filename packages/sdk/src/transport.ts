import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';
import { TransactionPayload } from './tracing';
import { MetricsPayload } from './metrics';

export interface ExceptionPayload {
  timestamp: number;
  message: string;
  exceptionType: string;
  stack: string;
  level: 'error' | 'warning' | 'info';
  environment: string;
  tags: Record<string, string>;
  breadcrumbs: unknown[];
}

export class Transport {
  constructor(
    private readonly apiUrl: string,
    private readonly dsn: string,
    private readonly timeoutMs = 5000,
  ) {}

  sendException(payload: ExceptionPayload): Promise<void> {
    return this.post(`/api/ingest/${encodeURIComponent(this.dsn)}/exception`, payload);
  }

  sendTransaction(payload: TransactionPayload): Promise<void> {
    return this.post(`/api/ingest/${encodeURIComponent(this.dsn)}/transaction`, payload);
  }

  sendMetrics(payload: MetricsPayload): Promise<void> {
    return this.post(`/api/ingest/${encodeURIComponent(this.dsn)}/metrics`, payload);
  }

  private post(path: string, body: unknown): Promise<void> {
    return new Promise((resolve, reject) => {
      let url: URL;
      try {
        url = new URL(path, this.apiUrl);
      } catch (err) {
        reject(err as Error);
        return;
      }

      const data = JSON.stringify(body);
      const client = url.protocol === 'https:' ? https : http;

      const req = client.request(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data),
          },
          timeout: this.timeoutMs,
        },
        (res) => {
          res.resume();
          res.on('end', resolve);
        },
      );

      req.on('timeout', () => req.destroy(new Error('amonitor: request timed out')));
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }
}
