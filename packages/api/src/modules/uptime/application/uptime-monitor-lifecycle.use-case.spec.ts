import { randomUUID } from 'node:crypto';
import { NotFoundException } from '@nestjs/common';
import { CreateUptimeMonitorUseCase } from './create-uptime-monitor.use-case';
import { DeleteUptimeMonitorUseCase } from './delete-uptime-monitor.use-case';
import {
  CreateUptimeMonitorData,
  UptimeMonitorRepository,
} from '../domain/uptime-monitor-repository.port';
import { UptimeMonitor } from '../domain/uptime-monitor.entity';
import { UptimeScheduler } from '../domain/uptime-scheduler.port';

class InMemoryUptimeMonitorRepository implements UptimeMonitorRepository {
  monitors: UptimeMonitor[] = [];
  async create(data: CreateUptimeMonitorData) {
    const monitor: UptimeMonitor = { id: randomUUID(), createdAt: new Date(), ...data };
    this.monitors.push(monitor);
    return monitor;
  }
  async findById(id: string) {
    return this.monitors.find((m) => m.id === id) ?? null;
  }
  async listForProject(projectId: string) {
    return this.monitors.filter((m) => m.projectId === projectId);
  }
  async listAll() {
    return this.monitors;
  }
  async delete(id: string) {
    this.monitors = this.monitors.filter((m) => m.id !== id);
  }
}

describe('CreateUptimeMonitorUseCase', () => {
  it('creates the monitor and registers it with the scheduler', async () => {
    const repo = new InMemoryUptimeMonitorRepository();
    const scheduler: UptimeScheduler = { schedule: jest.fn(), unschedule: jest.fn() };
    const useCase = new CreateUptimeMonitorUseCase(repo, scheduler);

    const monitor = await useCase.execute({
      projectId: randomUUID(),
      name: 'API health',
      url: 'https://example.com/health',
      intervalSeconds: 60,
      expectedStatus: 200,
    });

    expect(repo.monitors).toHaveLength(1);
    expect(scheduler.schedule).toHaveBeenCalledWith(monitor);
  });
});

describe('DeleteUptimeMonitorUseCase', () => {
  it('unschedules and deletes an existing monitor', async () => {
    const repo = new InMemoryUptimeMonitorRepository();
    const scheduler: UptimeScheduler = { schedule: jest.fn(), unschedule: jest.fn() };
    const monitor = await repo.create({
      projectId: randomUUID(),
      name: 'API health',
      url: 'https://example.com/health',
      intervalSeconds: 60,
      expectedStatus: 200,
    });
    const useCase = new DeleteUptimeMonitorUseCase(repo, scheduler);

    await useCase.execute(monitor.id);

    expect(scheduler.unschedule).toHaveBeenCalledWith(monitor.id);
    expect(repo.monitors).toHaveLength(0);
  });

  it('throws NotFoundException for an unknown monitor and never touches the scheduler', async () => {
    const repo = new InMemoryUptimeMonitorRepository();
    const scheduler: UptimeScheduler = { schedule: jest.fn(), unschedule: jest.fn() };
    const useCase = new DeleteUptimeMonitorUseCase(repo, scheduler);

    await expect(useCase.execute(randomUUID())).rejects.toThrow(NotFoundException);
    expect(scheduler.unschedule).not.toHaveBeenCalled();
  });
});
