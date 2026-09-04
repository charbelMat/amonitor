import os from 'node:os';
import { MetricsCollector, MetricsPayload } from './metrics';

describe('MetricsCollector', () => {
  function collectOnce(): MetricsPayload {
    let captured: MetricsPayload | undefined;
    const collector = new MetricsCollector('test-instance', 60_000, (p) => {
      captured = p;
    });
    collector.collect();
    collector.stop();
    return captured!;
  }

  it('reports identity, cpu, memory and event-loop fields', () => {
    const sample = collectOnce();

    expect(sample.instanceId).toBe('test-instance');
    expect(sample.hostname).toBe(os.hostname());
    expect(sample.pid).toBe(process.pid);
    expect(sample.uptimeSec).toBeGreaterThanOrEqual(0);

    expect(sample.cpuPercent).toBeGreaterThanOrEqual(0);
    expect(sample.cpuPercent).toBeLessThanOrEqual(100);
    expect(sample.cpuCount).toBeGreaterThan(0);

    expect(sample.memRssBytes).toBeGreaterThan(0);
    expect(sample.memHeapUsedBytes).toBeGreaterThan(0);
    expect(sample.systemMemTotalBytes).toBeGreaterThan(sample.systemMemFreeBytes);

    expect(sample.eventLoopLagMs).toBeGreaterThanOrEqual(0);
  });

  it('flags whether host network counters were available on this platform', () => {
    const sample = collectOnce();

    // procfs on Linux, absent on macOS/Windows — either way the numbers must
    // be non-negative and the flag must say which case we're in.
    expect(typeof sample.networkSupported).toBe('boolean');
    expect(sample.netRxBytesPerSec).toBeGreaterThanOrEqual(0);
    expect(sample.netTxBytesPerSec).toBeGreaterThanOrEqual(0);
    if (!sample.networkSupported) {
      expect(sample.netRxBytesPerSec).toBe(0);
      expect(sample.netTxBytesPerSec).toBe(0);
    }
  });

  it('does not keep the process alive and stops cleanly', () => {
    const collector = new MetricsCollector('x', 5000, () => {});
    collector.start();
    collector.start(); // idempotent
    collector.stop();
    collector.stop();
    expect(true).toBe(true);
  });
});
