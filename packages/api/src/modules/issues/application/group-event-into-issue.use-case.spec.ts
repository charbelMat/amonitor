import { randomUUID } from 'node:crypto';
import { GroupEventIntoIssueUseCase } from './group-event-into-issue.use-case';
import { CreateIssueData, IssueRepository } from '../domain/issue-repository.port';
import { Issue, IssueStatus } from '../domain/issue.entity';
import { EvaluateAlertsUseCase } from '../../alerts/application/evaluate-alerts.use-case';

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
  async recordOccurrence(id: string, timestamp: Date) {
    const issue = this.issues.find((i) => i.id === id)!;
    issue.eventCount += 1;
    if (timestamp > issue.lastSeen) issue.lastSeen = timestamp;
    return issue;
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

const fakeEvaluateAlerts = { execute: async () => undefined } as unknown as EvaluateAlertsUseCase;

function createUseCase(repo: IssueRepository) {
  return new GroupEventIntoIssueUseCase(repo, fakeEvaluateAlerts);
}

describe('GroupEventIntoIssueUseCase', () => {
  const projectId = randomUUID();
  const sampleStack = 'TypeError: x is not a function\n    at handler (/app/src/index.js:10:5)';

  it('creates a new issue for a previously unseen fingerprint', async () => {
    const repo = new InMemoryIssueRepository();
    const useCase = createUseCase(repo);

    const issue = await useCase.execute({
      projectId,
      exceptionType: 'TypeError',
      stack: sampleStack,
      message: 'x is not a function',
      level: 'error',
      timestamp: new Date('2026-01-01T00:00:00Z'),
    });

    expect(repo.issues).toHaveLength(1);
    expect(issue.eventCount).toBe(1);
    expect(issue.title).toBe('TypeError: x is not a function');
  });

  it('groups a second identical error into the same issue and bumps the count', async () => {
    const repo = new InMemoryIssueRepository();
    const useCase = createUseCase(repo);

    await useCase.execute({
      projectId,
      exceptionType: 'TypeError',
      stack: sampleStack,
      message: 'x is not a function',
      level: 'error',
      timestamp: new Date('2026-01-01T00:00:00Z'),
    });
    const second = await useCase.execute({
      projectId,
      exceptionType: 'TypeError',
      stack: sampleStack,
      message: 'x is not a function',
      level: 'error',
      timestamp: new Date('2026-01-02T00:00:00Z'),
    });

    expect(repo.issues).toHaveLength(1);
    expect(second.eventCount).toBe(2);
    expect(second.lastSeen).toEqual(new Date('2026-01-02T00:00:00Z'));
  });

  it('reopens a resolved issue when the same error occurs again', async () => {
    const repo = new InMemoryIssueRepository();
    const useCase = createUseCase(repo);

    const issue = await useCase.execute({
      projectId,
      exceptionType: 'TypeError',
      stack: sampleStack,
      message: 'x is not a function',
      level: 'error',
      timestamp: new Date('2026-01-01T00:00:00Z'),
    });
    await repo.updateStatus(issue.id, 'resolved');

    const reoccurred = await useCase.execute({
      projectId,
      exceptionType: 'TypeError',
      stack: sampleStack,
      message: 'x is not a function',
      level: 'error',
      timestamp: new Date('2026-01-03T00:00:00Z'),
    });

    expect(reoccurred.status).toBe('unresolved');
  });

  it('gives different fingerprints to different exception types', async () => {
    const repo = new InMemoryIssueRepository();
    const useCase = createUseCase(repo);

    await useCase.execute({
      projectId,
      exceptionType: 'TypeError',
      stack: sampleStack,
      message: 'x is not a function',
      level: 'error',
      timestamp: new Date(),
    });
    await useCase.execute({
      projectId,
      exceptionType: 'RangeError',
      stack: sampleStack,
      message: 'x is not a function',
      level: 'error',
      timestamp: new Date(),
    });

    expect(repo.issues).toHaveLength(2);
  });
});
