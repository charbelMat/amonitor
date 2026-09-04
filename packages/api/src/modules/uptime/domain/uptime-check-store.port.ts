import { UptimeCheck } from './uptime-check.entity';

export const UPTIME_CHECK_STORE = 'UPTIME_CHECK_STORE';

export interface UptimeCheckStore {
  insert(check: UptimeCheck): Promise<void>;
  listForMonitor(monitorId: string, limit?: number): Promise<UptimeCheck[]>;
  getLatest(monitorId: string): Promise<UptimeCheck | null>;
}
