import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { USER_REPOSITORY } from './domain/user-repository.port';
import { PASSWORD_HASHER } from './application/password-hasher.port';
import { TypeOrmUserRepository } from './infrastructure/persistence/typeorm-user.repository';
import { BcryptPasswordHasher } from './infrastructure/bcrypt-password-hasher';
import { UserOrmEntity } from './infrastructure/persistence/user.orm-entity';
import { SeedDefaultAdminService } from './infrastructure/seed-default-admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserOrmEntity])],
  providers: [
    { provide: USER_REPOSITORY, useClass: TypeOrmUserRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    SeedDefaultAdminService,
  ],
  exports: [USER_REPOSITORY, PASSWORD_HASHER],
})
export class UsersModule {}
