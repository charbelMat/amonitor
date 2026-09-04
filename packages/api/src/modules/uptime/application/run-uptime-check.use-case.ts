import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { UPTIME_CHECK_STORE, UptimeCheckStore } from '../domain/uptime-check-store.port';
import { UptimeMonitor } from '../domain/uptime-monitor.entity';
import { EvaluateAlertsUseCase } from '../../alerts/application/evaluate-alerts.use-case';
import { pingUrl } from './ping-url';

@Injectable()
export class RunUptimeCheckUseCase {
  constructor(
    @Inject(UPTIME_CHECK_STORE) private readonly checks: UptimeCheckStore,
    private readonly evaluateAlerts: EvaluateAlertsUseCase,
  ) {}

  async execute(monitor: UptimeMonitor): Promise<void> {
    const previous = await this.checks.getLatest(monitor.id);
    const { statusCode, latencyMs } = await pingUrl(monitor.url);
    const success = statusCode === monitor.expectedStatus;

    await this.checks.insert({
      id: randomUUID(),
      monitorId: monitor.id,
      projectId: monitor.projectId,
      timestamp: new Date(),
      statusCode,
      latencyMs,
      success,
    });

    const wasUpBefore = previous === null || previous.success;
    if (!success && wasUpBefore) {
      await this.evaluateAlerts.execute({
        projectId: monitor.projectId,
        trigger: 'uptime_down',
        subject: `[amonitor] ${monitor.name} is down`,
        message: `${monitor.name} (${monitor.url}) returned status ${statusCode}, expected ${monitor.expectedStatus}.`,
      });
    }
  }
}
