import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { USER_REPOSITORY, UserRepository } from '../domain/user-repository.port';
import { PASSWORD_HASHER, PasswordHasher } from '../application/password-hasher.port';

export const DEFAULT_ADMIN_EMAIL = 'admin@amonitor.local';
export const DEFAULT_ADMIN_PASSWORD = 'ChangeMe123!';

/**
 * Self-signup is disabled, so a fresh instance would otherwise have no way
 * to log in at all. Seeds one fixed admin account on boot if it doesn't
 * already exist yet, forced to change its password on first login.
 */
@Injectable()
export class SeedDefaultAdminService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedDefaultAdminService.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const existing = await this.users.findByEmail(DEFAULT_ADMIN_EMAIL);
    if (existing) return;

    const passwordHash = await this.hasher.hash(DEFAULT_ADMIN_PASSWORD);
    await this.users.create({
      email: DEFAULT_ADMIN_EMAIL,
      passwordHash,
      name: 'Admin',
      isAdmin: true,
      mustChangePassword: true,
    });

    this.logger.warn(
      `Seeded default admin account: ${DEFAULT_ADMIN_EMAIL} / ${DEFAULT_ADMIN_PASSWORD} — you will be required to change this password on first login.`,
    );
  }
}
