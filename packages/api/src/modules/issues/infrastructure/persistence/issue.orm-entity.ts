import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { IssueLevel, IssueStatus } from '../../domain/issue.entity';

@Entity({ name: 'issues' })
@Index(['projectId', 'fingerprint'], { unique: true })
export class IssueOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'project_id' })
  projectId!: string;

  @Column({ type: 'varchar', length: 64 })
  fingerprint!: string;

  @Column({ type: 'varchar', length: 500 })
  title!: string;

  @Column({ type: 'varchar', length: 20 })
  level!: IssueLevel;

  @Column({ type: 'varchar', length: 20, default: 'unresolved' })
  status!: IssueStatus;

  @Column({ type: 'timestamptz', name: 'first_seen' })
  firstSeen!: Date;

  @Column({ type: 'timestamptz', name: 'last_seen' })
  lastSeen!: Date;

  @Column({ type: 'int', name: 'event_count', default: 1 })
  eventCount!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
