import { randomUUID } from 'node:crypto';
import { RunUptimeCheckUseCase } from './run-uptime-check.use-case';
import { UptimeCheckStore } from '../domain/uptime-check-store.port';
import { UptimeCheck } from '../domain/uptime-check.entity';
import { UptimeMonitor } from '../domain/uptime-monitor.entity';
import { EvaluateAlertsUseCase } from '../../alerts/application/evaluate-alerts.use-case';

jest.mock('./ping-url');
import { pingUrl } from './ping-url';

class InMemoryUptimeCheckStore implements UptimeCheckStore {
  checks: UptimeCheck[] = [];
  async insert(check: UptimeCheck) {
    this.checks.push(check);
  }
  async listForMonitor(monitorId: string) {
    return this.checks.filter((c) => c.monitorId === monitorId);
  }
  async getLatest(monitorId: string) {
    const forMonitor = this.checks.filter((c) => c.monitorId === monitorId);
    return forMonitor.length ? forMonitor[forMonitor.length - 1] : null;
  }
}

function makeMonitor(overrides: Partial<UptimeMonitor> = {}): UptimeMonitor {
  return {
    id: randomUUID(),
    projectId: randomUUID(),
    name: 'API health',
    url: 'https://example.com/health',
    intervalSeconds: 60,
    expectedStatus: 200,
    createdAt: new Date(),
    ...overrides,
  };
}

describe('RunUptimeCheckUseCase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('records a successful check and does not alert', async () => {
    (pingUrl as jest.Mock).mockResolvedValue({ statusCode: 200, latencyMs: 42 });
    const store = new InMemoryUptimeCheckStore();
    const evaluateAlerts = { execute: jest.fn() } as unknown as EvaluateAlertsUseCase;
    const useCase = new RunUptimeCheckUseCase(store, evaluateAlerts);
    const monitor = makeMonitor();

    await useCase.execute(monitor);

    expect(store.checks).toHaveLength(1);
    expect(store.checks[0].success).toBe(true);
    expect(evaluateAlerts.execute).not.toHaveBeenCalled();
  });

  it('alerts on the first failure after being up', async () => {
    (pingUrl as jest.Mock).mockResolvedValue({ statusCode: 500, latencyMs: 10 });
    const store = new InMemoryUptimeCheckStore();
    const evaluateAlerts = { execute: jest.fn() } as unknown as EvaluateAlertsUseCase;
    const useCase = new RunUptimeCheckUseCase(store, evaluateAlerts);
    const monitor = makeMonitor();

    await useCase.execute(monitor);

    expect(store.checks[0].success).toBe(false);
    expect(evaluateAlerts.execute).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: monitor.projectId, trigger: 'uptime_down' }),
    );
  });

  it('does not re-alert on consecutive failures', async () => {
    (pingUrl as jest.Mock).mockResolvedValue({ statusCode: 500, latencyMs: 10 });
    const store = new InMemoryUptimeCheckStore();
    const evaluateAlerts = { execute: jest.fn() } as unknown as EvaluateAlertsUseCase;
    const useCase = new RunUptimeCheckUseCase(store, evaluateAlerts);
    const monitor = makeMonitor();

    await useCase.execute(monitor);
    await useCase.execute(monitor);

    expect(store.checks).toHaveLength(2);
    expect(evaluateAlerts.execute).toHaveBeenCalledTimes(1);
  });
});
