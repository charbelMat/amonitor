import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'projects' })
@Index(['organizationId', 'slug'], { unique: true })
export class ProjectOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'organization_id' })
  organizationId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  slug!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64, name: 'dsn_key' })
  dsnKey!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
