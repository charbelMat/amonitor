/** One health sample reported by a running process (a "node") of a project. */
export interface NodeSample {
  projectId: string;
  instanceId: string;
  hostname: string;
  pid: number;
  timestamp: Date;
  uptimeSec: number;
  cpuPercent: number;
  cpuCount: number;
  loadAvg1: number;
  memRssBytes: number;
  memHeapUsedBytes: number;
  memHeapTotalBytes: number;
  systemMemTotalBytes: number;
  systemMemFreeBytes: number;
  networkSupported: boolean;
  netRxBytesPerSec: number;
  netTxBytesPerSec: number;
  eventLoopLagMs: number;
}

export type NodeStatus = 'online' | 'stale' | 'offline';

export interface NodeInstance {
  instanceId: string;
  hostname: string;
  pid: number;
  status: NodeStatus;
  lastSeen: Date;
  latest: NodeSample;
}

/**
 * Nodes report on an interval, so "online" is really "reported recently".
 * Two missed intervals is stale, four is offline — generous enough that a
 * slow sample doesn't flap the status.
 */
export function deriveStatus(lastSeen: Date, now: Date, intervalMs = 15000): NodeStatus {
  const age = now.getTime() - lastSeen.getTime();
  if (age <= intervalMs * 2) return 'online';
  if (age <= intervalMs * 4) return 'stale';
  return 'offline';
}
