export interface Badge {
    id: string;
    name: string;
    icon: string;
    description: string;
    condition: (stats: { steps: number; streak: number; totalCalories: number }) => boolean;
}

export const BADGES: Badge[] = [
    {
        id: 'step_10k',
        name: '一万歩ウォーカー',
        icon: '👟',
        description: '1日で10,000歩を達成する',
        condition: ({ steps }) => steps >= 10000,
    },
    {
        id: 'streak_3',
        name: '三日坊主卒業',
        icon: '🐣',
        description: '3日連続で記録をつける',
        condition: ({ streak }) => streak >= 3,
    },
    {
        id: 'streak_7',
        name: '継続の達人',
        icon: '🔥',
        description: '7日連続で記録をつける',
        condition: ({ streak }) => streak >= 7,
    },
    {
        id: 'calorie_500',
        name: '燃焼系',
        icon: '🍖',
        description: '1回の記録で500kcal消費する',
        condition: ({ totalCalories }) => totalCalories >= 500,
    },
];