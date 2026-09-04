import { api } from '../../app/api';

export interface SpanRow {
  id: string;
  traceId: string;
  parentSpanId: string;
  projectId: string;
  transactionName: string;
  op: string;
  description: string;
  startTime: string;
  endTime: string;
  durationMs: number;
  isTransaction: boolean;
}

interface ProjectScope {
  organizationId: string;
  projectId: string;
}

export const performanceApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listTransactions: builder.query<SpanRow[], ProjectScope>({
      query: ({ organizationId, projectId }) =>
        `/organizations/${organizationId}/projects/${projectId}/performance/transactions`,
      providesTags: ['Transaction'],
    }),
    getTrace: builder.query<SpanRow[], ProjectScope & { traceId: string }>({
      query: ({ organizationId, projectId, traceId }) =>
        `/organizations/${organizationId}/projects/${projectId}/performance/traces/${traceId}`,
    }),
  }),
});

export const { useListTransactionsQuery, useGetTraceQuery } = performanceApi;
