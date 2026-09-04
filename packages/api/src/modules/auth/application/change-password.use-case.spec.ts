import { UnauthorizedException } from '@nestjs/common';
import { ChangePasswordUseCase } from './change-password.use-case';
import { InMemoryUserRepository, makeUser } from '../../users/test/in-memory-user-repository';

const fakeHasher = {
  hash: async (plain: string) => `hashed:${plain}`,
  compare: async (plain: string, hash: string) => hash === `hashed:${plain}`,
};

describe('ChangePasswordUseCase', () => {
  it('updates the password and clears mustChangePassword when the current password matches', async () => {
    const user = makeUser({ passwordHash: 'hashed:old-pass', mustChangePassword: true });
    const users = new InMemoryUserRepository([user]);
    const useCase = new ChangePasswordUseCase(users, fakeHasher);

    const updated = await useCase.execute({
      userId: user.id,
      currentPassword: 'old-pass',
      newPassword: 'new-password123',
    });

    expect(updated.passwordHash).toBe('hashed:new-password123');
    expect(updated.mustChangePassword).toBe(false);
  });

  it('rejects when the current password is wrong', async () => {
    const user = makeUser({ passwordHash: 'hashed:old-pass' });
    const users = new InMemoryUserRepository([user]);
    const useCase = new ChangePasswordUseCase(users, fakeHasher);

    await expect(
      useCase.execute({ userId: user.id, currentPassword: 'wrong', newPassword: 'new-password123' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
