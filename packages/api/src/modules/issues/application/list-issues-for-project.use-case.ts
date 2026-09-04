import { Inject, Injectable } from '@nestjs/common';
import { ISSUE_REPOSITORY, IssueRepository } from '../domain/issue-repository.port';
import { Issue } from '../domain/issue.entity';

@Injectable()
export class ListIssuesForProjectUseCase {
  constructor(@Inject(ISSUE_REPOSITORY) private readonly issues: IssueRepository) {}

  execute(projectId: string): Promise<Issue[]> {
    return this.issues.listForProject(projectId);
  }
}
