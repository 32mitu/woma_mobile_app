import { z } from 'zod';

// --- 認証関連 ---

export const loginSchema = z.object({
    email: z.string().email({ message: 'validation.invalidEmail' }),
    password: z.string().min(6, { message: 'validation.passwordTooShort' }),
});

export const signupSchema = loginSchema.extend({
    username: z.string().min(1, { message: 'validation.usernameRequired' }),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;


// --- プロフィール関連 ---

// 入力は文字列として受け取り、送信時に数値変換するパターン
export const profileSchema = z.object({
    username: z.string().min(1, { message: 'validation.nameRequired' }),
    bio: z.string().max(160, { message: 'validation.bioTooLong' }).optional(),
    // 数値入力は "文字列として検証" し、空文字を許容する実装がUI的にスムーズです
    height: z.string()
        .regex(/^\d*(\.\d+)?$/, { message: 'validation.numbersOnly' })
        .transform(val => val === '' ? null : Number(val))
        .optional(),
    weight: z.string()
        .regex(/^\d*(\.\d+)?$/, { message: 'validation.numbersOnly' })
        .transform(val => val === '' ? null : Number(val))
        .optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;


// --- 記録関連 ---

export const recordSchema = z.object({
    weight: z.string()
        .regex(/^\d*(\.\d+)?$/, { message: 'validation.invalidNumber' })
        .optional(),
    comment: z.string().max(500, { message: 'validation.commentTooLong' }).optional(),
    postToTimeline: z.boolean().default(true),
});

export type RecordFormData = z.infer<typeof recordSchema>;


// --- グループ関連 ---

export const groupCreateSchema = z.object({
    name: z.string().min(1, { message: 'validation.groupNameRequired' }).max(30, { message: 'validation.groupNameTooLong' }),
    description: z.string().max(200, { message: 'validation.descriptionTooLong' }).optional(),
    // 画像はフォームデータとしてではなく、stateで管理して送信時に紐付ける想定
});

export type GroupCreateFormData = z.infer<typeof groupCreateSchema>;


// --- 運動種目作成関連 (新規追加) ---

export const createExerciseTypeSchema = z.object({
    name: z.string().min(1, { message: 'validation.exerciseNameRequired' }),
    // 数値入力（文字列として受け取り変換）
    low: z.string().min(1, { message: 'validation.required' }).regex(/^\d+(\.\d+)?$/, { message: 'validation.numbersOnlyShort' }),
    mid: z.string().min(1, { message: 'validation.required' }).regex(/^\d+(\.\d+)?$/, { message: 'validation.numbersOnlyShort' }),
    high: z.string().min(1, { message: 'validation.required' }).regex(/^\d+(\.\d+)?$/, { message: 'validation.numbersOnlyShort' }),
});

export type CreateExerciseTypeFormData = z.infer<typeof createExerciseTypeSchema>;