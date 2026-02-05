'use client';

import { useDispatch, useSelector, useStore, TypedUseSelectorHook } from 'react-redux';
import type { AppDispatch, AppStore, RootState } from './store';

// Hooks tipados para usar no lugar dos hooks padrão do react-redux
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppStore: () => AppStore = useStore;
