import { Timestamp } from 'firebase/firestore';

// ユーザー情報の型定義
// (旧 UserProfile と互換性を持たせつつ、将来の拡張に対応)
export interface User {
    uid: string;
    name: string;          // 表示名 (旧 username/displayName)
    avatar?: string;       // アイコンURL (旧 photoURL)
    email?: string | null;

    // 身体データ
    weight?: number | string;
    height?: number | string;
    targetWeight?: number;

    // アプリ内ステータス
    blockedUsers?: string[];
    streak?: number;       // 継続日数
    lastLogDate?: string;  // 最終記録日
    badges?: string[];     // 獲得バッジID一覧
    createdAt?: any;       // Firestore Timestamp or Object

    // ★追加: 簡易集計用の統計データ (チームチャレンジ等で使用)
    stats?: {
        totalSteps?: number;    // 累計歩数
        totalCalories?: number; // 累計カロリー
        totalDistance?: number; // 累計距離
    };
}

// 運動アクティビティ
export interface Activity {
    name: string;
    mets: number;
    duration: number; // 分
    steps?: number;
    calories: number;
}

// 食事アイテム
export interface MealItem {
    name: string;
    calories: number;
    pfc?: { p: number; f: number; c: number };
    source: 'barcode' | 'search' | 'manual';
    amount?: number;
    unit?: string;
}

// 記録データ (運動 + 食事)
export interface Record {
    id?: string;
    userId: string;
    createdAt: Timestamp;
    weight?: number;
    comment?: string;
    imageUrls?: string[];

    activities?: Activity[];

    // 食事データ (2/8追加予定)
    mealItems?: MealItem[];
    totalCalories?: number;
}

export type ReactionType = 'like' | 'fire' | 'muscle' | 'clap' | 'love';

// 投稿データの型定義を拡張 (Post.tsxで使っている型と同期させるため、ここにも記載またはPost.tsx側でimport)
export interface PostData {
    id: string;
    userId?: string;
    text: string;
    imageUrls?: string[];
    // 旧仕様互換用
    likes?: number;
    // 新仕様: ユーザーIDをキーにしたリアクションのマップ
    reactions?: Record<string, ReactionType>;
    comments?: number;
    timestamp: any;
    user?: {
        displayName?: string;
        photoURL?: string;
    };
    activities?: {
        name: string;
        duration: number;
        mets?: number;
        steps?: number;
    }[];
}

// チャレンジの型定義 (新規追加)
export interface Challenge {
    id?: string; // サブコレクションや埋め込みオブジェクトの場合に備えて
    type: 'steps' | 'calories' | 'distance'; // 種類
    target: number; // 目標値 (例: 100000歩)
    currentAmount?: number; // 現在の達成値 (キャッシュ用、または計算結果)
    startDate: Timestamp;
    endDate: Timestamp;
    isActive: boolean;
}

// Groupインターフェースの更新
export interface Group {
    id: string;
    name: string;
    description?: string;
    photoURL?: string; // imageURL か photoURL か既存コードに合わせてください
    memberIds: string[];
    ownerId: string;
    createdAt: any;
    // 新規追加
    challenge?: Challenge;
}