import { Inject, Injectable } from '@nestjs/common';
import { UPTIME_MONITOR_REPOSITORY, UptimeMonitorRepository } from '../domain/uptime-monitor-repository.port';
import { UPTIME_CHECK_STORE, UptimeCheckStore } from '../domain/uptime-check-store.port';
import { UptimeMonitor } from '../domain/uptime-monitor.entity';
import { UptimeCheck } from '../domain/uptime-check.entity';

export interface MonitorWithStatus {
  monitor: UptimeMonitor;
  latestCheck: UptimeCheck | null;
}

@Injectable()
export class ListMonitorsWithStatusUseCase {
  constructor(
    @Inject(UPTIME_MONITOR_REPOSITORY) private readonly monitors: UptimeMonitorRepository,
    @Inject(UPTIME_CHECK_STORE) private readonly checks: UptimeCheckStore,
  ) {}

  async execute(projectId: string): Promise<MonitorWithStatus[]> {
    const monitors = await this.monitors.listForProject(projectId);
    return Promise.all(
      monitors.map(async (monitor) => ({
        monitor,
        latestCheck: await this.checks.getLatest(monitor.id),
      })),
    );
  }
}
