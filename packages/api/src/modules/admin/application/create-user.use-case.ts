import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY, UserRepository } from '../../users/domain/user-repository.port';
import { PASSWORD_HASHER, PasswordHasher } from '../../users/application/password-hasher.port';
import { User } from '../../users/domain/user.entity';

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  isAdmin?: boolean;
}

/**
 * Self-signup is disabled — this is now the only way a new account gets
 * created. The account starts with `mustChangePassword: true` since an
 * admin (not the user) chose the initial password. Deliberately does not
 * create an organization for the new user: they can create their own via
 * the existing "+ New org" flow once they log in, or an org owner can add
 * them as a member by email.
 */
@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async execute({ email, name, password, isAdmin }: CreateUserInput): Promise<User> {
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await this.hasher.hash(password);
    return this.users.create({
      email,
      name,
      passwordHash,
      isAdmin: isAdmin ?? false,
      mustChangePassword: true,
    });
  }
}
