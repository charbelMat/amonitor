import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useLogInMutation } from '../features/auth/authApi';
import { useAppDispatch } from '../app/hooks';
import { setCredentials } from '../features/auth/authSlice';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [logIn, { isLoading, error }] = useLogInMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const result = await logIn({ email, password }).unwrap();
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
          <h1 className="text-base font-semibold mb-5">Sign in to your account</h1>
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-sm text-danger">Invalid email or password</p>}
            <Button size="md" variant="primary" type="submit" disabled={isLoading}>
              {isLoading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </Card>

        <p className="text-xs text-faint mt-4 text-center">
          Accounts are created by an administrator — ask yours for access.
        </p>
      </div>
    </div>
  );
}
