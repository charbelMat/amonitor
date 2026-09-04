import type { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from './hooks';

export function RequireAuth({ children }: PropsWithChildren) {
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
