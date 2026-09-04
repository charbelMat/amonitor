import { createApi, fetchBaseQuery, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import type { RootState } from './store';
import { clearCredentials, setCredentials } from '../features/auth/authSlice';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: '/api',
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});

/**
 * Wraps the base query so a 401 triggers exactly one refresh attempt (via
 * the httpOnly refresh cookie) before retrying the original request. If the
 * refresh itself fails, the session is cleared so the UI redirects to login.
 */
const baseQueryWithReauth: BaseQueryFn<
  Parameters<typeof rawBaseQuery>[0],
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const refreshResult = await rawBaseQuery(
      { url: '/auth/refresh', method: 'POST' },
      api,
      extraOptions,
    );

    if (refreshResult.data) {
      const { accessToken, user } = refreshResult.data as { accessToken: string; user: any };
      api.dispatch(setCredentials({ accessToken, user }));
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(clearCredentials());
    }
  }

  return result;
};

/**
 * Single RTK Query base API. Domain-specific endpoints (auth, organizations,
 * projects, issues, performance, uptime, alerts) are injected via
 * `.injectEndpoints`, so there is one shared cache/tag space.
 */
export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Health', 'Organization', 'Project', 'Issue', 'Transaction', 'UptimeMonitor', 'AlertRule', 'AdminUser', 'Node'],
  endpoints: () => ({}),
});
