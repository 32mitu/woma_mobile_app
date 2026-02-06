import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types'; // 作成した型定義をインポート

type AuthState = {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;

    setUser: (user: User | null) => void;
    updateUser: (updates: Partial<User>) => void;
    setLoading: (loading: boolean) => void;
    logout: () => void;
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isLoading: true,
            isAuthenticated: false,

            // ユーザー情報をセット（ログイン時など）
            setUser: (user) => set({
                user,
                isAuthenticated: !!user,
                isLoading: false
            }),

            // ユーザー情報の一部更新（プロフィール編集時など）
            updateUser: (updates) => set((state) => ({
                user: state.user ? { ...state.user, ...updates } : null
            })),

            // ローディング状態の変更
            setLoading: (loading) => set({ isLoading: loading }),

            // ログアウト（全データクリア）
            logout: () => set({
                user: null,
                isAuthenticated: false
            }),
        }),
        {
            name: 'woma-auth-storage', // 保存時のキー名
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ user: state.user }), // user情報のみ永続化
        }
    )
);