import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'users' })
export class UserOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'boolean', name: 'is_admin', default: false })
  isAdmin!: boolean;

  @Column({ type: 'boolean', name: 'must_change_password', default: false })
  mustChangePassword!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
