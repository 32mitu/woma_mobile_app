import { BADGES } from '../data/badges';

// ローカルタイムで YYYY-MM-DD を取得するヘルパー
export const getLocalDateString = (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    // console.log(`[GameUtils] getLocalDateString: ${dateStr}`); // 必要ならコメントアウト解除
    return dateStr;
};

// ストリーク計算ロジック
export const calculateStreak = (lastLogDate: string | undefined | null, today: string) => {
    console.log(`[GameUtils] calculateStreak - lastLogDate: ${lastLogDate}, today: ${today}`);

    if (!lastLogDate) {
        console.log('[GameUtils] 初回記録 -> streak 1');
        return 1;
    }
    if (lastLogDate === today) {
        console.log('[GameUtils] 本日記録済み -> streak維持');
        return undefined;
    }

    // 'YYYY-MM-DD' 文字列を new Date() に渡すと UTC 午前0時として解釈されるため
    // UTC-5 以西のタイムゾーンでは getDate() が前日を返すバグが起きる。
    // 年/月/日を個別に渡すコンストラクタを使いローカルタイムで生成する。
    const [y, m, d] = today.split('-').map(Number);
    const todayDate = new Date(y, m - 1, d);
    const yesterdayDate = new Date(todayDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterdayDate);

    console.log(`[GameUtils] 昨日: ${yesterdayStr}`);

    if (lastLogDate === yesterdayStr) {
        console.log('[GameUtils] 昨日の記録あり -> streak increment');
        return 'increment';
    } else {
        console.log('[GameUtils] 連続記録途切れ -> streak reset to 1');
        return 'reset';
    }
};

// 新規バッジ獲得チェック
export const checkNewBadges = (
    currentBadges: string[] = [],
    stats: { steps: number; streak: number; totalCalories: number }
) => {
    console.log('[GameUtils] checkNewBadges - current:', currentBadges, 'stats:', stats);

    const earnedBadges = BADGES.filter((badge) => {
        // すでに持っているバッジは除外
        if (currentBadges.includes(badge.id)) return false;

        // 条件判定
        const isEarned = badge.condition(stats);
        if (isEarned) {
            console.log(`[GameUtils] バッジ条件達成: ${badge.name} (${badge.id})`);
        }
        return isEarned;
    });

    return earnedBadges;
};