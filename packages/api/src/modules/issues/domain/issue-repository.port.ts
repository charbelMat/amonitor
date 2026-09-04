import { Issue, IssueLevel, IssueStatus } from './issue.entity';

export const ISSUE_REPOSITORY = 'ISSUE_REPOSITORY';

export interface CreateIssueData {
  projectId: string;
  fingerprint: string;
  title: string;
  level: IssueLevel;
  firstSeen: Date;
  lastSeen: Date;
}

export interface IssueRepository {
  create(data: CreateIssueData): Promise<Issue>;
  findById(id: string): Promise<Issue | null>;
  findByFingerprint(projectId: string, fingerprint: string): Promise<Issue | null>;
  recordOccurrence(id: string, timestamp: Date): Promise<Issue>;
  updateStatus(id: string, status: IssueStatus): Promise<Issue>;
  listForProject(projectId: string): Promise<Issue[]>;
}
