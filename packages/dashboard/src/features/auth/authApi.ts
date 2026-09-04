import { api } from '../../app/api';
import { SafeUser } from './authSlice';

export interface AuthResponse {
  user: SafeUser;
  accessToken: string;
}

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    logIn: builder.mutation<AuthResponse, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    logOut: builder.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
    refresh: builder.mutation<AuthResponse, void>({
      query: () => ({ url: '/auth/refresh', method: 'POST' }),
    }),
    changePassword: builder.mutation<AuthResponse, { currentPassword: string; newPassword: string }>({
      query: (body) => ({ url: '/auth/change-password', method: 'POST', body }),
    }),
  }),
});

export const { useLogInMutation, useLogOutMutation, useRefreshMutation, useChangePasswordMutation } =
  authApi;
