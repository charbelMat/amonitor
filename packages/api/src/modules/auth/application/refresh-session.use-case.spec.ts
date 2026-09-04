import { randomUUID } from 'node:crypto';
import { UnauthorizedException } from '@nestjs/common';
import { RefreshSessionUseCase } from './refresh-session.use-case';
import { InMemoryUserRepository, makeUser } from '../../users/test/in-memory-user-repository';
import { TokenService } from './token.port';

describe('RefreshSessionUseCase', () => {
  const user = makeUser({ email: 'ada@example.com', passwordHash: 'x', name: 'Ada' });

  it('returns the user for a valid refresh token', async () => {
    const users = new InMemoryUserRepository([user]);
    const tokens: TokenService = {
      issueTokens: jest.fn(),
      verifyRefreshToken: jest.fn().mockReturnValue({ sub: user.id }),
    };
    const useCase = new RefreshSessionUseCase(users, tokens);

    const result = await useCase.execute('a-valid-token');

    expect(result.id).toBe(user.id);
  });

  it('rejects when the token fails verification', async () => {
    const users = new InMemoryUserRepository([user]);
    const tokens: TokenService = {
      issueTokens: jest.fn(),
      verifyRefreshToken: jest.fn().mockImplementation(() => {
        throw new Error('jwt expired');
      }),
    };
    const useCase = new RefreshSessionUseCase(users, tokens);

    await expect(useCase.execute('an-expired-token')).rejects.toThrow(UnauthorizedException);
  });

  it('rejects when the token is valid but the user no longer exists', async () => {
    const users = new InMemoryUserRepository([]);
    const tokens: TokenService = {
      issueTokens: jest.fn(),
      verifyRefreshToken: jest.fn().mockReturnValue({ sub: randomUUID() }),
    };
    const useCase = new RefreshSessionUseCase(users, tokens);

    await expect(useCase.execute('a-token-for-a-deleted-user')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
