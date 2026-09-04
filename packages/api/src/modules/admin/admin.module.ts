import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { CreateUserUseCase } from './application/create-user.use-case';
import { ListAllUsersUseCase } from './application/list-all-users.use-case';
import { DeleteUserUseCase } from './application/delete-user.use-case';
import { ResetUserPasswordUseCase } from './application/reset-user-password.use-case';
import { AdminGuard } from './infrastructure/admin.guard';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [AdminController],
  providers: [CreateUserUseCase, ListAllUsersUseCase, DeleteUserUseCase, ResetUserPasswordUseCase, AdminGuard],
})
export class AdminModule {}
