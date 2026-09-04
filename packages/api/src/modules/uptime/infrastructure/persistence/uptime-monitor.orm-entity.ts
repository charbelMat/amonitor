import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'uptime_monitors' })
export class UptimeMonitorOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'project_id' })
  projectId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 2000 })
  url!: string;

  @Column({ type: 'int', name: 'interval_seconds' })
  intervalSeconds!: number;

  @Column({ type: 'int', name: 'expected_status', default: 200 })
  expectedStatus!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
