export type IssueStatus = 'unresolved' | 'resolved' | 'ignored';
export type IssueLevel = 'error' | 'warning' | 'info';

export interface Issue {
  id: string;
  projectId: string;
  fingerprint: string;
  title: string;
  level: IssueLevel;
  status: IssueStatus;
  firstSeen: Date;
  lastSeen: Date;
  eventCount: number;
}
