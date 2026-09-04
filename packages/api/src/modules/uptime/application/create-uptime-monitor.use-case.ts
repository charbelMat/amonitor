import { Inject, Injectable } from '@nestjs/common';
import {
  UPTIME_MONITOR_REPOSITORY,
  UptimeMonitorRepository,
  CreateUptimeMonitorData,
} from '../domain/uptime-monitor-repository.port';
import { UPTIME_SCHEDULER, UptimeScheduler } from '../domain/uptime-scheduler.port';
import { UptimeMonitor } from '../domain/uptime-monitor.entity';

@Injectable()
export class CreateUptimeMonitorUseCase {
  constructor(
    @Inject(UPTIME_MONITOR_REPOSITORY) private readonly monitors: UptimeMonitorRepository,
    @Inject(UPTIME_SCHEDULER) private readonly scheduler: UptimeScheduler,
  ) {}

  async execute(data: CreateUptimeMonitorData): Promise<UptimeMonitor> {
    const monitor = await this.monitors.create(data);
    this.scheduler.schedule(monitor);
    return monitor;
  }
}
