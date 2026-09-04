import { Injectable } from '@nestjs/common';
import { ClickHouseService } from '../../../../infrastructure/clickhouse/clickhouse.service';
import { NodeStore } from '../../domain/node-store.port';
import { NodeSample } from '../../domain/node-sample.entity';

interface NodeRow {
  project_id: string;
  instance_id: string;
  hostname: string;
  pid: number;
  timestamp: string;
  uptime_sec: number;
  cpu_percent: number;
  cpu_count: number;
  load_avg_1: number;
  mem_rss_bytes: number;
  mem_heap_used_bytes: number;
  mem_heap_total_bytes: number;
  system_mem_total_bytes: number;
  system_mem_free_bytes: number;
  network_supported: number;
  net_rx_bytes_per_sec: number;
  net_tx_bytes_per_sec: number;
  event_loop_lag_ms: number;
}

@Injectable()
export class ClickHouseNodeStore implements NodeStore {
  constructor(private readonly clickhouse: ClickHouseService) {}

  async insert(sample: NodeSample): Promise<void> {
    await this.clickhouse.insert('node_metrics', [
      {
        project_id: sample.projectId,
        instance_id: sample.instanceId,
        hostname: sample.hostname,
        pid: sample.pid,
        timestamp: formatClickHouseDateTime(sample.timestamp),
        uptime_sec: sample.uptimeSec,
        cpu_percent: sample.cpuPercent,
        cpu_count: sample.cpuCount,
        load_avg_1: sample.loadAvg1,
        mem_rss_bytes: sample.memRssBytes,
        mem_heap_used_bytes: sample.memHeapUsedBytes,
        mem_heap_total_bytes: sample.memHeapTotalBytes,
        system_mem_total_bytes: sample.systemMemTotalBytes,
        system_mem_free_bytes: sample.systemMemFreeBytes,
        network_supported: sample.networkSupported ? 1 : 0,
        net_rx_bytes_per_sec: sample.netRxBytesPerSec,
        net_tx_bytes_per_sec: sample.netTxBytesPerSec,
        event_loop_lag_ms: sample.eventLoopLagMs,
      },
    ]);
  }

  /**
   * One row per instance — the newest sample each has reported. `LIMIT 1 BY`
   * is ClickHouse's built-in "latest per group", which avoids pulling the
   * whole history back just to take the head of each partition.
   */
  async listLatestPerInstance(projectId: string): Promise<NodeSample[]> {
    const rows = await this.clickhouse.query<NodeRow>(
      `SELECT * FROM node_metrics
       WHERE project_id = {projectId:String}
       ORDER BY instance_id, timestamp DESC
       LIMIT 1 BY instance_id`,
      { projectId },
    );
    return rows.map(toDomain);
  }

  async history(
    projectId: string,
    instanceId: string,
    sinceMinutes: number,
  ): Promise<NodeSample[]> {
    const rows = await this.clickhouse.query<NodeRow>(
      `SELECT * FROM node_metrics
       WHERE project_id = {projectId:String}
         AND instance_id = {instanceId:String}
         AND timestamp >= now() - INTERVAL {sinceMinutes:UInt32} MINUTE
       ORDER BY timestamp ASC`,
      { projectId, instanceId, sinceMinutes },
    );
    return rows.map(toDomain);
  }
}

function toDomain(row: NodeRow): NodeSample {
  return {
    projectId: row.project_id,
    instanceId: row.instance_id,
    hostname: row.hostname,
    pid: Number(row.pid),
    timestamp: new Date(row.timestamp.replace(' ', 'T') + 'Z'),
    uptimeSec: Number(row.uptime_sec),
    cpuPercent: Number(row.cpu_percent),
    cpuCount: Number(row.cpu_count),
    loadAvg1: Number(row.load_avg_1),
    memRssBytes: Number(row.mem_rss_bytes),
    memHeapUsedBytes: Number(row.mem_heap_used_bytes),
    memHeapTotalBytes: Number(row.mem_heap_total_bytes),
    systemMemTotalBytes: Number(row.system_mem_total_bytes),
    systemMemFreeBytes: Number(row.system_mem_free_bytes),
    networkSupported: Number(row.network_supported) === 1,
    netRxBytesPerSec: Number(row.net_rx_bytes_per_sec),
    netTxBytesPerSec: Number(row.net_tx_bytes_per_sec),
    eventLoopLagMs: Number(row.event_loop_lag_ms),
  };
}

function formatClickHouseDateTime(date: Date): string {
  return date.toISOString().replace('T', ' ').replace('Z', '');
}
