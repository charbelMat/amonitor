import { IssueLevel } from './issue.entity';

export interface RawBreadcrumb {
  timestamp: number;
  category: string;
  message: string;
  level: string;
  data?: Record<string, unknown>;
}

export interface IssueEvent {
  id: string;
  projectId: string;
  issueId: string;
  timestamp: Date;
  message: string;
  exceptionType: string;
  stackTrace: string;
  level: IssueLevel;
  environment: string;
  tags: Record<string, string>;
  breadcrumbs: RawBreadcrumb[];
}
