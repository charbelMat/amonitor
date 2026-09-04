import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { USER_REPOSITORY, UserRepository } from '../../users/domain/user-repository.port';
import { PASSWORD_HASHER, PasswordHasher } from '../../users/application/password-hasher.port';
import { User } from '../../users/domain/user.entity';

export interface LogInInput {
  email: string;
  password: string;
}

const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password';

@Injectable()
export class LogInUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async execute({ email, password }: LogInInput): Promise<User> {
    const user = await this.users.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const matches = await this.hasher.compare(password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    return user;
  }
}
