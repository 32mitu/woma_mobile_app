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

    // today文字列からDateオブジェクトを生成して昨日を計算
    // 注意: new Date(string) はUTCとして解釈される場合があるが、YYYY-MM-DD形式かつ
    // getLocalDateStringがローカル時間を返す前提であれば、単純な日付操作として一貫性は保たれる。
    // ただし念のため、T00:00:00をつけて確実にローカルタイムとして扱うか、
    // あるいはDate操作せずに文字列操作だけでやる方が安全だが、ここではDate経由で修正する。
    const todayDate = new Date(today);
    const yesterdayDate = new Date(todayDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterdayDate);

    console.log(`[GameUtils] 昨日: ${yesterdayStr}`);

    if (lastLogDate === yesterdayStr) {
        console.log('[GameUtils] 昨日の記録あり -> streak increment');
        return 'increment';
    } else {
        console.log('[GameUtils] 連続記録途切れ -> streak reset to 1');
        return 1;
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