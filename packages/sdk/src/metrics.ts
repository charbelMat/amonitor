import os from 'node:os';
import fs from 'node:fs';
import { monitorEventLoopDelay, type IntervalHistogram } from 'node:perf_hooks';

export interface MetricsPayload {
  timestamp: number;
  instanceId: string;
  hostname: string;
  pid: number;
  uptimeSec: number;
  /** Process CPU as a percentage of the machine's total capacity (0-100). */
  cpuPercent: number;
  cpuCount: number;
  loadAvg1: number;
  memRssBytes: number;
  memHeapUsedBytes: number;
  memHeapTotalBytes: number;
  systemMemTotalBytes: number;
  systemMemFreeBytes: number;
  /** Host-wide network throughput. Only available where /proc/net/dev exists (Linux). */
  networkSupported: boolean;
  netRxBytesPerSec: number;
  netTxBytesPerSec: number;
  eventLoopLagMs: number;
}

interface NetCounters {
  rx: number;
  tx: number;
}

/**
 * Reads host-wide network byte counters from /proc/net/dev, skipping
 * loopback. Returns null on platforms without procfs (macOS, Windows), where
 * Node exposes no equivalent without a native dependency.
 */
function readNetCounters(): NetCounters | null {
  try {
    const raw = fs.readFileSync('/proc/net/dev', 'utf8');
    let rx = 0;
    let tx = 0;
    for (const line of raw.split('\n').slice(2)) {
      const [ifaceRaw, rest] = line.split(':');
      if (!rest) continue;
      const iface = ifaceRaw.trim();
      if (iface === 'lo' || iface.startsWith('veth')) continue;
      const cols = rest.trim().split(/\s+/).map(Number);
      if (cols.length < 9 || Number.isNaN(cols[0]) || Number.isNaN(cols[8])) continue;
      rx += cols[0];
      tx += cols[8];
    }
    return { rx, tx };
  } catch {
    return null;
  }
}

/**
 * Samples process + host health (CPU, memory, network, event-loop lag) on an
 * interval. Each running process reports as one "node" so a project spread
 * across several instances shows up as several nodes.
 */
export class MetricsCollector {
  private timer: NodeJS.Timeout | null = null;
  private lastCpuUsage = process.cpuUsage();
  private lastSampleAt = Date.now();
  private lastNet = readNetCounters();
  private readonly loopDelay: IntervalHistogram;

  constructor(
    private readonly instanceId: string,
    private readonly intervalMs: number,
    private readonly onSample: (payload: MetricsPayload) => void,
  ) {
    this.loopDelay = monitorEventLoopDelay({ resolution: 10 });
  }

  start(): void {
    if (this.timer) return;
    this.loopDelay.enable();
    this.timer = setInterval(() => this.collect(), this.intervalMs);
    // Never hold the event loop open just to report metrics.
    this.timer.unref();
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.loopDelay.disable();
  }

  collect(): MetricsPayload {
    const now = Date.now();
    const elapsedMs = Math.max(now - this.lastSampleAt, 1);

    const cpuDelta = process.cpuUsage(this.lastCpuUsage);
    this.lastCpuUsage = process.cpuUsage();
    this.lastSampleAt = now;

    const cpuCount = os.cpus().length || 1;
    const cpuMillis = (cpuDelta.user + cpuDelta.system) / 1000;
    const cpuPercent = Math.min(100, (cpuMillis / elapsedMs / cpuCount) * 100);

    const net = readNetCounters();
    const seconds = elapsedMs / 1000;
    let netRx = 0;
    let netTx = 0;
    if (net && this.lastNet) {
      netRx = Math.max(0, (net.rx - this.lastNet.rx) / seconds);
      netTx = Math.max(0, (net.tx - this.lastNet.tx) / seconds);
    }
    if (net) this.lastNet = net;

    const mem = process.memoryUsage();
    const payload: MetricsPayload = {
      timestamp: now,
      instanceId: this.instanceId,
      hostname: os.hostname(),
      pid: process.pid,
      uptimeSec: Math.round(process.uptime()),
      cpuPercent: Number(cpuPercent.toFixed(2)),
      cpuCount,
      loadAvg1: Number(os.loadavg()[0].toFixed(2)),
      memRssBytes: mem.rss,
      memHeapUsedBytes: mem.heapUsed,
      memHeapTotalBytes: mem.heapTotal,
      systemMemTotalBytes: os.totalmem(),
      systemMemFreeBytes: os.freemem(),
      networkSupported: net !== null,
      netRxBytesPerSec: Math.round(netRx),
      netTxBytesPerSec: Math.round(netTx),
      eventLoopLagMs: Number((this.loopDelay.mean / 1e6 || 0).toFixed(2)),
    };

    this.loopDelay.reset();
    this.onSample(payload);
    return payload;
  }
}
