import { Inject, Injectable } from '@nestjs/common';
import { ISSUE_REPOSITORY, IssueRepository } from '../domain/issue-repository.port';
import { Issue, IssueLevel } from '../domain/issue.entity';
import { computeFingerprint } from './compute-fingerprint';
import { EvaluateAlertsUseCase } from '../../alerts/application/evaluate-alerts.use-case';

export interface GroupEventInput {
  projectId: string;
  exceptionType: string;
  stack: string;
  message: string;
  level: IssueLevel;
  timestamp: Date;
}

@Injectable()
export class GroupEventIntoIssueUseCase {
  constructor(
    @Inject(ISSUE_REPOSITORY) private readonly issues: IssueRepository,
    private readonly evaluateAlerts: EvaluateAlertsUseCase,
  ) {}

  async execute(input: GroupEventInput): Promise<Issue> {
    const fingerprint = computeFingerprint(input);
    const existing = await this.issues.findByFingerprint(input.projectId, fingerprint);

    if (!existing) {
      const issue = await this.issues.create({
        projectId: input.projectId,
        fingerprint,
        title: input.exceptionType === 'Message' ? input.message : `${input.exceptionType}: ${input.message}`,
        level: input.level,
        firstSeen: input.timestamp,
        lastSeen: input.timestamp,
      });
      await this.evaluateAlerts.execute({
        projectId: input.projectId,
        trigger: 'issue_created',
        subject: `[amonitor] New issue: ${issue.title}`,
        message: `A new issue was reported: ${issue.title}`,
      });
      return issue;
    }

    const updated = await this.issues.recordOccurrence(existing.id, input.timestamp);
    if (updated.status === 'resolved') {
      return this.issues.updateStatus(updated.id, 'unresolved');
    }
    return updated;
  }
}
