import { api } from '../../app/api';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export const organizationsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listOrganizations: builder.query<Organization[], void>({
      query: () => '/organizations',
      providesTags: (result) =>
        result
          ? [...result.map((o) => ({ type: 'Organization' as const, id: o.id })), 'Organization']
          : ['Organization'],
    }),
    createOrganization: builder.mutation<Organization, { name: string }>({
      query: (body) => ({ url: '/organizations', method: 'POST', body }),
      invalidatesTags: ['Organization'],
    }),
    addMember: builder.mutation<
      unknown,
      { organizationId: string; email: string; role: 'admin' | 'member' }
    >({
      query: ({ organizationId, ...body }) => ({
        url: `/organizations/${organizationId}/members`,
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useListOrganizationsQuery,
  useCreateOrganizationMutation,
  useAddMemberMutation,
} = organizationsApi;
