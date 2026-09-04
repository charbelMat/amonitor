import { Project } from './project.entity';

export const PROJECT_REPOSITORY = 'PROJECT_REPOSITORY';

export interface CreateProjectData {
  organizationId: string;
  name: string;
  slug: string;
  dsnKey: string;
}

export interface ProjectRepository {
  create(data: CreateProjectData): Promise<Project>;
  findById(id: string): Promise<Project | null>;
  findByDsnKey(dsnKey: string): Promise<Project | null>;
  findBySlugInOrganization(organizationId: string, slug: string): Promise<Project | null>;
  listForOrganization(organizationId: string): Promise<Project[]>;
  updateDsnKey(id: string, dsnKey: string): Promise<Project>;
}
