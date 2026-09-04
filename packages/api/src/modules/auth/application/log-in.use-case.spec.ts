import { UnauthorizedException } from '@nestjs/common';
import { LogInUseCase } from './log-in.use-case';
import { InMemoryUserRepository, makeUser } from '../../users/test/in-memory-user-repository';

const fakeHasher = {
  hash: async (plain: string) => `hashed:${plain}`,
  compare: async (plain: string, hash: string) => hash === `hashed:${plain}`,
};

describe('LogInUseCase', () => {
  const existingUser = makeUser({
    email: 'ada@example.com',
    passwordHash: 'hashed:correct-password',
    name: 'Ada',
  });

  it('returns the user when credentials are correct', async () => {
    const users = new InMemoryUserRepository([existingUser]);
    const useCase = new LogInUseCase(users, fakeHasher);

    const result = await useCase.execute({ email: 'ada@example.com', password: 'correct-password' });

    expect(result.id).toBe(existingUser.id);
  });

  it('rejects an unknown email', async () => {
    const users = new InMemoryUserRepository([]);
    const useCase = new LogInUseCase(users, fakeHasher);

    await expect(
      useCase.execute({ email: 'nobody@example.com', password: 'whatever' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects the wrong password without revealing which part was wrong', async () => {
    const users = new InMemoryUserRepository([existingUser]);
    const useCase = new LogInUseCase(users, fakeHasher);

    await expect(
      useCase.execute({ email: 'ada@example.com', password: 'wrong-password' }),
    ).rejects.toThrow('Invalid email or password');
  });
});
