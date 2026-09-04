import { Inject, Injectable } from '@nestjs/common';
import { NODE_STORE, NodeStore } from '../domain/node-store.port';
import { NodeInstance, deriveStatus } from '../domain/node-sample.entity';

export interface NodesOverview {
  nodes: NodeInstance[];
  summary: {
    total: number;
    online: number;
    stale: number;
    offline: number;
    /** Averaged across nodes still reporting; 0 when none are. */
    avgCpuPercent: number;
    totalMemRssBytes: number;
    totalNetRxBytesPerSec: number;
    totalNetTxBytesPerSec: number;
  };
}

@Injectable()
export class ListNodesUseCase {
  constructor(@Inject(NODE_STORE) private readonly nodes: NodeStore) {}

  async execute(projectId: string): Promise<NodesOverview> {
    const samples = await this.nodes.listLatestPerInstance(projectId);
    const now = new Date();

    const instances: NodeInstance[] = samples
      .map((latest) => ({
        instanceId: latest.instanceId,
        hostname: latest.hostname,
        pid: latest.pid,
        status: deriveStatus(latest.timestamp, now),
        lastSeen: latest.timestamp,
        latest,
      }))
      .sort((a, b) => a.hostname.localeCompare(b.hostname) || a.pid - b.pid);

    // Offline nodes' last-known numbers would skew the live picture, so the
    // rollups only count nodes that are still reporting.
    const live = instances.filter((n) => n.status !== 'offline');
    const avgCpuPercent = live.length
      ? live.reduce((sum, n) => sum + n.latest.cpuPercent, 0) / live.length
      : 0;

    return {
      nodes: instances,
      summary: {
        total: instances.length,
        online: instances.filter((n) => n.status === 'online').length,
        stale: instances.filter((n) => n.status === 'stale').length,
        offline: instances.filter((n) => n.status === 'offline').length,
        avgCpuPercent: Number(avgCpuPercent.toFixed(2)),
        totalMemRssBytes: live.reduce((sum, n) => sum + n.latest.memRssBytes, 0),
        totalNetRxBytesPerSec: live.reduce((sum, n) => sum + n.latest.netRxBytesPerSec, 0),
        totalNetTxBytesPerSec: live.reduce((sum, n) => sum + n.latest.netTxBytesPerSec, 0),
      },
    };
  }
}
