import { PropsWithChildren, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './hooks';
import { useRefreshMutation } from '../features/auth/authApi';
import { setCredentials, clearCredentials } from '../features/auth/authSlice';

/**
 * The access token only lives in memory (redux), so a page reload loses it.
 * On mount, try to silently restore the session from the httpOnly refresh
 * cookie before rendering routes, so a reload doesn't bounce a logged-in
 * user to /login.
 */
export function AuthBootstrap({ children }: PropsWithChildren) {
  const bootstrapped = useAppSelector((s) => s.auth.bootstrapped);
  const dispatch = useAppDispatch();
  const [refresh] = useRefreshMutation();

  useEffect(() => {
    refresh()
      .unwrap()
      .then((result) => dispatch(setCredentials(result)))
      .catch(() => dispatch(clearCredentials()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!bootstrapped) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
