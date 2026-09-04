import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { CreateUserUseCase } from './create-user.use-case';
import { DeleteUserUseCase } from './delete-user.use-case';
import { ResetUserPasswordUseCase } from './reset-user-password.use-case';
import { ListAllUsersUseCase } from './list-all-users.use-case';
import { InMemoryUserRepository, makeUser } from '../../users/test/in-memory-user-repository';

const fakeHasher = {
  hash: async (plain: string) => `hashed:${plain}`,
  compare: async (plain: string, hash: string) => hash === `hashed:${plain}`,
};

describe('CreateUserUseCase', () => {
  it('creates a user forced to change the admin-chosen password on first login', async () => {
    const users = new InMemoryUserRepository();
    const useCase = new CreateUserUseCase(users, fakeHasher);

    const user = await useCase.execute({ email: 'new@x.com', name: 'New', password: 'temp-pass123' });

    expect(user.mustChangePassword).toBe(true);
    expect(user.isAdmin).toBe(false);
    expect(user.passwordHash).toBe('hashed:temp-pass123');
  });

  it('rejects creating a user with an email that already exists', async () => {
    const users = new InMemoryUserRepository([makeUser({ email: 'taken@x.com' })]);
    const useCase = new CreateUserUseCase(users, fakeHasher);

    await expect(
      useCase.execute({ email: 'taken@x.com', name: 'New', password: 'temp-pass123' }),
    ).rejects.toThrow(ConflictException);
  });
});

describe('ListAllUsersUseCase', () => {
  it('returns users without their password hash', async () => {
    const users = new InMemoryUserRepository([makeUser({ passwordHash: 'secret' })]);
    const useCase = new ListAllUsersUseCase(users);

    const result = await useCase.execute();

    expect(result[0]).not.toHaveProperty('passwordHash');
  });
});

describe('DeleteUserUseCase', () => {
  it('deletes another user', async () => {
    const target = makeUser();
    const users = new InMemoryUserRepository([target]);
    const useCase = new DeleteUserUseCase(users);

    await useCase.execute('some-admin-id', target.id);

    expect(await users.findById(target.id)).toBeNull();
  });

  it('refuses to let an admin delete their own account', async () => {
    const admin = makeUser({ isAdmin: true });
    const users = new InMemoryUserRepository([admin]);
    const useCase = new DeleteUserUseCase(users);

    await expect(useCase.execute(admin.id, admin.id)).rejects.toThrow(BadRequestException);
  });

  it('throws NotFoundException for an unknown target user', async () => {
    const users = new InMemoryUserRepository([]);
    const useCase = new DeleteUserUseCase(users);

    await expect(useCase.execute('admin-id', 'unknown-id')).rejects.toThrow(NotFoundException);
  });
});

describe('ResetUserPasswordUseCase', () => {
  it('sets a new password hash and forces a change on next login', async () => {
    const target = makeUser({ mustChangePassword: false });
    const users = new InMemoryUserRepository([target]);
    const useCase = new ResetUserPasswordUseCase(users, fakeHasher);

    const updated = await useCase.execute(target.id, 'brand-new-pass');

    expect(updated.passwordHash).toBe('hashed:brand-new-pass');
    expect(updated.mustChangePassword).toBe(true);
  });
});
