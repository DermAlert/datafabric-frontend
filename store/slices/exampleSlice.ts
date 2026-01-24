import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Defina o tipo do estado inicial
interface ExampleState {
  value: number;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
}

// Estado inicial
const initialState: ExampleState = {
  value: 0,
  status: 'idle',
};

// Crie o slice
export const exampleSlice = createSlice({
  name: 'example',
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload;
    },
    setStatus: (state, action: PayloadAction<ExampleState['status']>) => {
      state.status = action.payload;
    },
  },
});

// Exporte as actions
export const { increment, decrement, incrementByAmount, setStatus } = exampleSlice.actions;

// Exporte o reducer
export default exampleSlice.reducer;
