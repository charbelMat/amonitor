import { configureStore } from '@reduxjs/toolkit';
import { api } from './api';
import { authReducer } from '../features/auth/authSlice';
import { currentOrganizationReducer } from '../features/organizations/currentOrganizationSlice';
import { currentProjectReducer } from '../features/projects/currentProjectSlice';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: authReducer,
    currentOrganization: currentOrganizationReducer,
    currentProject: currentProjectReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
