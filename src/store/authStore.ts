import { create } from 'zustand';

// ユーザー情報の型定義 (既存の型に合わせて調整)
type UserProfile = {
    uid: string;
    username: string;
    displayName?: string;
    photoURL?: string | null;
    email?: string | null;
    weight?: number | string;
    height?: number | string;
    // その他必要なプロパティ
    createdAt?: any;
};

type AuthState = {
    user: UserProfile | null;
    isLoading: boolean;
    setUser: (user: UserProfile | null) => void;
    updateUser: (updates: Partial<UserProfile>) => void;
    setLoading: (loading: boolean) => void;
    logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true,

    // ユーザー情報をセット（ログイン時など）
    setUser: (user) => set({ user }),

    // ユーザー情報の一部更新（プロフィール編集時など）
    updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
    })),

    // ローディング状態の変更
    setLoading: (loading) => set({ isLoading: loading }),

    // ログアウト（初期化）
    logout: () => set({ user: null }),
}));