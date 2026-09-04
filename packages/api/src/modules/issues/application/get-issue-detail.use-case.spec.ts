import { randomUUID } from 'node:crypto';
import { NotFoundException } from '@nestjs/common';
import { GetIssueDetailUseCase } from './get-issue-detail.use-case';
import { IssueRepository, CreateIssueData } from '../domain/issue-repository.port';
import { Issue, IssueStatus } from '../domain/issue.entity';
import { EventStore } from '../domain/event-store.port';
import { IssueEvent } from '../domain/event.entity';

class InMemoryIssueRepository implements IssueRepository {
  issues: Issue[] = [];
  async create(data: CreateIssueData) {
    const issue: Issue = { id: randomUUID(), status: 'unresolved', eventCount: 1, ...data };
    this.issues.push(issue);
    return issue;
  }
  async findById(id: string) {
    return this.issues.find((i) => i.id === id) ?? null;
  }
  async findByFingerprint(projectId: string, fingerprint: string) {
    return this.issues.find((i) => i.projectId === projectId && i.fingerprint === fingerprint) ?? null;
  }
  async recordOccurrence(id: string) {
    return this.issues.find((i) => i.id === id)!;
  }
  async updateStatus(id: string, status: IssueStatus) {
    const issue = this.issues.find((i) => i.id === id)!;
    issue.status = status;
    return issue;
  }
  async listForProject(projectId: string) {
    return this.issues.filter((i) => i.projectId === projectId);
  }
}

class InMemoryEventStore implements EventStore {
  events: IssueEvent[] = [];
  async insert(event: IssueEvent) {
    this.events.push(event);
  }
  async listForIssue(issueId: string, limit = 20) {
    return this.events.filter((e) => e.issueId === issueId).slice(0, limit);
  }
}

describe('GetIssueDetailUseCase', () => {
  it('returns the issue with its recent events', async () => {
    const issues = new InMemoryIssueRepository();
    const events = new InMemoryEventStore();
    const issue = await issues.create({
      projectId: randomUUID(),
      fingerprint: 'abc',
      title: 'Boom',
      level: 'error',
      firstSeen: new Date(),
      lastSeen: new Date(),
    });
    events.events.push({
      id: randomUUID(),
      projectId: issue.projectId,
      issueId: issue.id,
      timestamp: new Date(),
      message: 'Boom',
      exceptionType: 'Error',
      stackTrace: '',
      level: 'error',
      environment: 'test',
      tags: {},
      breadcrumbs: [],
    });

    const useCase = new GetIssueDetailUseCase(issues, events);
    const detail = await useCase.execute(issue.id);

    expect(detail.issue.id).toBe(issue.id);
    expect(detail.events).toHaveLength(1);
  });

  it('throws NotFoundException for an unknown issue id', async () => {
    const useCase = new GetIssueDetailUseCase(new InMemoryIssueRepository(), new InMemoryEventStore());
    await expect(useCase.execute(randomUUID())).rejects.toThrow(NotFoundException);
  });
});
