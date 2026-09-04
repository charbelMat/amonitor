import type { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from './hooks';

/**
 * Blocks access to normal app pages while the user has a pending forced
 * password change (fresh admin-created accounts, admin-reset passwords).
 * Wrap every protected route except /change-password itself with this.
 */
export function RequirePasswordChange({ children }: PropsWithChildren) {
  const mustChangePassword = useAppSelector((s) => s.auth.user?.mustChangePassword);
  if (mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }
  return <>{children}</>;
}
