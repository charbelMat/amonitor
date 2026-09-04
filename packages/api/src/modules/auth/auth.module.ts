import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { LogInUseCase } from './application/log-in.use-case';
import { RefreshSessionUseCase } from './application/refresh-session.use-case';
import { ChangePasswordUseCase } from './application/change-password.use-case';
import { TOKEN_SERVICE } from './application/token.port';
import { JwtTokenService } from './infrastructure/jwt-token.service';
import { JwtStrategy } from './infrastructure/jwt.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PassportModule, JwtModule.register({}), UsersModule],
  controllers: [AuthController],
  providers: [
    LogInUseCase,
    RefreshSessionUseCase,
    ChangePasswordUseCase,
    JwtStrategy,
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
  ],
})
export class AuthModule {}
