import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type UiState = {
    theme: 'light' | 'dark' | 'system';
    language: 'ja' | 'en';
    isGlobalLoading: boolean;

    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    setLanguage: (lang: 'ja' | 'en') => void;
    setGlobalLoading: (loading: boolean) => void;
};

export const useUiStore = create<UiState>()(
    persist(
        (set) => ({
            theme: 'system',
            language: 'ja',
            isGlobalLoading: false,

            setTheme: (theme) => set({ theme }),
            setLanguage: (language) => set({ language }),
            setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),
        }),
        {
            name: 'woma-ui-storage', // 保存時のキー名
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                theme: state.theme,
                language: state.language
            }), // Loading状態は永続化しない
        }
    )
);