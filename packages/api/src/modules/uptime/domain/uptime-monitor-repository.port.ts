import { UptimeMonitor } from './uptime-monitor.entity';

export const UPTIME_MONITOR_REPOSITORY = 'UPTIME_MONITOR_REPOSITORY';

export interface CreateUptimeMonitorData {
  projectId: string;
  name: string;
  url: string;
  intervalSeconds: number;
  expectedStatus: number;
}

export interface UptimeMonitorRepository {
  create(data: CreateUptimeMonitorData): Promise<UptimeMonitor>;
  findById(id: string): Promise<UptimeMonitor | null>;
  listForProject(projectId: string): Promise<UptimeMonitor[]>;
  /** Every monitor across every project — used to (re)register scheduled checks on boot. */
  listAll(): Promise<UptimeMonitor[]>;
  delete(id: string): Promise<void>;
}
