import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ISSUE_REPOSITORY, IssueRepository } from '../domain/issue-repository.port';
import { EVENT_STORE, EventStore } from '../domain/event-store.port';
import { Issue } from '../domain/issue.entity';
import { IssueEvent } from '../domain/event.entity';

export interface IssueDetail {
  issue: Issue;
  events: IssueEvent[];
}

@Injectable()
export class GetIssueDetailUseCase {
  constructor(
    @Inject(ISSUE_REPOSITORY) private readonly issues: IssueRepository,
    @Inject(EVENT_STORE) private readonly events: EventStore,
  ) {}

  async execute(issueId: string): Promise<IssueDetail> {
    const issue = await this.issues.findById(issueId);
    if (!issue) {
      throw new NotFoundException('Issue not found');
    }
    const events = await this.events.listForIssue(issueId, 20);
    return { issue, events };
  }
}
