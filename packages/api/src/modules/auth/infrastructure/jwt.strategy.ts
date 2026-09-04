import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AccessTokenPayload } from '../application/token.port';

export interface RequestUser {
  id: string;
  email: string;
  isAdmin: boolean;
  mustChangePassword: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('ACCESS_TOKEN_SECRET') ?? 'dev-access-secret',
    });
  }

  validate(payload: AccessTokenPayload): RequestUser {
    return {
      id: payload.sub,
      email: payload.email,
      isAdmin: payload.isAdmin,
      mustChangePassword: payload.mustChangePassword,
    };
  }
}
