import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateUserUseCase } from './application/create-user.use-case';
import { ListAllUsersUseCase } from './application/list-all-users.use-case';
import { DeleteUserUseCase } from './application/delete-user.use-case';
import { ResetUserPasswordUseCase } from './application/reset-user-password.use-case';
import { CreateUserDto } from './dto/create-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from './infrastructure/admin.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../auth/infrastructure/jwt.strategy';
import { toSafeUser } from '../users/domain/user.entity';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/users')
export class AdminController {
  constructor(
    private readonly createUser: CreateUserUseCase,
    private readonly listAllUsers: ListAllUsersUseCase,
    private readonly deleteUser: DeleteUserUseCase,
    private readonly resetUserPassword: ResetUserPasswordUseCase,
  ) {}

  @Get()
  list() {
    return this.listAllUsers.execute();
  }

  @Post()
  async create(@Body() dto: CreateUserDto) {
    const user = await this.createUser.execute(dto);
    return toSafeUser(user);
  }

  @Delete(':userId')
  async delete(@CurrentUser() currentUser: RequestUser, @Param('userId') userId: string) {
    await this.deleteUser.execute(currentUser.id, userId);
    return { deleted: true };
  }

  @Post(':userId/reset-password')
  async resetPassword(@Param('userId') userId: string, @Body() dto: ResetPasswordDto) {
    const user = await this.resetUserPassword.execute(userId, dto.newPassword);
    return toSafeUser(user);
  }
}
