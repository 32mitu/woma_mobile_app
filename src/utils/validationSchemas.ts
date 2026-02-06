import { z } from 'zod';

// --- 認証関連 ---

export const loginSchema = z.object({
    email: z.string().email({ message: '有効なメールアドレスを入力してください' }),
    password: z.string().min(6, { message: 'パスワードは6文字以上で入力してください' }),
});

export const signupSchema = loginSchema.extend({
    username: z.string().min(1, { message: 'ユーザー名は必須です' }),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;


// --- プロフィール関連 ---

// 入力は文字列として受け取り、送信時に数値変換するパターン
export const profileSchema = z.object({
    username: z.string().min(1, { message: '名前を入力してください' }),
    bio: z.string().max(160, { message: '自己紹介は160文字以内で入力してください' }).optional(),
    // 数値入力は "文字列として検証" し、空文字を許容する実装がUI的にスムーズです
    height: z.string()
        .regex(/^\d*(\.\d+)?$/, { message: '半角数字で入力してください' })
        .transform(val => val === '' ? null : Number(val))
        .optional(),
    weight: z.string()
        .regex(/^\d*(\.\d+)?$/, { message: '半角数字で入力してください' })
        .transform(val => val === '' ? null : Number(val))
        .optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;


// --- 記録関連 ---

export const recordSchema = z.object({
    weight: z.string()
        .regex(/^\d*(\.\d+)?$/, { message: '正しい数値を入力してください' })
        .optional(),
    comment: z.string().max(500, { message: 'コメントは500文字以内で入力してください' }).optional(),
    postToTimeline: z.boolean().default(true),
});

export type RecordFormData = z.infer<typeof recordSchema>;


// --- グループ関連 ---

export const groupCreateSchema = z.object({
    name: z.string().min(1, { message: 'グループ名は必須です' }).max(30, { message: '30文字以内で入力してください' }),
    description: z.string().max(200, { message: '説明は200文字以内で入力してください' }).optional(),
    // 画像はフォームデータとしてではなく、stateで管理して送信時に紐付ける想定
});

export type GroupCreateFormData = z.infer<typeof groupCreateSchema>;


// --- 運動種目作成関連 (新規追加) ---

export const createExerciseTypeSchema = z.object({
    name: z.string().min(1, { message: '運動名を入力してください' }),
    // 数値入力（文字列として受け取り変換）
    low: z.string().min(1, { message: '入力必須です' }).regex(/^\d+(\.\d+)?$/, { message: '半角数字のみ' }),
    mid: z.string().min(1, { message: '入力必須です' }).regex(/^\d+(\.\d+)?$/, { message: '半角数字のみ' }),
    high: z.string().min(1, { message: '入力必須です' }).regex(/^\d+(\.\d+)?$/, { message: '半角数字のみ' }),
});

export type CreateExerciseTypeFormData = z.infer<typeof createExerciseTypeSchema>;