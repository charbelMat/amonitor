import { UptimeMonitor } from './uptime-monitor.entity';

export const UPTIME_SCHEDULER = 'UPTIME_SCHEDULER';

export interface UptimeScheduler {
  schedule(monitor: UptimeMonitor): void;
  unschedule(monitorId: string): void;
}
