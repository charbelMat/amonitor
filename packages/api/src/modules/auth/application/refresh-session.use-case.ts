import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { USER_REPOSITORY, UserRepository } from '../../users/domain/user-repository.port';
import { TOKEN_SERVICE, TokenService } from './token.port';
import { User } from '../../users/domain/user.entity';

@Injectable()
export class RefreshSessionUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
  ) {}

  async execute(refreshToken: string): Promise<User> {
    let payload: { sub: string };
    try {
      payload = this.tokens.verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.users.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return user;
  }
}
