import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY, UserRepository } from '../../users/domain/user-repository.port';
import { PASSWORD_HASHER, PasswordHasher } from '../../users/application/password-hasher.port';
import { User } from '../../users/domain/user.entity';

@Injectable()
export class ResetUserPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async execute(targetUserId: string, newPassword: string): Promise<User> {
    const user = await this.users.findById(targetUserId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const passwordHash = await this.hasher.hash(newPassword);
    return this.users.update(targetUserId, { passwordHash, mustChangePassword: true });
  }
}
