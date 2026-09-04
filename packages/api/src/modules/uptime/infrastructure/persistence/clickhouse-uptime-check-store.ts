import { Injectable } from '@nestjs/common';
import { ClickHouseService } from '../../../../infrastructure/clickhouse/clickhouse.service';
import { UptimeCheckStore } from '../../domain/uptime-check-store.port';
import { UptimeCheck } from '../../domain/uptime-check.entity';

interface CheckRow {
  id: string;
  monitor_id: string;
  project_id: string;
  timestamp: string;
  status_code: number;
  latency_ms: number;
  success: number;
}

@Injectable()
export class ClickHouseUptimeCheckStore implements UptimeCheckStore {
  constructor(private readonly clickhouse: ClickHouseService) {}

  async insert(check: UptimeCheck): Promise<void> {
    await this.clickhouse.insert('uptime_checks', [
      {
        id: check.id,
        monitor_id: check.monitorId,
        project_id: check.projectId,
        timestamp: formatClickHouseDateTime(check.timestamp),
        status_code: check.statusCode,
        latency_ms: check.latencyMs,
        success: check.success ? 1 : 0,
      },
    ]);
  }

  async listForMonitor(monitorId: string, limit = 50): Promise<UptimeCheck[]> {
    const rows = await this.clickhouse.query<CheckRow>(
      `SELECT * FROM uptime_checks WHERE monitor_id = {monitorId:String}
       ORDER BY timestamp DESC LIMIT {limit:UInt32}`,
      { monitorId, limit },
    );
    return rows.map(toDomain);
  }

  async getLatest(monitorId: string): Promise<UptimeCheck | null> {
    const rows = await this.clickhouse.query<CheckRow>(
      `SELECT * FROM uptime_checks WHERE monitor_id = {monitorId:String}
       ORDER BY timestamp DESC LIMIT 1`,
      { monitorId },
    );
    return rows.length > 0 ? toDomain(rows[0]) : null;
  }
}

function toDomain(row: CheckRow): UptimeCheck {
  return {
    id: row.id,
    monitorId: row.monitor_id,
    projectId: row.project_id,
    timestamp: new Date(row.timestamp.replace(' ', 'T') + 'Z'),
    statusCode: row.status_code,
    latencyMs: row.latency_ms,
    success: row.success === 1,
  };
}

function formatClickHouseDateTime(date: Date): string {
  return date.toISOString().replace('T', ' ').replace('Z', '');
}
