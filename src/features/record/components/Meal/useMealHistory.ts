import { useState, useCallback } from 'react';
import { collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
// パスは5階層戻る形
import { db } from '../../../../../firebaseConfig';
import { useAuth } from '../../../auth/useAuth';
import { ScannedFoodData } from './BarcodeScanner';

export interface MealTemplate {
    id: string;
    name: string;
    items: ScannedFoodData[];
}

export const useMealHistory = () => {
    const { user } = useAuth();
    const [historyItems, setHistoryItems] = useState<ScannedFoodData[]>([]);
    const [templates, setTemplates] = useState<MealTemplate[]>([]);
    const [loading, setLoading] = useState(false);

    // 履歴の取得
    const fetchHistory = useCallback(async () => {
        if (!user) {
            console.log("[useMealHistory] User is not logged in. Skipping fetch.");
            return;
        }
        setLoading(true);
        console.log(`[useMealHistory] Fetching history for userId: ${user.uid}`);

        try {
            // クエリ構築
            const itemsRef = collection(db, 'meal_records');
            const q = query(
                itemsRef,
                where('userId', '==', user.uid),
                orderBy('createdAt', 'desc'),
                limit(30)
            );

            console.log("[useMealHistory] Executing Firestore query...");

            const snapshot = await getDocs(q);

            console.log(`[useMealHistory] Query successful. Found ${snapshot.size} records.`);

            const uniqueItems = new Map<string, ScannedFoodData>();

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.items && Array.isArray(data.items)) {
                    data.items.forEach((item: ScannedFoodData) => {
                        // 食品名+カロリーをキーにして重複排除
                        const key = `${item.name}-${item.calories}`;
                        if (!uniqueItems.has(key)) {
                            uniqueItems.set(key, item);
                        }
                    });
                }
            });

            console.log(`[useMealHistory] Extracted ${uniqueItems.size} unique items.`);
            setHistoryItems(Array.from(uniqueItems.values()));
        } catch (error: any) {
            console.error("[useMealHistory] !!! FETCH ERROR !!!");
            console.error("Error Code:", error.code);
            console.error("Error Message:", error.message);
            // インデックスエラーの可能性がある場合、リンクを表示
            if (error.message && error.message.includes('index')) {
                console.error("★Index Error Detected. Check the link in the error message above.");
            }
        } finally {
            setLoading(false);
        }
    }, [user]);

    // マイセットの取得
    const fetchTemplates = useCallback(async () => {
        if (!user) return;
        try {
            console.log("[useMealHistory] Fetching templates...");
            const q = query(
                collection(db, `users/${user.uid}/meal_templates`),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            const fetchedTemplates = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as MealTemplate[];

            console.log(`[useMealHistory] Found ${fetchedTemplates.length} templates.`);
            setTemplates(fetchedTemplates);
        } catch (error: any) {
            console.error("[useMealHistory] Template fetch error:", error.message);
        }
    }, [user]);

    // マイセットの保存
    const saveTemplate = async (name: string, items: ScannedFoodData[]) => {
        if (!user || items.length === 0) return;
        try {
            await addDoc(collection(db, `users/${user.uid}/meal_templates`), {
                name,
                items,
                uid: user.uid,
                createdAt: serverTimestamp()
            });
            await fetchTemplates(); // リスト更新
        } catch (error) {
            console.error("テンプレート保存エラー:", error);
            throw error;
        }
    };

    // マイセットの削除
    const deleteTemplate = async (templateId: string) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, `users/${user.uid}/meal_templates`, templateId));
            setTemplates(prev => prev.filter(t => t.id !== templateId));
        } catch (error) {
            console.error("削除エラー:", error);
        }
    };

    return {
        historyItems,
        templates,
        loading,
        fetchHistory,
        fetchTemplates,
        saveTemplate,
        deleteTemplate
    };
};