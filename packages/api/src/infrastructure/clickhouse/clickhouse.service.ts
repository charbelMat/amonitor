import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, ClickHouseClient } from '@clickhouse/client';

const CREATE_EVENTS_TABLE = `
  CREATE TABLE IF NOT EXISTS events (
    id String,
    project_id String,
    issue_id String,
    timestamp DateTime64(3),
    message String,
    exception_type String,
    stack_trace String,
    level String,
    environment String,
    tags String,
    breadcrumbs String
  ) ENGINE = MergeTree
  ORDER BY (project_id, issue_id, timestamp)
`;

const CREATE_NODE_METRICS_TABLE = `
  CREATE TABLE IF NOT EXISTS node_metrics (
    project_id String,
    instance_id String,
    hostname String,
    pid Int32,
    timestamp DateTime64(3),
    uptime_sec Int64,
    cpu_percent Float64,
    cpu_count Int32,
    load_avg_1 Float64,
    mem_rss_bytes Int64,
    mem_heap_used_bytes Int64,
    mem_heap_total_bytes Int64,
    system_mem_total_bytes Int64,
    system_mem_free_bytes Int64,
    network_supported UInt8,
    net_rx_bytes_per_sec Int64,
    net_tx_bytes_per_sec Int64,
    event_loop_lag_ms Float64
  ) ENGINE = MergeTree
  ORDER BY (project_id, instance_id, timestamp)
`;

const CREATE_UPTIME_CHECKS_TABLE = `
  CREATE TABLE IF NOT EXISTS uptime_checks (
    id String,
    monitor_id String,
    project_id String,
    timestamp DateTime64(3),
    status_code Int32,
    latency_ms Float64,
    success UInt8
  ) ENGINE = MergeTree
  ORDER BY (monitor_id, timestamp)
`;

const CREATE_SPANS_TABLE = `
  CREATE TABLE IF NOT EXISTS spans (
    id String,
    trace_id String,
    parent_span_id String,
    project_id String,
    transaction_name String,
    op String,
    description String,
    start_time DateTime64(3),
    end_time DateTime64(3),
    duration_ms Float64,
    is_transaction UInt8
  ) ENGINE = MergeTree
  ORDER BY (project_id, trace_id, start_time)
`;

@Injectable()
export class ClickHouseService implements OnModuleInit {
  readonly client: ClickHouseClient;

  constructor(config: ConfigService) {
    this.client = createClient({ url: config.get<string>('CLICKHOUSE_URL') });
  }

  async onModuleInit() {
    await this.client.command({ query: CREATE_EVENTS_TABLE });
    await this.client.command({ query: CREATE_SPANS_TABLE });
    await this.client.command({ query: CREATE_UPTIME_CHECKS_TABLE });
    await this.client.command({ query: CREATE_NODE_METRICS_TABLE });
  }

  async insert(table: string, rows: Record<string, unknown>[]): Promise<void> {
    await this.client.insert({ table, values: rows, format: 'JSONEachRow' });
  }

  async query<T>(query: string, query_params?: Record<string, unknown>): Promise<T[]> {
    const result = await this.client.query({ query, query_params, format: 'JSONEachRow' });
    return result.json<T>();
  }
}
