import { api } from '../../app/api';
import { SafeUser } from '../auth/authSlice';

export const adminApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listUsers: builder.query<SafeUser[], void>({
      query: () => '/admin/users',
      providesTags: (result) =>
        result
          ? [...result.map((u) => ({ type: 'AdminUser' as const, id: u.id })), 'AdminUser']
          : ['AdminUser'],
    }),
    createUser: builder.mutation<SafeUser, { email: string; name: string; password: string; isAdmin?: boolean }>({
      query: (body) => ({ url: '/admin/users', method: 'POST', body }),
      invalidatesTags: ['AdminUser'],
    }),
    deleteUser: builder.mutation<void, string>({
      query: (userId) => ({ url: `/admin/users/${userId}`, method: 'DELETE' }),
      invalidatesTags: ['AdminUser'],
    }),
    resetUserPassword: builder.mutation<SafeUser, { userId: string; newPassword: string }>({
      query: ({ userId, newPassword }) => ({
        url: `/admin/users/${userId}/reset-password`,
        method: 'POST',
        body: { newPassword },
      }),
      invalidatesTags: ['AdminUser'],
    }),
  }),
});

export const {
  useListUsersQuery,
  useCreateUserMutation,
  useDeleteUserMutation,
  useResetUserPasswordMutation,
} = adminApi;
