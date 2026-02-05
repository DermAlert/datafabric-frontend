import { configureStore } from '@reduxjs/toolkit';
import exampleSlice from './slices/exampleSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      example: exampleSlice,
    },
  });
};

// Tipos inferidos a partir do store
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
