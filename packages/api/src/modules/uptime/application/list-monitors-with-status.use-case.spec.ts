import { randomUUID } from 'node:crypto';
import { ListMonitorsWithStatusUseCase } from './list-monitors-with-status.use-case';
import {
  CreateUptimeMonitorData,
  UptimeMonitorRepository,
} from '../domain/uptime-monitor-repository.port';
import { UptimeMonitor } from '../domain/uptime-monitor.entity';
import { UptimeCheckStore } from '../domain/uptime-check-store.port';
import { UptimeCheck } from '../domain/uptime-check.entity';

class InMemoryUptimeMonitorRepository implements UptimeMonitorRepository {
  monitors: UptimeMonitor[] = [];
  async create(data: CreateUptimeMonitorData) {
    const monitor: UptimeMonitor = { id: randomUUID(), createdAt: new Date(), ...data };
    this.monitors.push(monitor);
    return monitor;
  }
  async findById(id: string) {
    return this.monitors.find((m) => m.id === id) ?? null;
  }
  async listForProject(projectId: string) {
    return this.monitors.filter((m) => m.projectId === projectId);
  }
  async listAll() {
    return this.monitors;
  }
  async delete(id: string) {
    this.monitors = this.monitors.filter((m) => m.id !== id);
  }
}

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

describe('ListMonitorsWithStatusUseCase', () => {
  it('pairs each monitor with its latest check, or null if it has never been checked', async () => {
    const projectId = randomUUID();
    const monitors = new InMemoryUptimeMonitorRepository();
    const checks = new InMemoryUptimeCheckStore();

    const checkedMonitor = await monitors.create({
      projectId,
      name: 'checked',
      url: 'https://a.com',
      intervalSeconds: 60,
      expectedStatus: 200,
    });
    const uncheckedMonitor = await monitors.create({
      projectId,
      name: 'unchecked',
      url: 'https://b.com',
      intervalSeconds: 60,
      expectedStatus: 200,
    });
    checks.checks.push({
      id: randomUUID(),
      monitorId: checkedMonitor.id,
      projectId,
      timestamp: new Date(),
      statusCode: 200,
      latencyMs: 12,
      success: true,
    });

    const useCase = new ListMonitorsWithStatusUseCase(monitors, checks);
    const result = await useCase.execute(projectId);

    const checkedResult = result.find((r) => r.monitor.id === checkedMonitor.id)!;
    const uncheckedResult = result.find((r) => r.monitor.id === uncheckedMonitor.id)!;
    expect(checkedResult.latestCheck?.success).toBe(true);
    expect(uncheckedResult.latestCheck).toBeNull();
  });
});
