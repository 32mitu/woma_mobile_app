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
}

// 運動アクティビティ
export interface Activity {
    name: string;
    mets: number;
    duration: number; // 分
    steps?: number;
    calories: number;
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

// 食事アイテム
export interface MealItem {
    name: string;
    calories: number;
    pfc?: { p: number; f: number; c: number };
    source: 'barcode' | 'search' | 'manual';
    amount?: number;
    unit?: string;
}