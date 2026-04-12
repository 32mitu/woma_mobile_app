import { useState, useCallback, useEffect } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
// 修正: 階層が深いため ../ を5つに増やす
import { db } from '../../../../../firebaseConfig';
// 修正: featuresフォルダまで戻るため ../ を3つに増やす
import { useAuth } from '../../../auth/useAuth';

export interface DailyNutrition {
    calories: number;
    protein: number; // g
    fat: number;     // g
    carbs: number;   // g
}

export const useDailyNutrition = () => {
    const { user } = useAuth();
    const [nutrition, setNutrition] = useState<DailyNutrition>({ calories: 0, protein: 0, fat: 0, carbs: 0 });
    const [loading, setLoading] = useState(false);

    const fetchDailyNutrition = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            // 今日の00:00:00を取得
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            // Firestoreから今日の記録を取得
            // 複合インデックス不要のため userId のみでクエリし、クライアント側で日付フィルタ
            const q = query(
                collection(db, 'meal_records'),
                where('userId', '==', user.uid)
            );

            const snapshot = await getDocs(q);

            let totalCal = 0;
            let totalP = 0;
            let totalF = 0;
            let totalC = 0;

            snapshot.docs.forEach(doc => {
                const data = doc.data();

                // クライアント側で今日のレコードのみフィルタ
                const createdAt = data.createdAt instanceof Timestamp
                    ? data.createdAt.toDate()
                    : data.createdAt?.toDate?.();
                if (!createdAt || createdAt < startOfDay) return;

                // 合計カロリー加算
                totalCal += data.totalCalories || 0;

                // アイテムごとのPFC加算
                if (data.items && Array.isArray(data.items)) {
                    data.items.forEach((item: any) => {
                        totalP += item.protein || 0;
                        totalF += item.fat || 0;
                        totalC += item.carbs || 0;
                    });
                }
            });

            setNutrition({
                calories: Math.round(totalCal),
                protein: Math.round(totalP),
                fat: Math.round(totalF),
                carbs: Math.round(totalC)
            });

        } catch (error) {
            console.error("栄養取得エラー:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchDailyNutrition();
    }, [fetchDailyNutrition]);

    return { nutrition, loading, refetch: fetchDailyNutrition };
};