import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type UiState = {
    theme: 'light' | 'dark' | 'system';
    language: 'ja' | 'en';
    isGlobalLoading: boolean;
    hasLaunched: boolean;

    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    setLanguage: (lang: 'ja' | 'en') => void;
    setGlobalLoading: (loading: boolean) => void;
    setHasLaunched: (hasLaunched: boolean) => void;
};

export const useUiStore = create<UiState>()(
    persist(
        (set) => ({
            theme: 'system',
            language: 'ja',
            isGlobalLoading: false,
            hasLaunched: false,

            setTheme: (theme) => set({ theme }),
            setLanguage: (language) => set({ language }),
            setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),
            setHasLaunched: (hasLaunched) => set({ hasLaunched }),
        }),
        {
            name: 'woma-ui-storage', // 保存時のキー名
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                theme: state.theme,
                language: state.language,
                hasLaunched: state.hasLaunched
            }), // Loading状態は永続化しない
        }
    )
);