import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { OrganizationRole } from '../../domain/organization.entity';

@Entity({ name: 'organization_members' })
@Index(['organizationId', 'userId'], { unique: true })
export class OrganizationMemberOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'organization_id' })
  organizationId!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'varchar', length: 20 })
  role!: OrganizationRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
