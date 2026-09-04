export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  /** Platform-wide admin — independent of any organization's owner/admin/member roles. */
  isAdmin: boolean;
  /** True right after account creation or an admin-triggered password reset. */
  mustChangePassword: boolean;
  createdAt: Date;
}

export type SafeUser = Omit<User, 'passwordHash'>;

export function toSafeUser(user: User): SafeUser {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}
