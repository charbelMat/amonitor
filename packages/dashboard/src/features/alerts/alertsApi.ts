import { api } from '../../app/api';

export type AlertTrigger = 'issue_created' | 'uptime_down';
export type AlertChannel = 'email' | 'webhook';

export interface AlertRule {
  id: string;
  projectId: string;
  name: string;
  trigger: AlertTrigger;
  channel: AlertChannel;
  target: string;
  createdAt: string;
}

interface ProjectScope {
  organizationId: string;
  projectId: string;
}

export const alertsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listAlertRules: builder.query<AlertRule[], ProjectScope>({
      query: ({ organizationId, projectId }) =>
        `/organizations/${organizationId}/projects/${projectId}/alert-rules`,
      providesTags: ['AlertRule'],
    }),
    createAlertRule: builder.mutation<
      AlertRule,
      ProjectScope & { name: string; trigger: AlertTrigger; channel: AlertChannel; target: string }
    >({
      query: ({ organizationId, projectId, ...body }) => ({
        url: `/organizations/${organizationId}/projects/${projectId}/alert-rules`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AlertRule'],
    }),
    deleteAlertRule: builder.mutation<void, ProjectScope & { ruleId: string }>({
      query: ({ organizationId, projectId, ruleId }) => ({
        url: `/organizations/${organizationId}/projects/${projectId}/alert-rules/${ruleId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AlertRule'],
    }),
  }),
});

export const { useListAlertRulesQuery, useCreateAlertRuleMutation, useDeleteAlertRuleMutation } =
  alertsApi;
