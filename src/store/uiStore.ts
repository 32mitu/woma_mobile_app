import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

// 端末の言語を取得してデフォルトの言語を決定する
const getLocales = Localization.getLocales();
const defaultLanguage = getLocales[0]?.languageCode === 'en' ? 'en' : 'ja';

type UiState = {
    theme: 'light' | 'dark' | 'system';
    language: 'ja' | 'en';
    isGlobalLoading: boolean;
    hasLaunched: boolean;
    _hasHydrated: boolean; // ★追加: ストレージの読み込み完了を判定するフラグ

    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    setLanguage: (lang: 'ja' | 'en') => void;
    setGlobalLoading: (loading: boolean) => void;
    setHasLaunched: (hasLaunched: boolean) => void;
    setHasHydrated: (state: boolean) => void; // ★追加
};

export const useUiStore = create<UiState>()(
    persist(
        (set) => ({
            theme: 'system',
            language: defaultLanguage,
            isGlobalLoading: false,
            hasLaunched: false,
            _hasHydrated: false, // ★初期値はfalse

            setTheme: (theme) => set({ theme }),
            setLanguage: (language) => set({ language }),
            setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),
            setHasLaunched: (hasLaunched) => set({ hasLaunched }),
            setHasHydrated: (state) => set({ _hasHydrated: state }), // ★追加
        }),
        {
            name: 'woma-ui-storage', // 保存時のキー名
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                theme: state.theme,
                language: state.language,
                hasLaunched: state.hasLaunched
            }), // Loading状態や_hasHydratedは永続化しない
            onRehydrateStorage: () => (state) => {
                // ★追加：AsyncStorageからのデータ読み込みが終わったらフラグをtrueにする
                if (state) {
                    state.setHasHydrated(true);
                }
            }
        }
    )
);