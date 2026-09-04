import { authReducer, setCredentials, clearCredentials, SafeUser } from './authSlice';

const user: SafeUser = {
  id: '1',
  email: 'a@b.com',
  name: 'Ada',
  isAdmin: false,
  mustChangePassword: false,
  createdAt: '2026-01-01T00:00:00Z',
};

describe('authSlice', () => {
  it('starts unauthenticated and not yet bootstrapped', () => {
    const state = authReducer(undefined, { type: '@@INIT' });
    expect(state).toEqual({ accessToken: null, user: null, bootstrapped: false });
  });

  it('setCredentials stores the token and user, and marks bootstrapped', () => {
    const state = authReducer(undefined, setCredentials({ accessToken: 'tok', user }));
    expect(state).toEqual({ accessToken: 'tok', user, bootstrapped: true });
  });

  it('clearCredentials removes the session but still marks bootstrapped', () => {
    const loggedIn = authReducer(undefined, setCredentials({ accessToken: 'tok', user }));
    const state = authReducer(loggedIn, clearCredentials());
    expect(state).toEqual({ accessToken: null, user: null, bootstrapped: true });
  });
});
