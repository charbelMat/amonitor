import { IssueEvent } from './event.entity';

export const EVENT_STORE = 'EVENT_STORE';

export interface EventStore {
  insert(event: IssueEvent): Promise<void>;
  listForIssue(issueId: string, limit?: number): Promise<IssueEvent[]>;
}
