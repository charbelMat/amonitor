import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ISSUE_REPOSITORY, IssueRepository } from '../domain/issue-repository.port';
import { Issue, IssueStatus } from '../domain/issue.entity';

@Injectable()
export class UpdateIssueStatusUseCase {
  constructor(@Inject(ISSUE_REPOSITORY) private readonly issues: IssueRepository) {}

  async execute(issueId: string, status: IssueStatus): Promise<Issue> {
    const issue = await this.issues.findById(issueId);
    if (!issue) {
      throw new NotFoundException('Issue not found');
    }
    return this.issues.updateStatus(issueId, status);
  }
}
