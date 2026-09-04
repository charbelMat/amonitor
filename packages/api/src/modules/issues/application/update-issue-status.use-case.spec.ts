import { randomUUID } from 'node:crypto';
import { NotFoundException } from '@nestjs/common';
import { UpdateIssueStatusUseCase } from './update-issue-status.use-case';
import { IssueRepository, CreateIssueData } from '../domain/issue-repository.port';
import { Issue, IssueStatus } from '../domain/issue.entity';

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
  async findByFingerprint() {
    return null;
  }
  async recordOccurrence(id: string) {
    return this.issues.find((i) => i.id === id)!;
  }
  async updateStatus(id: string, status: IssueStatus) {
    const issue = this.issues.find((i) => i.id === id)!;
    issue.status = status;
    return issue;
  }
  async listForProject() {
    return this.issues;
  }
}

describe('UpdateIssueStatusUseCase', () => {
  it('updates the status of an existing issue', async () => {
    const issues = new InMemoryIssueRepository();
    const issue = await issues.create({
      projectId: randomUUID(),
      fingerprint: 'abc',
      title: 'Boom',
      level: 'error',
      firstSeen: new Date(),
      lastSeen: new Date(),
    });
    const useCase = new UpdateIssueStatusUseCase(issues);

    const updated = await useCase.execute(issue.id, 'resolved');

    expect(updated.status).toBe('resolved');
  });

  it('throws NotFoundException for an unknown issue id', async () => {
    const useCase = new UpdateIssueStatusUseCase(new InMemoryIssueRepository());
    await expect(useCase.execute(randomUUID(), 'ignored')).rejects.toThrow(NotFoundException);
  });
});
