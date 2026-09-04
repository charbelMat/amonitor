import { randomUUID } from 'node:crypto';
import { ListNodesUseCase } from './list-nodes.use-case';
import { NodeStore } from '../domain/node-store.port';
import { NodeSample, deriveStatus } from '../domain/node-sample.entity';

function makeSample(overrides: Partial<NodeSample> = {}): NodeSample {
  return {
    projectId: 'p1',
    instanceId: 'host-1',
    hostname: 'host',
    pid: 1,
    timestamp: new Date(),
    uptimeSec: 100,
    cpuPercent: 10,
    cpuCount: 4,
    loadAvg1: 0.5,
    memRssBytes: 100_000_000,
    memHeapUsedBytes: 50_000_000,
    memHeapTotalBytes: 80_000_000,
    systemMemTotalBytes: 8_000_000_000,
    systemMemFreeBytes: 4_000_000_000,
    networkSupported: true,
    netRxBytesPerSec: 1000,
    netTxBytesPerSec: 2000,
    eventLoopLagMs: 1,
    ...overrides,
  };
}

class InMemoryNodeStore implements NodeStore {
  constructor(public samples: NodeSample[] = []) {}
  async insert(sample: NodeSample) {
    this.samples.push(sample);
  }
  async listLatestPerInstance() {
    return this.samples;
  }
  async history() {
    return this.samples;
  }
}

describe('deriveStatus', () => {
  const now = new Date('2026-01-01T12:00:00Z');
  const at = (secondsAgo: number) => new Date(now.getTime() - secondsAgo * 1000);

  it('is online within two intervals, stale within four, offline beyond', () => {
    expect(deriveStatus(at(10), now)).toBe('online');
    expect(deriveStatus(at(45), now)).toBe('stale');
    expect(deriveStatus(at(120), now)).toBe('offline');
  });
});

describe('ListNodesUseCase', () => {
  it('returns one entry per instance with a derived status', async () => {
    const store = new InMemoryNodeStore([
      makeSample({ instanceId: 'a', hostname: 'web-1', pid: 10 }),
      makeSample({
        instanceId: 'b',
        hostname: 'web-2',
        pid: 20,
        timestamp: new Date(Date.now() - 10 * 60_000),
      }),
    ]);
    const useCase = new ListNodesUseCase(store);

    const { nodes, summary } = await useCase.execute(randomUUID());

    expect(nodes).toHaveLength(2);
    expect(nodes[0].hostname).toBe('web-1');
    expect(nodes[0].status).toBe('online');
    expect(nodes[1].status).toBe('offline');
    expect(summary.total).toBe(2);
    expect(summary.online).toBe(1);
    expect(summary.offline).toBe(1);
  });

  it('excludes offline nodes from the live rollups', async () => {
    const store = new InMemoryNodeStore([
      makeSample({ instanceId: 'a', cpuPercent: 40, memRssBytes: 100, netRxBytesPerSec: 5 }),
      makeSample({
        instanceId: 'b',
        cpuPercent: 90,
        memRssBytes: 999,
        netRxBytesPerSec: 999,
        timestamp: new Date(Date.now() - 10 * 60_000),
      }),
    ]);
    const useCase = new ListNodesUseCase(store);

    const { summary } = await useCase.execute(randomUUID());

    // Only the live node counts, so the dead one's last numbers don't skew it.
    expect(summary.avgCpuPercent).toBe(40);
    expect(summary.totalMemRssBytes).toBe(100);
    expect(summary.totalNetRxBytesPerSec).toBe(5);
  });

  it('reports zeroed rollups when nothing is reporting', async () => {
    const useCase = new ListNodesUseCase(new InMemoryNodeStore([]));
    const { nodes, summary } = await useCase.execute(randomUUID());
    expect(nodes).toHaveLength(0);
    expect(summary.avgCpuPercent).toBe(0);
  });
});
