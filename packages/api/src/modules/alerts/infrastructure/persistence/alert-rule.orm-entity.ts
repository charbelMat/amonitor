import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { AlertChannel, AlertTrigger } from '../../domain/alert-rule.entity';

@Entity({ name: 'alert_rules' })
export class AlertRuleOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'project_id' })
  projectId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 30 })
  trigger!: AlertTrigger;

  @Column({ type: 'varchar', length: 20 })
  channel!: AlertChannel;

  @Column({ type: 'varchar', length: 500 })
  target!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
