import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY, UserRepository } from '../../users/domain/user-repository.port';
import { SafeUser, toSafeUser } from '../../users/domain/user.entity';

@Injectable()
export class ListAllUsersUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  async execute(): Promise<SafeUser[]> {
    const users = await this.users.listAll();
    return users.map(toSafeUser);
  }
}
