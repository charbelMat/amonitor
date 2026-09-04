import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { UptimeScheduler } from '../domain/uptime-scheduler.port';
import { UptimeMonitor } from '../domain/uptime-monitor.entity';
import {
  UPTIME_MONITOR_REPOSITORY,
  UptimeMonitorRepository,
} from '../domain/uptime-monitor-repository.port';
import { RunUptimeCheckUseCase } from '../application/run-uptime-check.use-case';

const INTERVAL_PREFIX = 'uptime-monitor:';

/**
 * Each monitor gets its own setInterval (registered/unregistered dynamically
 * as monitors are created/deleted) rather than a single fixed-cadence cron,
 * so `intervalSeconds` is honored precisely per monitor.
 */
@Injectable()
export class NestUptimeScheduler implements UptimeScheduler, OnModuleInit {
  private readonly logger = new Logger(NestUptimeScheduler.name);

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly runCheck: RunUptimeCheckUseCase,
    @Inject(UPTIME_MONITOR_REPOSITORY) private readonly monitors: UptimeMonitorRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    const existing = await this.monitors.listAll();
    for (const monitor of existing) {
      this.schedule(monitor);
    }
  }

  schedule(monitor: UptimeMonitor): void {
    this.unschedule(monitor.id);
    const handle = setInterval(() => {
      this.runCheck.execute(monitor).catch((err) => {
        this.logger.error(`Uptime check failed for monitor ${monitor.id}`, err);
      });
    }, monitor.intervalSeconds * 1000);
    handle.unref();
    this.schedulerRegistry.addInterval(INTERVAL_PREFIX + monitor.id, handle);
  }

  unschedule(monitorId: string): void {
    const name = INTERVAL_PREFIX + monitorId;
    if (this.schedulerRegistry.doesExist('interval', name)) {
      this.schedulerRegistry.deleteInterval(name);
    }
  }
}
