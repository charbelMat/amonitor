import { api } from '../../app/api';

export interface UptimeMonitor {
  id: string;
  projectId: string;
  name: string;
  url: string;
  intervalSeconds: number;
  expectedStatus: number;
  createdAt: string;
}

export interface UptimeCheck {
  id: string;
  monitorId: string;
  projectId: string;
  timestamp: string;
  statusCode: number;
  latencyMs: number;
  success: boolean;
}

export interface MonitorWithStatus {
  monitor: UptimeMonitor;
  latestCheck: UptimeCheck | null;
}

interface ProjectScope {
  organizationId: string;
  projectId: string;
}

export const uptimeApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listMonitors: builder.query<MonitorWithStatus[], ProjectScope>({
      query: ({ organizationId, projectId }) =>
        `/organizations/${organizationId}/projects/${projectId}/uptime-monitors`,
      providesTags: ['UptimeMonitor'],
    }),
    createMonitor: builder.mutation<
      UptimeMonitor,
      ProjectScope & { name: string; url: string; intervalSeconds: number; expectedStatus: number }
    >({
      query: ({ organizationId, projectId, ...body }) => ({
        url: `/organizations/${organizationId}/projects/${projectId}/uptime-monitors`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['UptimeMonitor'],
    }),
    deleteMonitor: builder.mutation<void, ProjectScope & { monitorId: string }>({
      query: ({ organizationId, projectId, monitorId }) => ({
        url: `/organizations/${organizationId}/projects/${projectId}/uptime-monitors/${monitorId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['UptimeMonitor'],
    }),
  }),
});

export const { useListMonitorsQuery, useCreateMonitorMutation, useDeleteMonitorMutation } = uptimeApi;
