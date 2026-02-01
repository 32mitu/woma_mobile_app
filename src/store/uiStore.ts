import { create } from 'zustand';

type UiState = {
    theme: 'light' | 'dark'; // 将来的なダークモード対応用
    isGlobalLoading: boolean;
    setTheme: (theme: 'light' | 'dark') => void;
    setGlobalLoading: (loading: boolean) => void;
};

export const useUiStore = create<UiState>((set) => ({
    theme: 'light',
    isGlobalLoading: false,
    setTheme: (theme) => set({ theme }),
    setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),
}));