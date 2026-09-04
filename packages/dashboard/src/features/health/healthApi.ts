import { api } from '../../app/api';

export interface HealthStatus {
  status: string;
  timestamp: string;
}

export const healthApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getHealth: builder.query<HealthStatus, void>({
      query: () => '/health',
      providesTags: ['Health'],
    }),
  }),
});

export const { useGetHealthQuery } = healthApi;
