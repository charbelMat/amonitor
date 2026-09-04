import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserData, UpdateUserData, UserRepository } from '../../domain/user-repository.port';
import { User } from '../../domain/user.entity';
import { UserOrmEntity } from './user.orm-entity';

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserOrmEntity) private readonly repo: Repository<UserOrmEntity>,
  ) {}

  async findById(id: string): Promise<User | null> {
    const entity = await this.repo.findOneBy({ id });
    return entity ? this.toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.repo.findOneBy({ email });
    return entity ? this.toDomain(entity) : null;
  }

  async create(data: CreateUserData): Promise<User> {
    const entity = this.repo.create(data);
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    const entity = await this.repo.findOneBy({ id });
    if (!entity) {
      throw new NotFoundException('User not found');
    }
    Object.assign(entity, data);
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async listAll(): Promise<User[]> {
    const entities = await this.repo.find({ order: { createdAt: 'ASC' } });
    return entities.map((e) => this.toDomain(e));
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete({ id });
  }

  async count(): Promise<number> {
    return this.repo.count();
  }

  private toDomain(entity: UserOrmEntity): User {
    return {
      id: entity.id,
      email: entity.email,
      passwordHash: entity.passwordHash,
      name: entity.name,
      isAdmin: entity.isAdmin,
      mustChangePassword: entity.mustChangePassword,
      createdAt: entity.createdAt,
    };
  }
}
