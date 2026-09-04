import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  AccessTokenPayload,
  AuthTokens,
  RefreshTokenPayload,
  TokenService,
} from '../application/token.port';

@Injectable()
export class JwtTokenService implements TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  issueTokens(payload: AccessTokenPayload): AuthTokens {
    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('ACCESS_TOKEN_SECRET'),
      expiresIn: this.config.get<string>('ACCESS_TOKEN_TTL', '15m'),
    });
    const refreshToken = this.jwt.sign(
      { sub: payload.sub } satisfies RefreshTokenPayload,
      {
        secret: this.config.get<string>('REFRESH_TOKEN_SECRET'),
        expiresIn: this.config.get<string>('REFRESH_TOKEN_TTL', '7d'),
      },
    );
    return { accessToken, refreshToken };
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    return this.jwt.verify<RefreshTokenPayload>(token, {
      secret: this.config.get<string>('REFRESH_TOKEN_SECRET'),
    });
  }
}
