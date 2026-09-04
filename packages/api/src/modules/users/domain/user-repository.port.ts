import { User } from './user.entity';

export const USER_REPOSITORY = 'USER_REPOSITORY';

export interface CreateUserData {
  email: string;
  passwordHash: string;
  name: string;
  isAdmin?: boolean;
  mustChangePassword?: boolean;
}

export interface UpdateUserData {
  passwordHash?: string;
  mustChangePassword?: boolean;
  isAdmin?: boolean;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User>;
  listAll(): Promise<User[]>;
  delete(id: string): Promise<void>;
  count(): Promise<number>;
}
