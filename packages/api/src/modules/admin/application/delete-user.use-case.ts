import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY, UserRepository } from '../../users/domain/user-repository.port';

@Injectable()
export class DeleteUserUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  async execute(requestingUserId: string, targetUserId: string): Promise<void> {
    if (requestingUserId === targetUserId) {
      throw new BadRequestException('You cannot delete your own account');
    }
    const user = await this.users.findById(targetUserId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.users.delete(targetUserId);
  }
}
