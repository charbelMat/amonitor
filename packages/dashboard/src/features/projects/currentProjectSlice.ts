import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { readStored, writeStored } from '../../lib/storage';

const STORAGE_KEY = 'nm.currentProjectId';

interface CurrentProjectState {
  projectId: string | null;
}

const initialState: CurrentProjectState = {
  projectId: readStored(STORAGE_KEY),
};

const currentProjectSlice = createSlice({
  name: 'currentProject',
  initialState,
  reducers: {
    setCurrentProject(state, action: PayloadAction<string>) {
      state.projectId = action.payload;
      writeStored(STORAGE_KEY, action.payload);
    },
  },
});

export const { setCurrentProject } = currentProjectSlice.actions;
export const currentProjectReducer = currentProjectSlice.reducer;
