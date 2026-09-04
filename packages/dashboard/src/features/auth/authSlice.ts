import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}

interface AuthState {
  accessToken: string | null;
  user: SafeUser | null;
  bootstrapped: boolean;
}

const initialState: AuthState = {
  accessToken: null,
  user: null,
  bootstrapped: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ accessToken: string; user: SafeUser }>) {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      state.bootstrapped = true;
    },
    clearCredentials(state) {
      state.accessToken = null;
      state.user = null;
      state.bootstrapped = true;
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export const authReducer = authSlice.reducer;
