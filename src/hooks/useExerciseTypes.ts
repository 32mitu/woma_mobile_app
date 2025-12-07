import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

export const useExerciseTypes = (userProfile: any) => {
  const [availableTypes, setAvailableTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Web版とIDや構造を合わせたデフォルトデータ
  const defaultTypes = [
    { id: 'default_running', name: 'ランニング', metsValues: { '低': 6, '中': 8, '高': 10 }, isCustom: false },
    { id: 'default_walking', name: 'ウォーキング', metsValues: { '低': 3, '中': 4, '高': 5 }, isCustom: false },
    { id: 'default_training', name: '筋トレ', metsValues: { '低': 3, '中': 5, '高': 8 }, isCustom: false },
    // 必要に応じてWeb版のデフォルトと揃えてください
  ];

  useEffect(() => {
    if (!userProfile?.uid) {
      setAvailableTypes(defaultTypes);
      setLoading(false);
      return;
    }

    // ★修正ポイント1: コレクション名を 'userExerciseTypes' に変更
    // ★修正ポイント2: 検索条件を 'userId' に変更
    // ※ Web版に合わせて orderBy は一旦外しています（インデックスエラー回避のため）。
    //   並び替えが必要な場合はクライアント側（JavaScript）で行うのが安全です。
    const q = query(
      collection(db, 'userExerciseTypes'),
      where('userId', '==', userProfile.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customTypes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isCustom: true
      }));
      // 新しい順などに並び替えたい場合はここで sort する
      // .sort((a, b) => b.createdAt - a.createdAt);
      
      setAvailableTypes([...defaultTypes, ...customTypes]);
      setLoading(false);
    }, (error) => {
      console.error("運動種目の取得エラー:", error);
      // エラー時もデフォルトだけは表示しておく
      setAvailableTypes(defaultTypes);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile]);

  // 新規作成
  const createNewExerciseType = async (data: { name: string, low: number, mid: number, high: number }) => {
    if (!userProfile?.uid) return;
    
    // ★修正ポイント3: 書き込み先も 'userExerciseTypes' に変更
    // ★修正ポイント4: フィールド名を 'userId' に変更
    // ★修正ポイント5: キー名を Web版に合わせて日本語 ('低', '中', '高') に統一
    await addDoc(collection(db, 'userExerciseTypes'), {
      name: data.name,
      metsValues: {
        '低': Number(data.low),
        '中': Number(data.mid),
        '高': Number(data.high)
      },
      userId: userProfile.uid, 
      createdAt: serverTimestamp()
    });
  };

  // 削除
  const deleteExerciseType = async (typeId: string) => {
    // ★修正ポイント6: 削除先も合わせる
    await deleteDoc(doc(db, 'userExerciseTypes', typeId));
  };

  return { availableTypes, loading, createNewExerciseType, deleteExerciseType };
};