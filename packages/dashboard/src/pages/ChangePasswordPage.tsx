import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useChangePasswordMutation } from '../features/auth/authApi';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { setCredentials } from '../features/auth/authSlice';

export function ChangePasswordPage() {
  const mustChangePassword = useAppSelector((s) => s.auth.user?.mustChangePassword);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changePassword, { isLoading, error }] = useChangePasswordMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const result = await changePassword({ currentPassword, newPassword }).unwrap();
    dispatch(setCredentials(result));
    navigate('/issues');
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white text-sm font-bold">
            n
          </span>
          <span className="text-lg font-semibold tracking-tight">node-monitor</span>
        </div>

        <Card className="p-6">
          <h1 className="text-base font-semibold mb-1">Change your password</h1>
          {mustChangePassword ? (
            <p className="text-sm text-warning mb-5">
              You must set a new password before continuing.
            </p>
          ) : (
            <p className="text-sm text-muted mb-5">Choose a new password for your account.</p>
          )}

          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <Input
              label="Current password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoFocus
            />
            <Input
              label="New password"
              type="password"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              hint="At least 8 characters."
              required
            />
            {error && (
              <p className="text-sm text-danger">
                {'data' in error && (error.data as any)?.message
                  ? (error.data as any).message
                  : 'Could not change password'}
              </p>
            )}
            <Button size="md" variant="primary" type="submit" disabled={isLoading}>
              {isLoading ? 'Changing…' : 'Change password'}
            </Button>
            {!mustChangePassword && (
              <Button size="md" variant="ghost" type="button" onClick={() => navigate('/issues')}>
                Cancel
              </Button>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
}
