import type { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from './hooks';

export function RequireAdmin({ children }: PropsWithChildren) {
  const isAdmin = useAppSelector((s) => s.auth.user?.isAdmin);
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
