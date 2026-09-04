export const TOKEN_SERVICE = 'TOKEN_SERVICE';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  isAdmin: boolean;
  mustChangePassword: boolean;
}

export interface RefreshTokenPayload {
  sub: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface TokenService {
  issueTokens(payload: AccessTokenPayload): AuthTokens;
  verifyRefreshToken(token: string): RefreshTokenPayload;
}
