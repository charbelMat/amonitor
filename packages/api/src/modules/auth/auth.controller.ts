import { Body, Controller, Get, HttpCode, Inject, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { LogInUseCase } from './application/log-in.use-case';
import { RefreshSessionUseCase } from './application/refresh-session.use-case';
import { ChangePasswordUseCase } from './application/change-password.use-case';
import { TOKEN_SERVICE, TokenService } from './application/token.port';
import { LogInDto } from './dto/log-in.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { toSafeUser, User } from '../users/domain/user.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from './infrastructure/jwt.strategy';
import { USER_REPOSITORY, UserRepository } from '../users/domain/user-repository.port';

const REFRESH_COOKIE_NAME = 'am_refresh';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly logIn: LogInUseCase,
    private readonly refreshSession: RefreshSessionUseCase,
    private readonly changePassword: ChangePasswordUseCase,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly config: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(200)
  async logInHandler(@Body() dto: LogInDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.logIn.execute(dto);
    return this.issueSession(user, res);
  }

  @Post('refresh')
  @HttpCode(200)
  async refreshHandler(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token');
    }
    const user = await this.refreshSession.execute(refreshToken);
    return this.issueSession(user, res);
  }

  @Post('logout')
  @HttpCode(204)
  logoutHandler(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async meHandler(@CurrentUser() currentUser: RequestUser) {
    const user = await this.users.findById(currentUser.id);
    if (!user) {
      throw new UnauthorizedException();
    }
    return toSafeUser(user);
  }

  @Post('change-password')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async changePasswordHandler(
    @CurrentUser() currentUser: RequestUser,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.changePassword.execute({
      userId: currentUser.id,
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
    });
    // Re-issue a session so the client immediately gets a token reflecting
    // mustChangePassword: false, instead of carrying the stale flag until
    // the access token naturally expires.
    return this.issueSession(user, res);
  }

  private issueSession(user: User, res: Response) {
    const { accessToken, refreshToken } = this.tokens.issueTokens({
      sub: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      mustChangePassword: user.mustChangePassword,
    });

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: this.config.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { user: toSafeUser(user), accessToken };
  }
}
