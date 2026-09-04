import { api } from '../../app/api';

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  dsnKey: string;
  createdAt: string;
}

export const projectsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listProjects: builder.query<Project[], string>({
      query: (organizationId) => `/organizations/${organizationId}/projects`,
      providesTags: (result) =>
        result
          ? [...result.map((p) => ({ type: 'Project' as const, id: p.id })), 'Project']
          : ['Project'],
    }),
    createProject: builder.mutation<Project, { organizationId: string; name: string }>({
      query: ({ organizationId, ...body }) => ({
        url: `/organizations/${organizationId}/projects`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Project'],
    }),
    rotateProjectKey: builder.mutation<Project, { organizationId: string; projectId: string }>({
      query: ({ organizationId, projectId }) => ({
        url: `/organizations/${organizationId}/projects/${projectId}/rotate-key`,
        method: 'POST',
      }),
      invalidatesTags: ['Project'],
    }),
  }),
});

export const { useListProjectsQuery, useCreateProjectMutation, useRotateProjectKeyMutation } =
  projectsApi;
