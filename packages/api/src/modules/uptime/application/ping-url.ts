import * as http from 'node:http';
import * as https from 'node:https';

export interface PingResult {
  statusCode: number;
  latencyMs: number;
}

export function pingUrl(url: string, timeoutMs = 10000): Promise<PingResult> {
  return new Promise((resolve) => {
    const start = Date.now();
    let settled = false;
    const finish = (result: PingResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    let target: URL;
    try {
      target = new URL(url);
    } catch {
      finish({ statusCode: 0, latencyMs: 0 });
      return;
    }

    const client = target.protocol === 'https:' ? https : http;
    const req = client.request(target, { method: 'GET', timeout: timeoutMs }, (res) => {
      res.resume();
      res.on('end', () => finish({ statusCode: res.statusCode ?? 0, latencyMs: Date.now() - start }));
    });

    req.on('timeout', () => req.destroy());
    req.on('error', () => finish({ statusCode: 0, latencyMs: Date.now() - start }));
    req.end();
  });
}
