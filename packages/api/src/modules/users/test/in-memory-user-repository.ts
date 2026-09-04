import { randomUUID } from 'node:crypto';
import { CreateUserData, UpdateUserData, UserRepository } from '../domain/user-repository.port';
import { User } from '../domain/user.entity';

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: randomUUID(),
    email: 'user@example.com',
    passwordHash: '',
    name: 'Test User',
    isAdmin: false,
    mustChangePassword: false,
    createdAt: new Date(),
    ...overrides,
  };
}

export class InMemoryUserRepository implements UserRepository {
  constructor(public users: User[] = []) {}

  async findById(id: string) {
    return this.users.find((u) => u.id === id) ?? null;
  }
  async findByEmail(email: string) {
    return this.users.find((u) => u.email === email) ?? null;
  }
  async create(data: CreateUserData) {
    const user = makeUser(data);
    this.users.push(user);
    return user;
  }
  async update(id: string, data: UpdateUserData) {
    const user = this.users.find((u) => u.id === id)!;
    Object.assign(user, data);
    return user;
  }
  async listAll() {
    return this.users;
  }
  async delete(id: string) {
    this.users = this.users.filter((u) => u.id !== id);
  }
  async count() {
    return this.users.length;
  }
}
