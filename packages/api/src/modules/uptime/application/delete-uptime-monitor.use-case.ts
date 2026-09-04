import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UPTIME_MONITOR_REPOSITORY, UptimeMonitorRepository } from '../domain/uptime-monitor-repository.port';
import { UPTIME_SCHEDULER, UptimeScheduler } from '../domain/uptime-scheduler.port';

@Injectable()
export class DeleteUptimeMonitorUseCase {
  constructor(
    @Inject(UPTIME_MONITOR_REPOSITORY) private readonly monitors: UptimeMonitorRepository,
    @Inject(UPTIME_SCHEDULER) private readonly scheduler: UptimeScheduler,
  ) {}

  async execute(id: string): Promise<void> {
    const monitor = await this.monitors.findById(id);
    if (!monitor) {
      throw new NotFoundException('Uptime monitor not found');
    }
    this.scheduler.unschedule(id);
    await this.monitors.delete(id);
  }
}
