import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { readStored, writeStored } from '../../lib/storage';

const STORAGE_KEY = 'nm.currentOrganizationId';

interface CurrentOrganizationState {
  organizationId: string | null;
}

const initialState: CurrentOrganizationState = {
  organizationId: readStored(STORAGE_KEY),
};

const currentOrganizationSlice = createSlice({
  name: 'currentOrganization',
  initialState,
  reducers: {
    setCurrentOrganization(state, action: PayloadAction<string>) {
      state.organizationId = action.payload;
      writeStored(STORAGE_KEY, action.payload);
    },
  },
});

export const { setCurrentOrganization } = currentOrganizationSlice.actions;
export const currentOrganizationReducer = currentOrganizationSlice.reducer;
