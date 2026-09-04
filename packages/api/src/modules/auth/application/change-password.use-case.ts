import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { USER_REPOSITORY, UserRepository } from '../../users/domain/user-repository.port';
import { PASSWORD_HASHER, PasswordHasher } from '../../users/application/password-hasher.port';
import { User } from '../../users/domain/user.entity';

export interface ChangePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async execute({ userId, currentPassword, newPassword }: ChangePasswordInput): Promise<User> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }

    const matches = await this.hasher.compare(currentPassword, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await this.hasher.hash(newPassword);
    return this.users.update(userId, { passwordHash, mustChangePassword: false });
  }
}
