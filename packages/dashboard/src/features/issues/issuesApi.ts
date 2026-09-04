import { api } from '../../app/api';

export type IssueStatus = 'unresolved' | 'resolved' | 'ignored';
export type IssueLevel = 'error' | 'warning' | 'info';

export interface Issue {
  id: string;
  projectId: string;
  fingerprint: string;
  title: string;
  level: IssueLevel;
  status: IssueStatus;
  firstSeen: string;
  lastSeen: string;
  eventCount: number;
}

export interface Breadcrumb {
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
  timestamp: string;
  message: string;
  exceptionType: string;
  stackTrace: string;
  level: IssueLevel;
  environment: string;
  tags: Record<string, string>;
  breadcrumbs: Breadcrumb[];
}

export interface IssueDetail {
  issue: Issue;
  events: IssueEvent[];
}

interface ProjectScope {
  organizationId: string;
  projectId: string;
}

export const issuesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listIssues: builder.query<Issue[], ProjectScope>({
      query: ({ organizationId, projectId }) =>
        `/organizations/${organizationId}/projects/${projectId}/issues`,
      providesTags: (result) =>
        result
          ? [...result.map((i) => ({ type: 'Issue' as const, id: i.id })), 'Issue']
          : ['Issue'],
    }),
    getIssue: builder.query<IssueDetail, ProjectScope & { issueId: string }>({
      query: ({ organizationId, projectId, issueId }) =>
        `/organizations/${organizationId}/projects/${projectId}/issues/${issueId}`,
      providesTags: (_result, _error, { issueId }) => [{ type: 'Issue', id: issueId }],
    }),
    updateIssueStatus: builder.mutation<Issue, ProjectScope & { issueId: string; status: IssueStatus }>({
      query: ({ organizationId, projectId, issueId, status }) => ({
        url: `/organizations/${organizationId}/projects/${projectId}/issues/${issueId}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_result, _error, { issueId }) => [{ type: 'Issue', id: issueId }, 'Issue'],
    }),
  }),
});

export const { useListIssuesQuery, useGetIssueQuery, useUpdateIssueStatusMutation } = issuesApi;
